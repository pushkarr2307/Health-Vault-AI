import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Loader2, Trash2, X, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments — HealthVault AI" }] }),
  component: Appointments,
});

type Appointment = {
  id: string;
  title: string;
  doctor: string | null;
  location: string | null;
  appointment_at: string;
  notes: string | null;
  status: string;
};

function fmt(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function Appointments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", doctor: "", location: "", appointment_at: "", notes: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("appointments").select("*").order("appointment_at", { ascending: false });
    if (error) setError(error.message);
    else setItems((data ?? []) as Appointment[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const save = async () => {
    if (!user || !form.title.trim() || !form.appointment_at) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      title: form.title.trim(),
      doctor: form.doctor || null,
      location: form.location || null,
      appointment_at: new Date(form.appointment_at).toISOString(),
      notes: form.notes || null,
      status: "scheduled",
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: "", doctor: "", location: "", appointment_at: "", notes: "" });
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <AppShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Appointments</h2>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-4 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Add Visit
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--muted-ink)]"><Loader2 size={20} className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center text-sm text-[var(--muted-ink)]">
              No appointments yet. Click "Add Visit" to schedule one.
            </div>
          ) : items.map((v, i) => {
            const { date, time } = fmt(v.appointment_at);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{v.title}</p>
                    <p className="text-xs text-[var(--muted-ink)]">
                      {[v.doctor, v.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-ink)]">{date} · {time}</p>
                  </div>
                </div>
                <button onClick={() => remove(v.id)} aria-label="Delete" className="rounded-lg p-2 text-[var(--muted-ink)] hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Visit</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <input placeholder="Title (e.g. Cardiology follow-up)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input placeholder="Doctor (optional)" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input placeholder="Location (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input type="datetime-local" value={form.appointment_at} onChange={(e) => setForm({ ...form, appointment_at: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <textarea placeholder="Notes (optional)" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted-ink)] hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.appointment_at} className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}