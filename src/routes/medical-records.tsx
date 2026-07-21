import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Upload, Loader2, Trash2, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/medical-records")({
  head: () => ({ meta: [{ title: "Medical Records — HealthVault AI" }] }),
  component: MedicalRecords,
});

const tabs = ["All", "Reports", "Prescriptions", "Scans", "Lab Reports"] as const;
type Tab = (typeof tabs)[number];

type Record = {
  id: string;
  name: string;
  category: string;
  place: string | null;
  record_date: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

const ACCEPT = ".pdf,.png,application/pdf,image/png";

function formatDate(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return v;
  }
}

function MedicalRecords() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("All");
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRecords((data ?? []) as Record[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = tab === "All" ? records : records.filter((r) => r.category === tab);

  const onFileSelected = async (file: File) => {
    if (!user) return;
    setError(null);

    const allowed = ["application/pdf", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF and PNG files are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large (max 20 MB).");
      return;
    }

    const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

    const downloadFileAsBlob = async (file_path: string) => {
      const bucket = supabase.storage.from("medical_records");
      const { data: signedData, error: signedErr } = await bucket.createSignedUrl(file_path, 300);
      if (signedErr) throw signedErr;
      if (!signedData?.signedUrl) throw new Error("Could not create a signed URL for the uploaded file.");
      console.log("[AI] Signed URL creation success", { filePath: file_path, expiresInSeconds: 300 });

      const res = await fetch(signedData.signedUrl);
      if (!res.ok) throw new Error(`Failed to download uploaded file blob (${res.status}).`);
      return await res.blob();
    };

    const fileToDataUrl = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });

    const extractMedicalTextWithGeminiOCR = async (blob: Blob, mimeType: string) => {
      if (!openrouterApiKey) throw new Error("OpenRouter API key is not configured.");

      // Per requirements: download file as Blob, OCR via google/gemini-2.5-flash.
      // For simplicity/compatibility, send the image directly for PNG and also for PDF
      // (if the model rejects PDF, it will fail gracefully and upload will still succeed).
      // If PDF->images OCR is needed, we would require a PDF renderer dependency.
      const dataUrl = await fileToDataUrl(blob);

      const payload = {
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        max_tokens: 3072,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "You are performing OCR for medical documents. Extract ALL readable text from the uploaded report. " +
                  "Preserve headings, section structure, lists, tables (as plain text), dates, measurements, and medication names/dosages. " +
                  "Return only the extracted text with minimal formatting. If something is unreadable, transcribe best-effort and mark unclear parts as [unclear].",
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 120_000);

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = "";
          try {
            const errJson = await res.json();
            detail = errJson?.error?.message || errJson?.message || errJson?.detail || "";
          } catch {
            // ignore
          }
          throw new Error(`Gemini OCR request failed (${res.status}).${detail ? ` ${detail}` : ""}`);
        }

        const data: any = await res.json();
        const extracted: string | undefined =
          data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;

        return (extracted ?? "").trim();
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    const extractStructuredMedicalJSONWithDeepSeek = async (extractedText: string) => {
      if (!openrouterApiKey) throw new Error("OpenRouter API key is not configured.");

      const payload = {
        model: "deepseek/deepseek-chat-v3-0324",
        temperature: 0.1,
        max_tokens: 512,
        messages: [
          {
            role: "system",
            content:
              "You extract structured medical information from a report. Return ONLY valid JSON (no markdown, no commentary). Always return exactly these keys with values being null when not found. Never invent values.",
          },
          {
            role: "user",
            content:
              "Extract the following fields from the report text below and return ONLY JSON in this exact format:\n" +
              "{\n" +
              '  "diagnosis": null,\n' +
              '  "blood_pressure": null,\n' +
              '  "blood_sugar": null,\n' +
              '  "hba1c": null,\n' +
              '  "cholesterol": null,\n' +
              '  "weight": null,\n' +
              '  "bmi": null,\n' +
              '  "doctor_notes": null\n' +
              "}\n\n" +
              "Rules:\n" +
              "- Never invent values\n" +
              "- If a field does not exist, return null\n\n" +
              "Report text:\n\n" +
              extractedText,
          },
        ],
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = "";
          try {
            const errJson = await res.json();
            detail = errJson?.error?.message || errJson?.message || errJson?.detail || "";
          } catch {
            // ignore
          }
          throw new Error(`DeepSeek structured JSON extraction failed (${res.status}).${detail ? ` ${detail}` : ""}`);
        }

        const data: any = await res.json();
        const content: string | undefined = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
        const text = (content ?? "").trim();

        console.log("RAW STRUCTURED RESPONSE:");
        console.log(text);

        let cleaned = text.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/, "")
            .trim();
        }

        // If model wrapped JSON in markdown but included leading/trailing whitespace/newlines,
        // try a more robust cleanup.
        cleaned = cleaned.replace(/^\s*```json\s*/i, "").replace(/^\s*```\s*/i, "");
        cleaned = cleaned.replace(/\s*```\s*$/i, "");
        cleaned = cleaned.trim();

        console.log(cleaned);

        try {
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("JSON Parse Error", cleaned, e);
          throw e;
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    const summarizeWithDeepSeek = async (extractedText: string) => {

      if (!openrouterApiKey) throw new Error("OpenRouter API key is not configured.");

      const payload = {
        model: "deepseek/deepseek-chat-v3-0324",
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You are a clinical documentation assistant. Convert extracted medical text into a clean, accurate medical summary. " +
              "Do not invent information. If something is missing or unreadable, say it is not available. " +
              "Write in plain language appropriate for a patient, while preserving key medical details. " +
              "Avoid speculation; keep it factual.",
          },
          {
            role: "user",
            content:
              "Extracted report text (verbatim/near-verbatim):\n\n" +
              extractedText +
              "\n\nNow generate a clean medical summary with these sections if possible:\n" +
              "- Impression / Summary\n" +
              "- Key Findings (labs/imaging/measurements)\n" +
              "- Diagnoses/Conditions (if present)\n" +
              "- Medications / Treatment (if present)\n" +
              "- Recommendations / Next Steps (if present)\n\n" +
              "Return only the summary.",
          },
        ],
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = "";
          try {
            const errJson = await res.json();
            detail = errJson?.error?.message || errJson?.message || errJson?.detail || "";
          } catch {
            // ignore
          }
          throw new Error(`DeepSeek summarization failed (${res.status}).${detail ? ` ${detail}` : ""}`);
        }

        const data: any = await res.json();
        const summary: string | undefined =
          data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;

        return (summary ?? "").trim();
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    setUploading(true);

    const uniqueId =
      Date.now().toString() + "-" + Math.random().toString(36).substring(2, 10);
    const ext = file.type === "application/pdf" ? "pdf" : "png";
    const path = `${user.id}/${uniqueId}.${ext}`;

      const { error: upErr } = await supabase.storage
      .from("medical_records")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      console.error("[AI] Storage upload failed", upErr?.message, upErr);
      setError(upErr.message);
      setUploading(false);
      return;
    }

    console.log("[AI] Storage upload success", {
      filePath: path,
      contentType: file.type,
      size: file.size,
      mimeType: file.type,
    });

    // Capture the inserted row so we can use ONLY insertedRecord.id for updates/verification.
    let insertedRecordId: string | null = null;
    const { error: insErr, data: insertedRecord } = await supabase
      .from("health_records")
      .insert({
        user_id: user.id,
        name: file.name.replace(/\.[^.]+$/, ""),
        category: "Reports",
        file_path: path,
        file_type: ext.toUpperCase(),
        file_size: file.size,
        mime_type: file.type,
        record_date: new Date().toISOString().slice(0, 10),
      })
      .select("*")
      .single();

    if (insErr) {
      // rollback storage object
      await supabase.storage.from("medical_records").remove([path]);
      setError(insErr.message);
      setUploading(false);
      return;
    }

    insertedRecordId = (insertedRecord as any)?.id ?? null;

    console.log("[AI] Inserted ID:", insertedRecordId);


    console.log("[AI] Database insert success", {
      id: insertedRecordId,
      filePath: path,
      recordDate: new Date().toISOString().slice(0, 10),
    });

    // Insert a notification for the upload
    await (supabase.from("notifications" as any) as any).insert({
      user_id: user.id,
      title: "Medical Report Uploaded",
      message:
        "Your medical report has been uploaded successfully and is ready for AI analysis.",
      type: "report",
      is_read: false,
    });

    // Upload flow must not be blocked by AI processing.
    setUploading(false);
    await load();

    // AI pipeline: run in the background; failures must not affect the already-uploaded record.
    (async () => {
      try {
        console.log("[AI] Starting background pipeline", {
          userId: user.id,
          filePath: path,
          insertedRecordId,
        });

        // 3) Blob download success (signed URL creation will be logged inside downloadFileAsBlob)
        console.log("[AI] Blob download success: begin", { filePath: path });
        const blob = await downloadFileAsBlob(path);
        console.log("[AI] Blob download success: end", { blobSize: blob?.size });

        // 4-8) Gemini OCR raw API response + extracted OCR text details
        console.log("[AI] Gemini request payload started");
        const extractedText = await extractMedicalTextWithGeminiOCR(blob, file.type);
        console.log("[AI] Extracted OCR text (first 500 chars):", (extractedText ?? "").slice(0, 500));
        console.log("[AI] Extracted OCR text length:", extractedText?.length ?? 0);

        console.log("[AI] Gemini OCR completed");


        if (!extractedText) {
          console.warn("[AI] AI extraction returned empty text; skipping summary generation.");
          return;
        }

        console.log("[AI] DeepSeek summary: begin");
        const summary = await summarizeWithDeepSeek(extractedText);
        console.log("[AI] DeepSeek summary: end", { summaryPreview: (summary ?? "").slice(0, 200) });
        if (!summary) return;

        console.log("[AI] DeepSeek structured JSON extraction: begin");
        const structured = await extractStructuredMedicalJSONWithDeepSeek(extractedText);
        console.log("[AI] DeepSeek structured JSON extraction: end", { structured });

        // structured is expected to be JSON object with nulls for missing fields
        const updateStructured = {
          diagnosis: structured?.diagnosis ?? null,
          blood_pressure: structured?.blood_pressure ?? null,
          blood_sugar: structured?.blood_sugar ?? null,
          hba1c: structured?.hba1c ?? null,
          cholesterol: structured?.cholesterol ?? null,
          weight: structured?.weight ?? null,
          bmi: structured?.bmi ?? null,
          doctor_notes: structured?.doctor_notes ?? null,
        };

        console.log("[AI] Supabase health_records update: begin", {
          id: insertedRecordId,
          report_summary_preview: summary.slice(0, 120),
          updateStructured,
        });

        // Only update using insertedRecord.id (already stored in insertedRecordId)
        const { error: updErr, data: updateResult } = await supabase
          .from("health_records")
          .update(({ report_summary: summary, ...updateStructured } as any))
          .eq("id", insertedRecordId ?? "")
          .select();

        console.log("[AI] Update Result:", updateResult);

        console.log("[AI] Supabase health_records update: end", { updErr, updateResult });

        console.log("[AI] Inserted ID:", insertedRecordId);

        if (updErr) {
          console.error("Failed to update report_summary:", updErr);
        } else {
          // Immediately read the same row again for verification.
          try {
            const verify = await supabase
              .from("health_records")
              .select("*")
              .eq("id", insertedRecordId ?? "")
              .single();

            console.log("[AI] VERIFY ROW:", verify);
          } catch (verifyErr) {
            console.error("[AI] VERIFY ROW failed:", verifyErr);
          }
        }
      } catch (aiErr) {
        console.error("[AI] AI summary generation failed:", aiErr);
        // Never affect the upload UI; only log.
      }
    })();
  };

  const handleDownload = async (r: Record) => {
    const { data, error } = await supabase.storage
      .from("medical_records")
      .createSignedUrl(r.file_path, 60);
    if (error || !data) {
      setError(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (r: Record) => {
    setMenuOpenId(null);
    await supabase.storage.from("medical_records").remove([r.file_path]);
    const { error } = await supabase.from("health_records").delete().eq("id", r.id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <AppShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Medical Records</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload New"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onFileSelected(f);
            }}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-[var(--muted-ink)] hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--muted-ink)]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center text-sm text-[var(--muted-ink)]">
              No records yet. Upload a PDF or PNG to get started.
            </div>
          ) : (
            filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--brand)]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-[var(--muted-ink)]">
                      {formatDate(r.record_date ?? r.created_at)} · {r.place ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="relative flex items-center gap-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-[var(--muted-ink)]">
                    {r.file_type ?? "FILE"}
                  </span>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                    className="rounded-lg p-2 text-[var(--muted-ink)] hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpenId === r.id && (
                    <div className="absolute right-0 top-10 z-10 w-40 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDownload(r);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50"
                      >
                        <Download size={14} /> Open / Download
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted-ink)]">
            <p>Showing {filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}