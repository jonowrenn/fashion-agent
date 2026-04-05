"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "signin" | "register";

type Props = {
  /** Short line under the title (e.g. why sign-in is needed). */
  subtitle?: string;
  className?: string;
  /**
   * Use inside {@link TabPanel}—drops the outer card chrome so the shell matches other tabs.
   */
  variant?: "card" | "embedded";
};

export function SignInCard({
  subtitle,
  className = "",
  variant = "card",
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.refresh();
  }

  async function handleRegister() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not create account.");
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError("Account created—sign in failed. Try signing in manually.");
        setMode("signin");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const shell =
    variant === "embedded"
      ? "overflow-visible border-0 bg-transparent shadow-none"
      : "overflow-hidden rounded-2xl border border-stone-300/60 bg-stone-50 shadow-[0_1px_3px_rgba(28,25,23,0.06)]";

  return (
    <div className={`${shell} ${className}`}>
      <header
        className={
          variant === "embedded"
            ? "border-b border-stone-200/80 pb-4 pt-0 sm:px-0"
            : "border-b border-stone-200/90 px-5 pb-4 pt-5 sm:px-6"
        }
      >
        <div className="border-l-2 border-rose-300 pl-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
            Account
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight text-stone-900">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {subtitle ??
              "Create a free account to save items to your closet and use AI outfit ideas."}
          </p>
        </div>
      </header>

      <div
        className={`flex gap-1 border-b border-stone-200/80 bg-stone-200/40 p-1 ${
          variant === "embedded" ? "rounded-lg" : ""
        }`}
      >
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signin"
              ? "bg-stone-50 text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "register"
              ? "bg-stone-50 text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
          onClick={() => {
            setMode("register");
            setError(null);
          }}
        >
          Create account
        </button>
      </div>

      <div
        className={`space-y-4 py-5 ${variant === "embedded" ? "px-0 sm:px-0" : "px-5 sm:px-6"}`}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-lg border border-stone-300/80 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="rounded-lg border border-stone-300/80 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50/90 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void (mode === "register" ? handleRegister() : handleSignIn())}
          className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
