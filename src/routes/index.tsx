import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Cloud,
  HeartPulse,
  Layers,
  ShieldCheck,
  Siren,
  Sparkles,
  Activity,
  FileText,
  Lock,
  CheckCircle2,
  QrCode,
  Bell,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import heroDoctor from "@/assets/hero-doctor.png";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthVault AI — Your Intelligent Health Companion" },
      {
        name: "description",
        content:
          "Store, manage and access your complete medical history securely with the power of AI.",
      },
      { property: "og:title", content: "HealthVault AI" },
      {
        property: "og:description",
        content: "One Patient. One Health Record. Anywhere. Anytime.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "Secure & Private", desc: "Your data is encrypted and 100% secure." },
  { icon: Bot, title: "AI Assistant", desc: "Get answers from your medical history." },
  { icon: Layers, title: "All In One Place", desc: "Reports, prescriptions, tests and more." },
  { icon: Siren, title: "Emergency Ready", desc: "Share critical info in emergencies." },
];

const trustBadges = [
  { icon: ShieldCheck, label: "HIPAA Ready" },
  { icon: Sparkles, label: "AI Powered" },
  { icon: Cloud, label: "Secure Cloud Storage" },
];

const highlights = [
  {
    icon: FileText,
    title: "Unified Medical Records",
    desc: "Store prescriptions, lab reports, scans and visit notes in one organised place.",
    tint: "bg-blue-50 text-[var(--brand)]",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    desc: "Ask questions about your history and get context-aware answers from your own data.",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "Your health data is encrypted at rest and in transit — only you decide who sees it.",
    tint: "bg-emerald-50 text-[var(--emerald)]",
  },
  {
    icon: QrCode,
    title: "Emergency QR Access",
    desc: "Share critical info with first responders in seconds through a secure QR code.",
    tint: "bg-rose-50 text-rose-500",
  },
  {
    icon: Bell,
    title: "Smart Medication Reminders",
    desc: "Never miss a dose with intelligent reminders tied to your prescription schedule.",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    icon: HeartPulse,
    title: "Health Timeline",
    desc: "Visualise every appointment, test and diagnosis on a single interactive timeline.",
    tint: "bg-sky-50 text-sky-600",
  },
];

