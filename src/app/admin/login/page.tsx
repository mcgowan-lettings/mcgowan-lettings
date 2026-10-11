"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getAdminSessionStatus } from "@/app/actions/admin-session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Already signed in as an admin? Skip the form and go to the dashboard.
  // Only a definite "admin" verdict redirects; anything else shows the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const status = await getAdminSessionStatus(session.access_token);
        if (!cancelled && status === "admin") router.replace("/admin");
      } catch {
        // Ignore — the login form is still usable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setResetLoading(true);

    try {
      // The link lands on /admin/reset-password, which waits for the recovery
      // session and calls supabase.auth.updateUser. This URL must be in the
      // Supabase Auth redirect allowlist or Supabase falls back to Site URL.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        { redirectTo: `${window.location.origin}/admin/reset-password` }
      );

      if (resetError) {
        setResetMessage({ text: resetError.message, type: "error" });
      } else {
        setResetMessage({
          text: "Password reset email sent. Check your inbox.",
          type: "success",
        });
      }
    } catch {
      setResetMessage({
        text: "Couldn't send the reset email. Please try again.",
        type: "error",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const status = await getAdminSessionStatus(data.session.access_token);
      if (status === "error") {
        // Transient (network / server hiccup): keep the session so a retry
        // can succeed — signing out here would gain nothing.
        setError("Couldn't verify your access — please try again.");
        setLoading(false);
        return;
      }
      if (status !== "admin") {
        // Local scope only: the default (global) revokes every session for
        // this user, which would sign David out on all his devices.
        await supabase.auth.signOut({ scope: "local" });
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Couldn't sign in — check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/mcgowan-logo.png"
            alt="McGowan Residential Lettings Ltd."
            width={1709}
            height={462}
            className="h-10 w-auto"
          />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-playfair)]">
              McGowan Lettings
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-dark-soft border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Email address"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-dark border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowReset(!showReset);
                setResetMessage(null);
              }}
              className="inline-flex min-h-11 items-center px-2 text-sm text-gray-400 transition-colors hover:text-brand"
            >
              Forgot password?
            </button>
          </div>

          {showReset && (
            <form onSubmit={handleResetPassword} className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Enter your email to receive a reset link
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Email address"
                />
              </div>

              {/* Live regions stay mounted (empty) so screen readers announce
                  a message when it's inserted — a region mounted together with
                  its text is often not read. Errors go to an alert region. */}
              <div role="status" aria-live="polite">
                {resetMessage?.type === "success" && (
                  <div className="rounded-lg px-4 py-3 text-sm bg-green-500/10 border border-green-500/20 text-green-400">
                    {resetMessage.text}
                  </div>
                )}
              </div>
              <div role="alert">
                {resetMessage && resetMessage.type !== "success" && (
                  <div className="rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                    {resetMessage.text}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          McGowan Residential Lettings Ltd.
        </p>
      </div>
    </div>
  );
}
