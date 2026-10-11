"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deleteValuationRequest as deleteValuationAction, markValuationRead, markAllValuationsRead } from "@/app/actions/admin";
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

interface ValuationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  property_type: string | null;
  bedrooms: string | null;
  situation: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
}

export default function AdminValuationsPage() {
  const [requests, setRequests] = useState<ValuationRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
        .from("valuation_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        setMessage({ text: "Failed to load valuation requests.", type: "error" });
      } else {
        setRequests(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = async (request: ValuationRequest) => {
    if (expandedId === request.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(request.id);

    // Mark as read if unread
    if (!request.read) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const result = await markValuationRead(request.id, session.access_token);
        if (result.success) {
          setRequests((prev) =>
            prev.map((r) =>
              r.id === request.id ? { ...r, read: true } : r
            )
          );
        }
      } catch {
        // Non-critical: the request stays unread and can be retried.
      }
    }
  };

  const markAllRead = async () => {
    const unreadIds = requests.filter((r) => !r.read).map((r) => r.id);
    if (unreadIds.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ text: "Session expired. Please sign in again.", type: "error" });
        return;
      }

      const result = await markAllValuationsRead(unreadIds, session.access_token);
      if (!result.success) {
        setMessage({ text: "Failed to mark all as read.", type: "error" });
      } else {
        setRequests((prev) => prev.map((r) => ({ ...r, read: true })));
        setMessage({ text: "All requests marked as read.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to mark all as read — please refresh and try again.", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this valuation request?")) return;

    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ text: "Session expired. Please sign in again.", type: "error" });
        return;
      }
      const result = await deleteValuationAction(id, session.access_token);

      if (!result.success) {
        setMessage({ text: result.error || "Failed to delete request.", type: "error" });
      } else {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        if (expandedId === id) setExpandedId(null);
        setMessage({ text: "Request deleted.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to delete request — please refresh and try again.", type: "error" });
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
    const headers = [
      "name", "email", "phone", "address", "property_type",
      "bedrooms", "situation", "message", "created_at (UK time)",
    ];
    const rows = requests.map((r) =>
      [
        r.name, r.email, r.phone, r.address, r.property_type,
        r.bedrooms, r.situation, r.message, formatCsvTimestamp(r.created_at),
      ]
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
    a.download = `mcgowan-valuations-${date}.csv`;
    // Firefox needs the link in the DOM; Safari needs the URL alive briefly.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const unreadCount = requests.filter((r) => !r.read).length;

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
            Valuation Requests
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {requests.length} total &middot; {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          {requests.length > 0 && (
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

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <p className="mt-3 text-text-muted">No valuation requests yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm divide-y divide-gray-100">
          {requests.map((request) => {
            const isExpanded = expandedId === request.id;
            return (
              <div key={request.id}>
                {/* Row */}
                <button
                  onClick={() => toggleExpand(request)}
                  className={`w-full text-left px-4 sm:px-6 py-4 transition-colors hover:bg-gray-50 ${
                    !request.read ? "bg-brand/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!request.read ? (
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
                              !request.read
                                ? "font-semibold text-dark"
                                : "font-medium text-dark"
                            }`}
                          >
                            {request.name}
                          </span>
                          {request.property_type && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-text-muted uppercase">
                              {request.property_type}
                            </span>
                          )}
                          {request.bedrooms && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-text-muted">
                              {request.bedrooms} bed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-light flex-shrink-0">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted break-words">
                        {request.address}
                      </p>
                      {!isExpanded && request.situation && (
                        <p className="mt-1 truncate text-sm text-text-muted">
                          {request.situation}
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
                            href={`mailto:${mailtoAddress(request.email)}`}
                            className="text-brand-dark hover:underline break-all"
                          >
                            {request.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-text-muted">Phone: </span>
                          <a
                            href={`tel:${request.phone}`}
                            className="text-brand-dark hover:underline"
                          >
                            {request.phone}
                          </a>
                        </div>
                      </div>

                      {/* Property details */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-text-muted">Address: </span>
                            <span className="text-dark font-medium break-words">{request.address}</span>
                          </div>
                          {request.property_type && (
                            <div>
                              <span className="text-text-muted">Type: </span>
                              <span className="text-dark">{request.property_type}</span>
                            </div>
                          )}
                          {request.bedrooms && (
                            <div>
                              <span className="text-text-muted">Bedrooms: </span>
                              <span className="text-dark">{request.bedrooms}</span>
                            </div>
                          )}
                          {request.situation && (
                            <div>
                              <span className="text-text-muted">Situation: </span>
                              <span className="text-dark break-words">{request.situation}</span>
                            </div>
                          )}
                        </div>
                        {request.message && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Message</p>
                            <p className="text-sm text-dark whitespace-pre-wrap break-words leading-relaxed">
                              {request.message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`mailto:${mailtoAddress(request.email)}?subject=${encodeURIComponent("Re: Your property valuation request — McGowan Lettings")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-brand-light"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          Reply
                        </a>
                        <a
                          href={`tel:${request.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
                        >
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${whatsappNumber(request.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRequest(request.id);
                          }}
                          disabled={deletingId === request.id}
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