function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[var(--ink)]">
      {/* Ambient background blobs & pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-300/40 to-blue-100/0 blur-3xl" />
        <div className="absolute -right-32 top-20 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-emerald-300/40 to-emerald-100/0 blur-3xl" />
        <div className="absolute left-1/3 top-[520px] h-[380px] w-[380px] rounded-full bg-gradient-to-br from-sky-200/40 to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/60 bg-white/70 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--muted-ink)] md:flex">
            <a href="#home" className="text-[var(--ink)]">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="group hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--emerald)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg hover:shadow-emerald-500/30 sm:inline-flex"
            >
              Get Started
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white/80 text-[var(--ink)] shadow-sm backdrop-blur md:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/60 bg-white/90 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
              {[
                { href: "#home", label: "Home" },
                { href: "#features", label: "Features" },
                { href: "#about", label: "About" },
                { href: "#contact", label: "Contact" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-slate-50"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--emerald)] px-4 py-3 text-sm font-semibold text-white shadow-md"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </nav>
          </motion.div>
        )}
      </header>

      <section
        id="home"
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-10 lg:pb-32 lg:pt-24"
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
          }}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-[var(--brand)] shadow-sm backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--emerald)]" />
            </span>
            New · AI-powered health insights are live
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your Health.
            <br />
            Your Data.
            <br />
            <span className="bg-gradient-to-r from-[var(--brand)] via-sky-500 to-[var(--emerald)] bg-clip-text text-transparent">
              Your Control.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-ink)] sm:mt-6 sm:text-lg"
          >
            The intelligent health vault trusted by patients and clinicians. Store, manage
            and understand your complete medical history — securely, in one beautiful place.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-2.5">
            {trustBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-sm backdrop-blur"
              >
                <b.icon size={13} className="text-[var(--emerald)]" />
                {b.label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/login"
              className="group relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--brand)] via-sky-500 to-[var(--emerald)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Sparkles size={16} />
              Get Started Free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[var(--ink)] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Activity size={16} className="text-[var(--brand)]" />
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[560px]"
        >
          {/* Glow ring */}
          <div className="relative aspect-square">
            <div className="absolute inset-0 rounded-[42%] bg-gradient-to-br from-[var(--brand)]/25 via-sky-300/20 to-[var(--emerald)]/25 blur-3xl" />
            <div className="absolute inset-6 rounded-[38%] bg-gradient-to-tr from-blue-200/60 via-white to-emerald-200/60" />
            <div className="absolute inset-10 rounded-[36%] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-20px_rgba(37,99,235,0.35)] backdrop-blur-xl" />

            {/* Glow dots */}
            <div className="absolute -left-2 top-24 h-24 w-24 rounded-full bg-emerald-400/40 blur-2xl" />
            <div className="absolute -right-4 bottom-20 h-28 w-28 rounded-full bg-blue-500/30 blur-2xl" />

            <img
              src={heroDoctor}
              alt="Doctor with tablet"
              className="relative z-10 mx-auto h-full w-full object-contain p-6 drop-shadow-2xl"
            />

            {/* Floating healthcare cards */}
            <FloatingCard
              className="left-[-6%] top-[18%]"
              icon={<Sparkles size={16} />}
              iconClass="bg-violet-100 text-violet-600"
              title="AI Analysis"
              subtitle="Insights ready"
              delay={0.2}
            />
            <FloatingCard
              className="right-[-4%] top-[8%]"
              icon={<FileText size={16} />}
              iconClass="bg-blue-100 text-[var(--brand)]"
              title="Medical Reports"
              subtitle="128 files synced"
              delay={0.4}
            />
            <FloatingCard
              className="left-[-8%] bottom-[22%]"
              icon={<Lock size={16} />}
              iconClass="bg-emerald-100 text-[var(--emerald)]"
              title="Secure Records"
              subtitle="End-to-end encrypted"
              delay={0.6}
            />
            <FloatingCard
              className="right-[-6%] bottom-[10%]"
              icon={<HeartPulse size={16} />}
              iconClass="bg-rose-100 text-rose-500"
              title="Health Score"
              subtitle="92 · Excellent"
              badge="+4"
              delay={0.8}
            />
          </div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section id="highlights" className="relative mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-10">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            <Sparkles size={12} /> Feature Highlights
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need for your health, together.
          </h2>
          <p className="mt-3 text-sm text-[var(--muted-ink)] sm:text-base">
            HealthVault AI brings your records, medications, appointments and AI insights into
            a single secure workspace.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/30 to-emerald-200/30 blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${h.tint}`}>
                <h.icon size={22} />
              </div>
              <h3 className="text-base font-semibold">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-ink)]">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="mx-auto mb-12 max-w-2xl pt-24 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            <CheckCircle2 size={12} /> Why HealthVault AI
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything your health record should be.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                <f.icon size={22} />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-ink)]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer id="contact" className="border-t border-[#E5E7EB] bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-[var(--muted-ink)] sm:flex-row sm:text-left sm:px-6 lg:px-10">
          <Logo />
          <p>© {new Date().getFullYear()} HealthVault AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function FloatingCard({
  className = "",
  icon,
  iconClass,
  title,
  subtitle,
  badge,
  delay = 0,
}: {
  className?: string;
  icon: ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  badge?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.4 + delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
        className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-3.5 py-2.5 shadow-[0_14px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
        <div className="pr-1">
          <div className="text-[13px] font-bold leading-tight text-[var(--ink)]">{title}</div>
          <div className="text-[11px] font-medium text-[var(--muted-ink)]">{subtitle}</div>
        </div>
        {badge && (
          <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[var(--emerald)]">
            {badge}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}