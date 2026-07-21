import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  FileText,
  HeartPulse,
  Pill,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HealthVault AI" }] }),
  component: Dashboard,
});

type RecentReport = { id: string; name: string; record_date: string | null; place: string | null; created_at: string };

function fmtDate(v: string | null) {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return v; }
}

function Dashboard() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [counts, setCounts] = useState({ reports: 0, meds: 0, appts: 0, contacts: 0 });
  const [reports, setReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, r, m, a, c, rr] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("health_records").select("id", { count: "exact", head: true }),
        supabase.from("medications").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("emergency_contacts").select("id", { count: "exact", head: true }),
        supabase.from("health_records").select("id,name,record_date,place,created_at").order("created_at", { ascending: false }).limit(3),
      ]);
      setDisplayName(p.data?.full_name?.trim() || user.email?.split("@")[0] || "there");
      setCounts({
        reports: r.count ?? 0,
        meds: m.count ?? 0,
        appts: a.count ?? 0,
        contacts: c.count ?? 0,
      });
      setReports((rr.data ?? []) as RecentReport[]);
    })();
  }, [user?.id]);

  const stats = [
    { label: "Reports", value: counts.reports, sub: "Total Reports", icon: FileText, tint: "bg-blue-50 text-[var(--brand)]" },
    { label: "Medications", value: counts.meds, sub: "Current Medicines", icon: Pill, tint: "bg-emerald-50 text-[var(--emerald)]" },
    { label: "Appointments", value: counts.appts, sub: "Total Visits", icon: CalendarDays, tint: "bg-amber-50 text-amber-600" },
    { label: "Contacts", value: counts.contacts, sub: "Emergency Contacts", icon: Users, tint: "bg-rose-50 text-rose-500" },
  ];

  return (
    <AppShell title={displayName ? `Hello, ${displayName} 👋` : "Hello 👋"} subtitle="Welcome back! Here's your health overview.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--muted-ink)]">{s.label}</p>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-xs text-[var(--muted-ink)]">{s.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Reports</h3>
            <Link to="/medical-records" className="text-xs font-semibold text-[var(--brand)]">View All</Link>
          </div>
          <div className="mt-4 space-y-3">
            {reports.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#E5E7EB] p-6 text-center text-sm text-[var(--muted-ink)]">
                No reports yet. Upload one from Medical Records.
              </p>
            )}
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-[var(--muted-ink)]">{fmtDate(r.record_date ?? r.created_at)}{r.place ? ` · ${r.place}` : ""}</p>
                  </div>
                </div>
                <Link to="/medical-records" className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50">View</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">AI Health Assistant</h3>
                <p className="mt-1 text-xs text-[var(--muted-ink)]">Ask anything about your health records.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                <Bot size={20} />
              </div>
            </div>
            <Link to="/ai-assistant" className="mt-4 block w-full rounded-xl bg-[var(--emerald)] py-2.5 text-center text-sm font-semibold text-white">Open Assistant</Link>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-blue-50 to-emerald-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Health Summary</h3>
              <HeartPulse className="text-rose-500" />
            </div>
            <p className="mt-2 text-xs text-[var(--muted-ink)]">Stay on top of your health. Keep your records updated.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}