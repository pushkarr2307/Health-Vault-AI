import { HeartPulse } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--emerald)] text-white shadow-sm">
        <HeartPulse className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-bold text-[var(--ink)]">
            Health<span className="text-[var(--emerald)]">Vault</span> AI
          </div>
          <div className="text-[10px] font-medium text-[var(--muted-ink)]">
            One Patient. One Record.
          </div>
        </div>
      )}
    </div>
  );
}