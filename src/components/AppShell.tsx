import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bot,
  CalendarDays,
  CheckCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  QrCode,
  Settings,
  Timer,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

function notificationsQuery() {
  // Notifications table exists in the database but hasn't been added to the
  // generated Database types yet — cast to `any` to bypass strict table checks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from("notifications" as any);
}

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medical-records", label: "Medical Records", icon: FileText },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/timeline", label: "Health Timeline", icon: Timer },
  { to: "/emergency-qr", label: "Emergency QR", icon: QrCode },
  { to: "/profile", label: "Profile Settings", icon: Settings },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { signOut, user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifListLoading, setNotifListLoading] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user?.id]);

  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      setUnreadCount(0);
      setNotifLoading(false);
      return;
    }

    setNotifLoading(true);

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();

    let cancelled = false;

    async function fetchUnreadCount() {
      try {
        const { count, error } = await notificationsQuery()
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUserId)
          .eq("is_read", false);

        if (error) throw error;

        if (!cancelled) {
          setUnreadCount(count ?? 0);
        }
      } catch {
        // Silently fail — badge just won't show
        if (!cancelled) {
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setNotifLoading(false);
        }
      }
    }

    fetchUnreadCount();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    setNotifListLoading(true);
    try {
      const { data, error } = await notificationsQuery()
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setNotifications((data ?? []) as unknown as NotificationItem[]);
    } catch {
      setNotifications([]);
    } finally {
      setNotifListLoading(false);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    try {
      const { error } = await notificationsQuery()
        .update({ is_read: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true })),
      );
      setUnreadCount(0);
    } catch {
      // Silent
    }
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifDropdownOpen]);

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="mt-8 flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--muted-ink)] hover:bg-slate-50 hover:text-[var(--ink)]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          handleLogout();
        }}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--muted-ink)] hover:bg-slate-50 hover:text-[var(--ink)]"
      >
        <LogOut size={18} /> Logout
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[var(--ink)]">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-white px-4 py-6 lg:flex"
      >
        <div className="px-2">
          <Logo />
        </div>
        <NavList />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#E5E7EB] bg-white px-4 py-6 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-2">
                <Logo />
                <button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted-ink)] hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4 lg:px-10">
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[var(--ink)] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="truncate text-lg font-bold text-[var(--ink)] sm:text-2xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="truncate text-xs text-[var(--muted-ink)] sm:text-sm">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => {
                  if (!notifDropdownOpen) {
                    fetchNotifications();
                  }
                  setNotifDropdownOpen((v) => !v);
                }}
                className="relative rounded-full border border-[#E5E7EB] bg-white p-2.5 text-[var(--muted-ink)] hover:text-[var(--ink)]"
              >
                <Bell size={18} />
                {!notifLoading && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-5 text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-[#E5E7EB] bg-white shadow-lg sm:w-96">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                    <h3 className="text-sm font-semibold text-[var(--ink)]">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
                      >
                        <CheckCheck size={14} />
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifListLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bell size={24} className="mb-2 text-[var(--muted-ink)]" />
                        <p className="text-sm text-[var(--muted-ink)]">No notifications yet.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#E5E7EB]">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`px-4 py-3 transition hover:bg-slate-50 ${
                              !n.is_read ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-sm ${
                                    !n.is_read
                                      ? "font-semibold text-[var(--ink)]"
                                      : "font-medium text-[var(--muted-ink)]"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {n.message && (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-ink)]">
                                    {n.message}
                                  </p>
                                )}
                              </div>
                              {!n.is_read && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />
                              )}
                            </div>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white ring-2 ring-white">
                  {initial}
                </div>
              )}
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{displayName}</div>
                <div className="text-xs text-[var(--muted-ink)]">Patient</div>
              </div>
            </div>
          </div>
        </header>
        <motion.main
          key={pathname}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}