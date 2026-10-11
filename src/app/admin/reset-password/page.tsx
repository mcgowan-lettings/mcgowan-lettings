"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const MIN_LENGTH = 8;

/**
 * Landing page for the "Forgot password?" email link (redirectTo set in
 * /admin/login). The Supabase client picks the recovery token out of the URL
 * on load (detectSessionInUrl) and emits PASSWORD_RECOVERY; once a session
 * exists we let the user choose a new password via supabase.auth.updateUser.
 *
 * The admin layout treats this path like /admin/login (no gate, no sidebar).
 * It lives under /admin so the noindex headers in next.config.ts apply.
 * The full URL must be in the Supabase Auth redirect allowlist.
 */
export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">(
    "checking"
  );
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't call Supabase from inside this callback — just flip state.
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        setStatus((s) => (s === "done" ? s : "ready"));
      }
    });

    (async () => {
      try {
        // getSession waits for the client to finish parsing the URL, so its
        // answer is authoritative for whether the link produced a session.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          setStatus((s) => (s === "done" ? s : "ready"));
          return;
        }
        // Supabase reports expired/used links in the hash or query string.
        const params = new URLSearchParams(
          window.location.hash.replace(/^#/, "") || window.location.search
        );
        const description = params.get("error_description");
        setLinkError(description ? description.replace(/\+/g, " ") : "");
        setStatus((s) => (s === "checking" ? "invalid" : s));
      } catch {
        if (!cancelled) setStatus((s) => (s === "checking" ? "invalid" : s));
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setStatus("done");
      setPassword("");
      setConfirm("");
      setTimeout(() => router.replace("/admin"), 1500);
    } catch {
      setError("Couldn't update your password — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand";

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
              Reset password
            </h1>
            <p className="mt-1 text-sm text-gray-400">Admin Portal</p>
          </div>
        </div>

        <div className="rounded-2xl bg-dark-soft border border-white/10 p-6 sm:p-8">
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              <p className="text-sm text-gray-400">Checking your reset link&hellip;</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {linkError || "This reset link is invalid or has expired."} Please
                request a new one.
              </div>
              <Link
                href="/admin/login"
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-dark transition-colors hover:bg-brand-light"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {status === "done" && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
              Password updated. Taking you to the dashboard&hellip;
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder={`At least ${MIN_LENGTH} characters`}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_LENGTH}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat the new password"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-dark border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  "Set new password"
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
