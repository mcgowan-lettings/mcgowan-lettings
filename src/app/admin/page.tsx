"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStorageUsage, formatBytes } from "@/lib/use-storage-usage";
import { updateReviewCount } from "@/app/actions/admin";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  unreadSubmissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    unreadSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const storage = useStorageUsage();

  const [reviewCount, setReviewCountState] = useState<string>("");
  const [reviewCountSaved, setReviewCountSaved] = useState<string>("");
  const [reviewCountLoading, setReviewCountLoading] = useState(true);
  const [reviewCountSaving, setReviewCountSaving] = useState(false);
  const [reviewCountMsg, setReviewCountMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    supabase
      .from("site_config")
      .select("value")
      .eq("key", "google_review_count")
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value ?? "";
        setReviewCountState(value);
        setReviewCountSaved(value);
        setReviewCountLoading(false);
      });
  }, []);

  const handleSaveReviewCount = async () => {
    setReviewCountMsg(null);
    const parsed = parseInt(reviewCount, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setReviewCountMsg({ text: "Enter a whole number.", type: "error" });
      return;
    }
    setReviewCountSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setReviewCountMsg({ text: "Session expired. Please sign in again.", type: "error" });
      setReviewCountSaving(false);
      return;
    }
    const result = await updateReviewCount(parsed, session.access_token);
    if (result.success) {
      setReviewCountSaved(String(parsed));
      setReviewCountMsg({ text: "Saved.", type: "success" });
      setTimeout(() => setReviewCountMsg(null), 3000);
    } else {
      setReviewCountMsg({ text: result.error || "Couldn't save.", type: "error" });
    }
    setReviewCountSaving(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      const [propertiesRes, unreadRes] = await Promise.all([
        supabase.from("properties").select("active"),
        supabase
          .from("contact_submissions")
          .select("id", { count: "exact", head: true })
          .eq("read", false),
      ]);

      if (propertiesRes.error || unreadRes.error) {
        setStatsError("Couldn't load dashboard stats. Please refresh the page.");
        setLoading(false);
        return;
      }

      const properties = propertiesRes.data ?? [];
      const activeCount = properties.filter((p) => p.active).length;

      setStats({
        total: properties.length,
        active: activeCount,
        inactive: properties.length - activeCount,
        unreadSubmissions: unreadRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: "Total Properties",
      value: stats.total,
      color: "bg-blue-50 text-blue-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
    },
    {
      label: "Active Listings",
      value: stats.active,
      color: "bg-green-50 text-green-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Inactive Listings",
      value: stats.inactive,
      color: "bg-gray-100 text-gray-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    {
      label: "Unread Messages",
      value: stats.unreadSubmissions,
      color: "bg-amber-50 text-amber-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
          Welcome back, David
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Here&apos;s an overview of your property portfolio.
        </p>
      </div>

      {statsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statsError}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-200/60"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold text-dark">
                  {loading ? (
                    <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-200" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200/60 transition-all hover:shadow-md hover:border-brand/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-dark">Add Property</p>
            <p className="text-sm text-text-muted">Create a new listing</p>
          </div>
        </Link>

        <Link
          href="/admin/properties"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200/60 transition-all hover:shadow-md hover:border-brand/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-dark">Manage Properties</p>
            <p className="text-sm text-text-muted">View and edit all listings</p>
          </div>
        </Link>

        <Link
          href="/admin/submissions"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200/60 transition-all hover:shadow-md hover:border-brand/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-dark">Contact Submissions</p>
            <p className="text-sm text-text-muted">
              {loading
                ? "Loading..."
                : stats.unreadSubmissions > 0
                ? `${stats.unreadSubmissions} unread message${stats.unreadSubmissions !== 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
        </Link>
      </div>

      {/* Google review count */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark">Google Reviews on site</p>
            <p className="text-xs text-text-muted mt-0.5">
              Update this whenever your Google review count changes. It shows on your homepage testimonials section.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={0}
            step={1}
            value={reviewCount}
            onChange={(e) => setReviewCountState(e.target.value)}
            disabled={reviewCountLoading || reviewCountSaving}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400"
            placeholder={reviewCountLoading ? "…" : "e.g. 370"}
          />
          <button
            type="button"
            onClick={handleSaveReviewCount}
            disabled={reviewCountLoading || reviewCountSaving || reviewCount === reviewCountSaved}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reviewCountSaving ? "Saving…" : "Save"}
          </button>
          {reviewCountMsg && (
            <span
              className={`text-sm ${
                reviewCountMsg.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {reviewCountMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* Storage usage */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-dark">Media Storage</p>
              <p className="text-xs text-text-muted">
                {storage.loading ? (
                  "Calculating..."
                ) : (
                  `${formatBytes(storage.usedBytes)} of ${formatBytes(storage.limitBytes)} used`
                )}
              </p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${
            storage.loading
              ? "text-transparent"
              : storage.percentage >= 90
              ? "text-red-600"
              : storage.percentage >= 75
              ? "text-amber-600"
              : "text-green-600"
          }`}>
            {storage.loading
              ? "—"
              : storage.percentage < 0.1 && storage.usedBytes > 0
              ? "<0.1%"
              : `${storage.percentage.toFixed(1)}%`
            }
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              storage.loading
                ? "bg-gray-200"
                : storage.percentage >= 90
                ? "bg-red-500"
                : storage.percentage >= 75
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
            style={{ width: storage.loading ? "0%" : `${Math.max(storage.percentage, 1)}%` }}
          />
        </div>

        {/* Warnings */}
        {!storage.loading && storage.percentage >= 75 && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            storage.percentage >= 90
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {storage.percentage >= 90 ? (
              <>
                <strong>Storage almost full.</strong> You may need to delete old property images or upgrade to the Supabase Pro plan ($25/month for 100GB).
              </>
            ) : (
              <>
                <strong>Storage getting full.</strong> Consider removing images from old or archived properties to free up space.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
