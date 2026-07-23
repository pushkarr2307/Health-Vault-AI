import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, Mail, User } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — HealthVault AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, session, loading } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const [googleBusy, setGoogleBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setGoogleBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginBusy(false);
    if (error) {
      const msg = /email.*not.*confirmed/i.test(error)
        ? "Email not confirmed. Please check your inbox for the confirmation link, or disable 'Confirm email' in Supabase → Authentication → Providers → Email."
        : error;
      setLoginError(msg);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters");
      return;
    }
    setRegBusy(true);
    const { error } = await signUp(regEmail, regPassword, regName);
    setRegBusy(false);
    if (error) setRegError(error);
    else setRegSuccess("Account created! If email confirmation is enabled in Supabase, check your inbox before logging in.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/"><Logo /></Link>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 grid gap-6 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:grid-cols-[1fr_auto_1fr] md:p-10"
        >
          {/* Login */}
          <div>
            <h2 className="text-2xl font-bold">Welcome Back!</h2>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">Login to your account</p>
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <Field icon={Mail} label="Email Address" type="email" placeholder="Enter your email" value={loginEmail} onChange={setLoginEmail} required />
              <Field icon={Lock} label="Password" type="password" placeholder="Enter your password" value={loginPassword} onChange={setLoginPassword} required />
              <div className="text-right">
                <a className="text-xs font-medium text-[var(--brand)]" href="#">Forgot Password?</a>
              </div>
              {loginError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginBusy}
                className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {loginBusy ? "Logging in..." : "Login"}
              </button>
              <div className="flex items-center gap-3 text-xs text-[var(--muted-ink)]">
                <div className="h-px flex-1 bg-[#E5E7EB]" /> or continue with <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={googleBusy}
                  onClick={handleGoogleSignIn}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 disabled:opacity-60"
                >
                  {googleBusy ? (
                    <svg className="h-5 w-5 animate-spin text-[var(--muted-ink)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Sign in with Google" className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="pt-2 text-center text-xs text-[var(--muted-ink)]">
                Don't have an account? <a href="#register" className="font-semibold text-[var(--brand)]">Register</a>
              </p>
            </form>
          </div>

          {/* Divider */}
          <div className="hidden flex-col items-center md:flex">
            <div className="my-2 h-full w-px bg-[#E5E7EB]" />
            <span className="my-2 text-xs font-medium text-[var(--muted-ink)]">or</span>
            <div className="my-2 h-full w-px bg-[#E5E7EB]" />
          </div>

          {/* Register */}
          <div id="register">
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">Register to get started</p>
            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <Field icon={User} label="Full Name" placeholder="Enter your name" value={regName} onChange={setRegName} required />
              <Field icon={Mail} label="Email Address" type="email" placeholder="Enter your email" value={regEmail} onChange={setRegEmail} required />
              <Field icon={Lock} label="Password" type="password" placeholder="Create a password" value={regPassword} onChange={setRegPassword} required />
              <Field icon={Lock} label="Confirm Password" type="password" placeholder="Confirm your password" value={regConfirm} onChange={setRegConfirm} required />
              {regError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{regError}</p>
              )}
              {regSuccess && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{regSuccess}</p>
              )}
              <button
                type="submit"
                disabled={regBusy}
                className="block w-full rounded-xl bg-[var(--emerald)] py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {regBusy ? "Creating..." : "Register"}
              </button>
              <p className="pt-2 text-center text-xs text-[var(--muted-ink)]">
                Already have an account? <Link to="/login" className="font-semibold text-[var(--brand)]">Login</Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--ink)]">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-blue-100">
        <Icon size={16} className="text-[var(--muted-ink)]" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}