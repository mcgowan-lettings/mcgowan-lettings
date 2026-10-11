"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { confirmLeaveIfUnsaved, hasUnsavedWork } from "@/lib/use-unsaved-guard";
import { getAdminSessionStatus } from "@/app/actions/admin-session";

/**
 * Admin routes reachable without an admin session. They render without the
 * sidebar and are never gated or redirected by this layout. Still under
 * /admin, so the noindex headers from next.config.ts apply.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password"];
const isPublicAdminPath = (p: string | null | undefined) =>
  !!p && PUBLIC_ADMIN_PATHS.includes(p);

/** Back-off before re-checking after a transient (network/5xx) failure:
 * 5s, doubling to a 60s cap, and paused while the tab is hidden — a
 * permanent failure (e.g. deploy skew) mustn't hammer the server forever. */
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60000;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Session vanished (expired, or signed out in another tab) while an editor
  // had unsaved work: keep the editor mounted and show a banner instead of
  // bouncing to /admin/login and throwing the work away.
  const [signedOutWithUnsaved, setSignedOutWithUnsaved] = useState(false);

  // Refs so the single long-lived auth subscription below can read the
  // current route / verified user without being torn down on navigation.
  const pathnameRef = useRef(pathname);
  const verifiedUserIdRef = useRef<string | null>(null);
  const checkSeqRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const recheckRef = useRef<() => Promise<void>>(async () => {});
  const authenticatedRef = useRef(false);
  // Set by our own Sign Out button, which has already asked about unsaved work.
  const intentionalSignOutRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Subscribe once. NOTE: this is a client-side UX gate only — real
  // enforcement is requireAdmin() inside every server action.
  useEffect(() => {
    let disposed = false;

    const clearRetry = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const scheduleRetry = () => {
      clearRetry();
      const delay = Math.min(RETRY_BASE_MS * 2 ** retryCountRef.current, RETRY_MAX_MS);
      retryCountRef.current += 1;
      retryTimerRef.current = setTimeout(() => {
        if (document.hidden) {
          // Re-check once the admin comes back to the tab instead.
          const onVisible = () => {
            if (document.hidden) return;
            document.removeEventListener("visibilitychange", onVisible);
            if (!disposed) void recheck();
          };
          document.addEventListener("visibilitychange", onVisible);
          return;
        }
        void recheck();
      }, delay);
    };

    const goToLogin = () => {
      if (!isPublicAdminPath(pathnameRef.current)) router.replace("/admin/login");
    };

    /** If the admin was signed in and an editor holds unsaved work, keep the
     * page mounted behind the "signed out" banner. Returns true if it did. */
    const holdForUnsavedWork = () => {
      if (
        intentionalSignOutRef.current ||
        !authenticatedRef.current ||
        isPublicAdminPath(pathnameRef.current) ||
        !hasUnsavedWork()
      ) {
        return false;
      }
      // Forget the verified user so the next SIGNED_IN (e.g. from a login in
      // another tab) is re-verified and clears the banner.
      verifiedUserIdRef.current = null;
      setCheckError(false);
      setSignedOutWithUnsaved(true);
      return true;
    };

    const setAuth = (value: boolean) => {
      authenticatedRef.current = value;
      setAuthenticated(value);
    };

    const verify = async (session: Session | null) => {
      const seq = ++checkSeqRef.current;
      clearRetry();

      if (!session) {
        if (holdForUnsavedWork()) return;
        verifiedUserIdRef.current = null;
        setAuth(false);
        setCheckError(false);
        goToLogin();
        return;
      }

      let status: Awaited<ReturnType<typeof getAdminSessionStatus>>;
      try {
        status = await getAdminSessionStatus(session.access_token);
      } catch {
        // Server action itself failed (offline, deploy skew…) — transient.
        status = "error";
      }
      if (disposed || seq !== checkSeqRef.current) return;

      if (status !== "error") retryCountRef.current = 0;
      if (status === "admin") {
        verifiedUserIdRef.current = session.user.id;
        intentionalSignOutRef.current = false;
        setAuth(true);
        setCheckError(false);
        setSignedOutWithUnsaved(false);
      } else if (status === "forbidden" || status === "unauthorized") {
        // Definite answer: this session is not an admin session. Local scope:
        // never revoke the admin's sessions on other devices.
        const held = holdForUnsavedWork();
        if (!held) {
          verifiedUserIdRef.current = null;
          setAuth(false);
          setCheckError(false);
        }
        supabase.auth
          .signOut({ scope: "local" })
          .catch(() => {})
          .finally(() => {
            if (!held) goToLogin();
          });
      } else {
        // Transient failure: never sign out (would lose unsaved work). If
        // this user was already verified, keep them in silently; otherwise
        // show a "retrying" note under the spinner. Either way, retry.
        if (verifiedUserIdRef.current !== session.user.id) setCheckError(true);
        scheduleRetry();
      }
    };

    const recheck = async () => {
      if (disposed || isPublicAdminPath(pathnameRef.current)) return;
      let session: Session | null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      } catch {
        if (disposed) return;
        if (!verifiedUserIdRef.current) setCheckError(true);
        scheduleRetry();
        return;
      }
      if (!disposed) await verify(session);
    };
    recheckRef.current = recheck;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // The initial check is driven by the pathname effect below.
      if (event === "INITIAL_SESSION") return;
      // Hourly token refreshes (and SIGNED_IN re-fires on tab focus) for an
      // already-verified user don't need another round-trip.
      if (
        (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") &&
        session &&
        session.user.id === verifiedUserIdRef.current
      ) {
        return;
      }
      // Never await Supabase calls (e.g. signOut) inside this callback — it
      // runs under the auth lock and can deadlock. Defer the work instead.
      setTimeout(() => {
        if (disposed) return;
        if (isPublicAdminPath(pathnameRef.current)) {
          // Login / reset pages manage their own session; just invalidate
          // our cached verdict so leaving the page triggers a fresh check.
          if (session?.user.id !== verifiedUserIdRef.current) {
            verifiedUserIdRef.current = null;
            setAuth(false);
            setSignedOutWithUnsaved(false);
          }
          return;
        }
        void verify(session);
      }, 0);
    });

    return () => {
      disposed = true;
      clearRetry();
      subscription.unsubscribe();
    };
  }, [router]);

  // Check on first load and whenever we land on a gated page without a
  // verified admin (e.g. login → /admin). Already-verified navigations are
  // free — no re-subscribe, no duplicate checks.
  useEffect(() => {
    if (isPublicAdminPath(pathname)) return;
    if (verifiedUserIdRef.current) return;
    void recheckRef.current();
  }, [pathname]);

  // Login / reset-password pages get no sidebar and no gate
  if (isPublicAdminPath(pathname)) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        {checkError && (
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              Can&apos;t reach the server to check your login. Retrying&hellip;
            </p>
            <button
              type="button"
              onClick={() => void recheckRef.current()}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
            >
              Retry now
            </button>
          </div>
        )}
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: DashboardIcon },
    { label: "Properties", href: "/admin/properties", icon: PropertiesIcon },
    { label: "Blog", href: "/admin/blog", icon: BlogIcon },
    { label: "Submissions", href: "/admin/submissions", icon: SubmissionsIcon },
    { label: "Valuations", href: "/admin/valuations", icon: ValuationsIcon },
    { label: "Applications", href: "/admin/applications", icon: ApplicationsIcon },
  ];

  const handleSignOut = async () => {
    // An open editor with unsaved work would otherwise be discarded silently.
    if (!confirmLeaveIfUnsaved()) return;
    intentionalSignOutRef.current = true;
    // Local scope: the default ("global") revokes every session on every
    // device, e.g. David's phone as well as this laptop.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    setSignedOutWithUnsaved(false);
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row bg-gray-50">
      {signedOutWithUnsaved && (
        <div
          role="alert"
          className="fixed inset-x-0 top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900 shadow-sm"
        >
          You&apos;ve been signed out. Sign in again in a new tab, then come back here and press Save.
        </div>
      )}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo area */}
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
            <Image
              src="/mcgowan-logo.png"
              alt="McGowan Residential Lettings Ltd."
              width={1709}
              height={462}
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand/10 text-brand-dark"
                      : "text-text-muted hover:bg-gray-100 hover:text-dark"
                  }`}
                >
                  <item.icon active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-gray-100 hover:text-dark transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View Site
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-gray-100 hover:text-dark lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-dark font-[family-name:var(--font-playfair)]">
            {navItems.find(
              (item) =>
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href))
            )?.label ?? "Dashboard"}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 lg:overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

/* ── Icon Components ── */

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function PropertiesIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  );
}

function SubmissionsIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function BlogIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ValuationsIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ApplicationsIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM9 12.75l1.5 1.5 3-3" />
    </svg>
  );
}
