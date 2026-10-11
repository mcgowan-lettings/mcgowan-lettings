"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deleteSubmission as deleteSubmissionAction, markSubmissionRead, markAllSubmissionsRead } from "@/app/actions/admin";
import { mailtoAddress } from "@/lib/mailto";

const LONDON_TZ = "Europe/London";

/**
 * wa.me needs the number in international format with no "+" or leading
 * zeros. UK leads usually type 07…, which wa.me can't resolve.
 */
function whatsappNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `44${digits.slice(1)}`;
  // "+44 (0)7700 900123" → 4407700… — drop the trunk 0 after the country code.
  if (digits.startsWith("440")) digits = `44${digits.slice(3)}`;
  return digits;
}

/** created_at → "yyyy-mm-dd HH:mm:ss" in UK local time (BST/GMT aware). */
function formatCsvTimestamp(value: string): string {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleString("sv-SE", { timeZone: LONDON_TZ });
}

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  // Lists load at most 1000 rows; say so rather than silently hide the rest.
  const [capped, setCapped] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        setMessage({ text: "Failed to load submissions.", type: "error" });
      } else {
        setSubmissions(data ?? []);
        setCapped((data ?? []).length >= 1000);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = async (submission: Submission) => {
    if (expandedId === submission.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(submission.id);

    // Mark as read if unread
    if (!submission.read) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const result = await markSubmissionRead(submission.id, session.access_token);
        if (result.success) {
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === submission.id ? { ...s, read: true } : s
            )
          );
        }
      } catch {
        // Non-critical: the message stays unread and can be retried.
      }
    }
  };

  const markAllRead = async () => {
    if (!submissions.some((s) => !s.read)) return;
    // Newest loaded row (list is newest-first): anything newer stays unread.
    const upTo = submissions[0]?.created_at ?? null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ text: "Session expired. Please sign in again.", type: "error" });
        return;
      }

      const result = await markAllSubmissionsRead(upTo, session.access_token);
      if (!result.success) {
        setMessage({ text: "Failed to mark all as read.", type: "error" });
      } else {
        setSubmissions((prev) => prev.map((s) => ({ ...s, read: true })));
        setMessage({ text: "All messages marked as read.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to mark all as read — please refresh and try again.", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this submission?")) return;

    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ text: "Session expired. Please sign in again.", type: "error" });
        return;
      }
      const result = await deleteSubmissionAction(id, session.access_token);

      if (!result.success) {
        setMessage({ text: result.error || "Failed to delete submission.", type: "error" });
      } else {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (expandedId === id) setExpandedId(null);
        setMessage({ text: "Submission deleted.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to delete submission — please refresh and try again.", type: "error" });
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    }
    if (diffHours < 48) {
      return "Yesterday";
    }
    const londonYear = (d: Date) =>
      d.toLocaleDateString("en-GB", { year: "numeric", timeZone: LONDON_TZ });
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: londonYear(date) !== londonYear(now) ? "numeric" : undefined,
      timeZone: LONDON_TZ,
    });
  };

  const escapeCsvField = (field: string | null | undefined): string => {
    let str = field ?? "";
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCsv = () => {
    const headers = ["name", "email", "phone", "type", "message", "created_at (UK time)"];
    const rows = submissions.map((s) =>
      [s.name, s.email, s.phone, s.type, s.message, formatCsvTimestamp(s.created_at)]
        .map(escapeCsvField)
        .join(",")
    );
    // BOM so Excel opens it as UTF-8 (otherwise £, é, curly quotes mangle).
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toLocaleDateString("sv-SE", { timeZone: LONDON_TZ });
    a.href = url;
    a.download = `mcgowan-submissions-${date}.csv`;
    // Firefox needs the link in the DOM; Safari needs the URL alive briefly.
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 60s, not 1s: iPad Safari reads the blob only after the download prompt is tapped.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const unreadCount = submissions.filter((s) => !s.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
            Contact Submissions
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {submissions.length} total &middot; {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          {submissions.length > 0 && (
            <button
              onClick={exportCsv}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
            >
              Export CSV
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {capped && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Showing the most recent 1000 — older items aren&apos;t shown.
        </p>
      )}

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
          </svg>
          <p className="mt-3 text-text-muted">No submissions yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm divide-y divide-gray-100">
          {submissions.map((submission) => {
            const isExpanded = expandedId === submission.id;
            return (
              <div key={submission.id}>
                {/* Row */}
                <button
                  onClick={() => toggleExpand(submission)}
                  className={`w-full text-left px-4 sm:px-6 py-4 transition-colors hover:bg-gray-50 ${
                    !submission.read ? "bg-brand/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!submission.read ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              !submission.read
                                ? "font-semibold text-dark"
                                : "font-medium text-dark"
                            }`}
                          >
                            {submission.name}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-text-muted uppercase">
                            {submission.type}
                          </span>
                        </div>
                        <span className="text-xs text-text-light flex-shrink-0">
                          {formatDate(submission.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted break-words">
                        <span className="break-all">{submission.email}</span>
                        {submission.phone && ` · ${submission.phone}`}
                      </p>
                      {!isExpanded && (
                        <p className="mt-1 truncate text-sm text-text-muted">
                          {submission.message}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg
                      className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="ml-5.5 sm:ml-6.5 space-y-4">
                      {/* Contact info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-text-muted">Email: </span>
                          <a
                            href={`mailto:${mailtoAddress(submission.email)}`}
                            className="text-brand-dark hover:underline break-all"
                          >
                            {submission.email}
                          </a>
                        </div>
                        {submission.phone && (
                          <div>
                            <span className="text-text-muted">Phone: </span>
                            <a
                              href={`tel:${submission.phone}`}
                              className="text-brand-dark hover:underline"
                            >
                              {submission.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <p className="text-sm text-dark whitespace-pre-wrap break-words leading-relaxed">
                          {submission.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`mailto:${mailtoAddress(submission.email)}?subject=${encodeURIComponent("Re: Your enquiry to McGowan Lettings")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-brand-light"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          Reply
                        </a>
                        {submission.phone && (
                          <a
                            href={`https://wa.me/${whatsappNumber(submission.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubmission(submission.id);
                          }}
                          disabled={deletingId === submission.id}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
