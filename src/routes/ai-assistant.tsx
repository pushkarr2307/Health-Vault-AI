import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — HealthVault AI" }] }),
  component: AIAssistant,
});

type Msg = { role: "user" | "ai"; text: string };

const SYSTEM_PROMPT =
  "You are HealthVault AI, a professional healthcare assistant. You answer only health-related questions. You can explain diseases, medicines, lab reports and healthy lifestyle recommendations. You never claim to replace a doctor. Always recommend consulting a qualified healthcare professional for diagnosis or emergencies.";

const initial: Msg[] = [
  {
    role: "ai",
    text: "Hi! 👋 I'm your AI Health Assistant. Ask me anything about your medical records, medications, or appointments.",
  },
];

function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  async function send() {
    if (typing) return;
    if (!input.trim()) return;

    const text = input.trim();
    // Only include user/ai chat turns in the API history; keep the initial greeting UI-only.
    const previousMessagesAll = messages.filter((m) => m !== initial[0]);
    const previousMessages = previousMessagesAll.slice(-10);

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);

    let timeoutId: number | undefined;

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
      if (!apiKey) {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.",
          },
        ]);
        return;
      }

      let context = "";
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const [
            profilesRes,
            recordsRes,
            medsRes,
            apptsRes,
            timelineRes,
            contactsRes,
          ] = await Promise.allSettled([
            supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single(),
            supabase
              .from("health_records")
              .select(
                "report_summary,diagnosis,blood_pressure,blood_sugar,hba1c,cholesterol,weight,bmi,doctor_notes,record_date,category,name"
              )
              .eq("user_id", user.id),
            supabase
              .from("medications")
              .select("*")
              .eq("user_id", user.id),
            supabase
              .from("appointments")
              .select("*")
              .eq("user_id", user.id),
            supabase
              .from("timeline")
              .select("*")
              .eq("user_id", user.id),
            supabase
              .from("emergency_contacts")
              .select("*")
              .eq("user_id", user.id),
          ]);

          const safe = (v: any) => (v === null || v === undefined ? "" : String(v));
          const getFulfilledValue = (r: any) => (r?.status === "fulfilled" ? r?.value : null);

          const profilesRow = getFulfilledValue(profilesRes)?.data ?? null;
          const healthRecords = getFulfilledValue(recordsRes)?.data ?? [];
          const medications = getFulfilledValue(medsRes)?.data ?? [];
          const appointments = getFulfilledValue(apptsRes)?.data ?? [];
          const timeline = getFulfilledValue(timelineRes)?.data ?? [];
          const emergencyContacts = getFulfilledValue(contactsRes)?.data ?? [];

          // If profiles lookup fails, attempt alternative lookup using id.
          let profiles = profilesRow;
          if (!profilesRow && profilesRes?.status === "fulfilled") {
            try {
              const alt = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id);
              if (alt?.data && Array.isArray(alt.data) && alt.data.length) {
                profiles = alt.data[0];
              }
            } catch {
              // ignore
            }
          }

          const p0: any = profiles;

          const patientName =
            safe(p0?.full_name || p0?.name || p0?.patient_name || p0?.first_name) || "Not available";
          const email = safe(p0?.email) || "Not available";
          const dob = safe(p0?.dob || p0?.date_of_birth) || "Not available";
          const age = safe(p0?.age) || "Not available";
          const gender = safe(p0?.gender) || "Not available";
          const bloodGroup = safe(p0?.blood_group || p0?.bloodGroup) || "Not available";
          const height = safe(p0?.height) || "Not available";
          const weight = safe(p0?.weight) || "Not available";

          const profileSectionLines = [
            `Patient Name: ${patientName}`,
            `Email: ${email}`,
            `DOB: ${dob}`,
            `Age: ${age}`,
            `Gender: ${gender}`,
            `Blood Group: ${bloodGroup}`,
            `Height: ${height}`,
            `Weight: ${weight}`,
          ];

          const recordsLines: string[] = [];
          for (const r of healthRecords || []) {
            const name = safe(r?.name);
            const category = safe(r?.category);
            const record_date = safe(r?.record_date);
            const report_summary = safe(r?.report_summary);
            const diagnosis = safe(r?.diagnosis);
            const blood_sugar = safe(r?.blood_sugar);
            const blood_pressure = safe(r?.blood_pressure);
            const hba1c = safe(r?.hba1c);
            const cholesterol = safe(r?.cholesterol);
            const weight = safe(r?.weight);
            const bmi = safe(r?.bmi);
            const doctor_notes = safe(r?.doctor_notes);

            recordsLines.push([
              "Medical Record:",
              `Name: ${name || "Not available"}`,
              `Category: ${category || "Not available"}`,
              `Date: ${record_date || "Not available"}`,
              `Summary: ${report_summary || "Not available"}`,
              `Diagnosis: ${diagnosis || "Not available"}`,
              `Blood Sugar: ${blood_sugar || "Not available"}`,
              `Blood Pressure: ${blood_pressure || "Not available"}`,
              `HbA1c: ${hba1c || "Not available"}`,
              `Cholesterol: ${cholesterol || "Not available"}`,
              `Weight: ${weight || "Not available"}`,
              `BMI: ${bmi || "Not available"}`,
              `Doctor Notes: ${doctor_notes || "Not available"}`,
            ].join("\n"));
          }

          const medsLines: string[] = [];
          for (const r of medications || []) {
            const medName = safe(r?.medicine_name || r?.name || r?.medicine);
            const dosage = safe(r?.dosage);
            const frequency = safe(r?.frequency);
            if (medName || dosage || frequency) {
              medsLines.push(
                `- ${medName || "Medication"}${dosage ? ` — ${dosage}` : ""}${frequency ? ` (${frequency})` : ""}`
              );
            }
          }

          const apptLines: string[] = [];
          for (const r of appointments || []) {
            const doctor = safe(r?.doctor || r?.provider);
            const date = safe(r?.date || r?.appointment_date);
            const status = safe(r?.status);
            if (doctor || date || status) {
              apptLines.push(
                `- ${doctor || "Doctor"}${date ? ` — ${date}` : ""}${status ? ` (${status})` : ""}`
              );
            }
          }

          const timelineLines: string[] = [];
          for (const r of timeline || []) {
            const event = safe(r?.event || r?.title || r?.description);
            const date = safe(r?.date || r?.created_at);
            if (event || date) {
              timelineLines.push(
                `- ${event || "Event"}${date ? ` — ${date}` : ""}`
              );
            }
          }

          const contactLines: string[] = [];
          for (const r of emergencyContacts || []) {
            const name = safe(r?.name);
            const relationship = safe(r?.relationship);
            const phone = safe(r?.phone);
            if (name || relationship || phone) {
              contactLines.push(
                `- ${name || "Contact"}${relationship ? ` (${relationship})` : ""}${phone ? ` — ${phone}` : ""}`
              );
            }
          }

          context = [
            "Patient Details:",
            ...profileSectionLines,
            "",
            "Medical Records:",
            recordsLines.length ? recordsLines.join("\n") : "- Not available",
            "",
            "Medications:",
            medsLines.length ? medsLines.join("\n") : "- Not available",
            "",
            "Appointments:",
            apptLines.length ? apptLines.join("\n") : "- Not available",
            "",
            "Timeline:",
            timelineLines.length ? timelineLines.join("\n") : "- Not available",
            "",
            "Emergency Contacts:",
            contactLines.length ? contactLines.join("\n") : "- Not available",
          ].join("\n");
        }
      } catch {
        // Gracefully degrade to no context
        context = "";
      }

      const systemWithContext = context
        ? `${SYSTEM_PROMPT}\n\nCurrent Patient Data:\n${context}\n\nRules:\n- Always answer using the provided patient data first.\n- Never say "I don't have access" if the data exists.\n- If a requested field is missing from the patient data, say it is not available.\n- Never invent or guess missing information.`
        : SYSTEM_PROMPT;

      const controller = new AbortController();
      const timeoutMs = 60_000;
      timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

      const payload = {
      model: "deepseek/deepseek-chat-v3-0324",
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemWithContext },

          ...previousMessages.map((mm) => ({
            // Ensure message roles are correct for OpenAI-compatible chat format

            role: mm.role === "user" ? "user" : "assistant",
            content: mm.text,
          })),

          {
            role: "user",
            content: text,
          },
        ],
      };

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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

        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: `Sorry — the AI request failed (${res.status}).${detail ? ` ${detail}` : ""}`,
          },
        ]);
        return;
      }

      const data: any = await res.json();
      const firstChoice = data?.choices?.[0];
      const content: string | undefined =
        firstChoice?.message?.content ??
        firstChoice?.text ??
        firstChoice?.message?.reasoning;

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: content?.trim() || "Sorry — I didn’t receive a response from the AI.",
        },
      ]);
    } catch (err: any) {
      const isAbort = err?.name === "AbortError";
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: isAbort
            ? "Sorry — the AI request timed out. Please try again."
            : "Sorry — something went wrong while contacting the AI. Please try again.",
        },
      ]);
    } finally {
      try {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      } finally {
        setTyping(false);
      }
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-180px)] flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Health Assistant</p>
              <p className="flex items-center gap-1 text-xs text-[var(--emerald)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" /> Online
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages(initial)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[var(--muted-ink)] hover:bg-slate-50"
          >
            <Trash2 size={14} /> Clear Chat
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-md ${m.role === "user" ? "" : "flex gap-3"}`}>
                {m.role === "ai" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <Bot size={14} />
                  </div>
                )}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === "user"
                      ? "bg-[var(--brand)] text-white"
                      : "border border-[#E5E7EB] bg-white text-[var(--ink)]"
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-ink)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                <Bot size={14} />
              </div>
              <div className="flex gap-1 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !typing && send()}
              placeholder="Type your question..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <button
              onClick={send}
              disabled={typing}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--emerald)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

