import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Loader2, X, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Health Timeline — HealthVault AI" }] }),
  component: Timeline,
});

type TimelineEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
};

const TONE: Record<string, { card: string; node: string }> = {
  Diagnosis: { card: "bg-rose-50 border-rose-200", node: "bg-rose-500" },
  Test: { card: "bg-blue-50 border-blue-200", node: "bg-blue-500" },
  Treatment: { card: "bg-amber-50 border-amber-200", node: "bg-amber-500" },
  Note: { card: "bg-emerald-50 border-emerald-200", node: "bg-emerald-500" },
};

function fmt(v: string) {
  try { return new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return v; }
}

function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ event_type: "Note", title: "", description: "", event_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("timeline").select("*").order("event_date", { ascending: false });
    if (error) setError(error.message);
    else setEvents((data ?? []) as TimelineEvent[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const save = async () => {
    if (!user || !form.title.trim() || !form.event_date) return;
    setSaving(true); setError(null);
    const { error } = await supabase.from("timeline").insert({
      user_id: user.id,
      event_type: form.event_type,
      title: form.title.trim(),
      description: form.description || null,
      event_date: form.event_date,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ event_type: "Note", title: "", description: "", event_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("timeline").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <AppShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Health Timeline</h2>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Add Event
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--muted-ink)]"><Loader2 size={20} className="animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center text-sm text-[var(--muted-ink)]">
            No timeline events yet. Add your first entry to start tracking.
          </div>
        ) : (
          <div className="relative mt-6 space-y-5 pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-[#E5E7EB]" />
            {events.map((e, i) => {
              const tone = TONE[e.event_type] ?? TONE.Note;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative"
                >
                  <span className={`absolute -left-6 top-3 h-3 w-3 rounded-full ring-4 ring-white ${tone.node}`} />
                  <div className={`flex items-start justify-between gap-3 rounded-xl border ${tone.card} p-4`}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--muted-ink)]">{fmt(e.event_date)} · {e.event_type}</p>
                      <p className="mt-1 text-sm font-semibold">{e.title}</p>
                      {e.description && <p className="text-xs text-[var(--muted-ink)]">{e.description}</p>}
                    </div>
                    <button onClick={() => remove(e.id)} aria-label="Delete" className="shrink-0 rounded-lg p-1.5 text-[var(--muted-ink)] hover:bg-white/60 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Event</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
                {["Note", "Diagnosis", "Test", "Treatment"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted-ink)] hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.event_date} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}