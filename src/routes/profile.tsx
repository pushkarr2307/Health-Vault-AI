import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile Settings — HealthVault AI" }] }),
  component: Profile,
});

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  phone: string | null;
  avatar_url: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  address: string | null;
  emergency_language: string | null;
};

function Profile() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [form, setForm] = useState<ProfileRow>({
    full_name: "",
    email: "",
    date_of_birth: "",
    blood_group: "O+",
    phone: "",
    avatar_url: null,
    gender: "",
    height_cm: null,
    weight_kg: null,
    address: "",
    emergency_language: "",
  });

useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const d = data as Record<string, unknown> | null;
      setForm({
        full_name: (d?.full_name as string) ?? "",
        email: (d?.email as string) ?? user.email ?? "",
        date_of_birth: (d?.date_of_birth as string) ?? "",
        blood_group: (d?.blood_group as string) ?? "O+",
        phone: (d?.phone as string) ?? "",
        avatar_url: (d?.avatar_url as string) ?? null,
        gender: (d?.gender as string) ?? "",
        height_cm: (d?.height_cm as number) ?? null,
        weight_kg: (d?.weight_kg as number) ?? null,
        address: (d?.address as string) ?? "",
        emergency_language: (d?.emergency_language as string) ?? "",
      });
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true); setStatus(null);

    if (form.height_cm !== null && (isNaN(form.height_cm) || form.height_cm <= 0)) {
      setStatus({ kind: "err", msg: "Height must be a positive number." });
      setSaving(false);
      return;
    }
    if (form.weight_kg !== null && (isNaN(form.weight_kg) || form.weight_kg <= 0)) {
      setStatus({ kind: "err", msg: "Weight must be a positive number." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: form.full_name || null,
      email: form.email || null,
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group || null,
      phone: form.phone || null,
      avatar_url: form.avatar_url,
      gender: form.gender || null,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      address: form.address || null,
      emergency_language: form.emergency_language || null,
    } as any);
    setSaving(false);
    setStatus(error ? { kind: "err", msg: error.message } : { kind: "ok", msg: "Profile saved." });
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true); setStatus(null);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) { setStatus({ kind: "err", msg: upErr.message }); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    setForm((f) => ({ ...f, avatar_url: url }));
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: url });
    setUploading(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-[var(--muted-ink)]" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Profile Settings</h2>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="relative">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-bold text-white ring-4 ring-white shadow-md">
                {(form.full_name || form.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-md disabled:opacity-60"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadAvatar(f);
              }}
            />
          </div>
        </div>
        <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Full Name" value={form.full_name ?? ""} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Email Address" value={form.email ?? ""} type="email" onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Date of Birth" value={form.date_of_birth ?? ""} type="date" onChange={(v) => setForm({ ...form, date_of_birth: v })} />
          <SelectField label="Blood Group" value={form.blood_group ?? "O+"} options={["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]} onChange={(v) => setForm({ ...form, blood_group: v })} />
          <Field label="Phone Number" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <SelectField label="Gender" value={form.gender ?? ""} options={["Male", "Female", "Other", "Prefer not to say"]} onChange={(v) => setForm({ ...form, gender: v })} />
          <Field label="Height (cm)" value={form.height_cm?.toString() ?? ""} type="number" onChange={(v) => setForm({ ...form, height_cm: v === "" ? null : parseFloat(v) })} />
          <Field label="Weight (kg)" value={form.weight_kg?.toString() ?? ""} type="number" onChange={(v) => setForm({ ...form, weight_kg: v === "" ? null : parseFloat(v) })} />
          <SelectField label="Emergency Language" value={form.emergency_language ?? ""} options={["English", "Hindi", "Gujarati"]} onChange={(v) => setForm({ ...form, emergency_language: v })} />
          <div className="sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Address</span>
              <textarea
                value={form.address ?? ""}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setForm({ ...form, address: e.target.value });
                  }
                }}
                maxLength={250}
                rows={3}
                className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-[var(--muted-ink)]">
                {(form.address ?? "").length}/250
              </p>
            </label>
          </div>
        </form>
        {status && (
          <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${status.kind === "ok" ? "bg-emerald-50 text-[var(--emerald)]" : "bg-red-50 text-red-600"}`}>
            {status.msg}
          </p>
        )}
        <div className="mt-8 flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}