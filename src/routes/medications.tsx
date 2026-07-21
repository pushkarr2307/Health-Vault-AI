import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Pill, Plus, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/medications")({
  head: () => ({ meta: [{ title: "Medications — HealthVault AI" }] }),
  component: Medications,
});

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  time_of_day: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

const COLORS = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
];

function fmtDate(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return v;
  }
}

function Medications() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"Current" | "Past">("Current");
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    time_of_day: "",
    start_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setMeds((data ?? []) as Medication[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = meds.filter((m) => (tab === "Current" ? m.active : !m.active));

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: form.name.trim(),
      dosage: form.dosage || null,
      frequency: form.frequency || null,
      time_of_day: form.time_of_day || null,
      start_date: form.start_date || null,
      notes: form.notes || null,
      active: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    setForm({ name: "", dosage: "", frequency: "", time_of_day: "", start_date: new Date().toISOString().slice(0, 10), notes: "" });
    await load();
  };

  const toggleActive = async (m: Medication) => {
    const { error } = await supabase
      .from("medications")
      .update({ active: !m.active, end_date: m.active ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", m.id);
    if (error) setError(error.message);
    else await load();
  };

  const remove = async (m: Medication) => {
    const { error } = await supabase.from("medications").delete().eq("id", m.id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <AppShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Medications</h2>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}
        <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1">
          {(["Current", "Past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                tab === t ? "bg-[var(--brand)] text-white" : "text-[var(--muted-ink)]"
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
              No {tab.toLowerCase()} medications.
            </div>
          ) : filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${COLORS[i % COLORS.length]}`}>
                  <Pill size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {m.name}{m.dosage ? ` ${m.dosage}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted-ink)]">
                    {[m.frequency, m.time_of_day].filter(Boolean).join(" · ") || "—"}
                    {m.start_date ? ` · Started on ${fmtDate(m.start_date)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(m)}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                    m.active ? "bg-emerald-50 text-[var(--emerald)]" : "bg-slate-100 text-[var(--muted-ink)]"
                  }`}
                >
                  {m.active ? "Active" : "Completed"}
                </button>
                <button
                  onClick={() => remove(m)}
                  className="rounded-lg p-2 text-[var(--muted-ink)] hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div>
            <p className="text-sm font-semibold">Don't forget your medicines!</p>
            <p className="text-xs text-[var(--muted-ink)]">We will remind you on time.</p>
          </div>
          <Bell className="text-amber-500" />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Medicine</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Name (e.g. Amlodipine)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Dosage (5mg)"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
                <input
                  placeholder="Frequency (1 tablet)"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Time (Morning)"
                  value={form.time_of_day}
                  onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
                  className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted-ink)] hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}