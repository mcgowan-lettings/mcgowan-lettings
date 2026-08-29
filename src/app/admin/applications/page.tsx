"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  deleteApplication as deleteApplicationAction,
  markApplicationRead,
  markAllApplicationsRead,
  getApplicationPdf,
  listApplications,
} from "@/app/actions/applications";
import type { TenantApplicationRow } from "@/lib/application-types";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<TenantApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");
        const data = await listApplications(session.access_token);
        if (cancelled) return;
        setApplications(data);
      } catch {
        if (cancelled) return;
        setMessage({ text: "Failed to load applications.", type: "error" });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flash = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const markRead = async (app: TenantApplicationRow) => {
    if (app.read) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const result = await markApplicationRead(app.id, session.access_token);
    if (result.success) {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, read: true } : a))
      );
    } else {
      flash("Failed to mark as read.", "error");
    }
  };

  const toggleExpand = async (app: TenantApplicationRow) => {
    if (expandedId === app.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(app.id);
    if (!app.read) await markRead(app);
  };

  const markAllRead = async () => {
    const unreadIds = applications.filter((a) => !a.read).map((a) => a.id);
    if (unreadIds.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const result = await markAllApplicationsRead(unreadIds, session.access_token);
    if (!result.success) {
      flash("Failed to mark all as read.", "error");
    } else {
      setApplications((prev) => prev.map((a) => ({ ...a, read: true })));
      flash("All applications marked as read.", "success");
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setDeletingId(id);
    const result = await deleteApplicationAction(id, session.access_token);

    if (!result.success) {
      flash(result.error || "Failed to delete application.", "error");
    } else {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
      flash("Application deleted.", "success");
    }
    setDeletingId(null);
  };

  const downloadPdf = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setDownloadingId(id);
    try {
      const { base64, filename } = await getApplicationPdf(id, session.access_token);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      flash("Failed to generate PDF.", "error");
    }
    setDownloadingId(null);
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
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // ISO yyyy-mm-dd (or full timestamp) → dd/mm/yyyy
  const formatUkDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB");
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    return isNaN(d.getTime())
      ? value
      : d.toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const unreadCount = applications.filter((a) => !a.read).length;

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
            Tenant Applications
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {applications.length} total &middot; {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM9 12.75l1.5 1.5 3-3" />
          </svg>
          <p className="mt-3 text-text-muted">No tenant applications yet.</p>
          <p className="mt-1 text-xs text-text-muted">
            Applications submitted through the online form at /apply will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm divide-y divide-gray-100">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id}>
                {/* Row */}
                <button
                  onClick={() => toggleExpand(app)}
                  className={`w-full text-left px-4 sm:px-6 py-4 transition-colors hover:bg-gray-50 ${
                    !app.read ? "bg-brand/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          !app.read ? "bg-brand" : "bg-transparent"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm ${
                              !app.read
                                ? "font-semibold text-dark"
                                : "font-medium text-dark"
                            }`}
                          >
                            {app.full_name}
                          </span>
                          {!app.read && (
                            <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs font-semibold text-brand-deep uppercase">
                              New
                            </span>
                          )}
                          {app.employment_status && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-text-muted">
                              {app.employment_status}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-light flex-shrink-0">
                          {formatDate(app.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {app.property_address}
                        {app.rent_pcm ? ` · £${app.rent_pcm} pcm` : ""}
                      </p>
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
                            href={`mailto:${app.email}`}
                            className="text-brand-dark hover:underline break-all"
                          >
                            {app.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-text-muted">Phone: </span>
                          <a
                            href={`tel:${app.phone}`}
                            className="text-brand-dark hover:underline"
                          >
                            {app.phone}
                          </a>
                        </div>
                      </div>

                      {/* Property */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Property</p>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-text-muted">Address: </span>
                            <span className="text-dark font-medium">{app.property_address}</span>
                          </div>
                          {app.rent_pcm && (
                            <div>
                              <span className="text-text-muted">Rent: </span>
                              <span className="text-dark">£{app.rent_pcm} pcm</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personal details */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Personal details</p>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-text-muted">Full name: </span>
                            <span className="text-dark font-medium">{app.full_name}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Date of birth: </span>
                            <span className="text-dark">{formatUkDate(app.date_of_birth)}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">NI number: </span>
                            <span className="text-dark font-mono">{app.ni_number}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Time at address: </span>
                            <span className="text-dark">{app.period_at_address}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-text-muted">Current address: </span>
                            <span className="text-dark whitespace-pre-wrap">{app.current_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Employment */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Employment</p>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-text-muted">Status: </span>
                            <span className="text-dark">{app.employment_status}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Monthly income: </span>
                            <span className="text-dark">£{app.monthly_income}</span>
                          </div>
                          {app.employer && (
                            <div>
                              <span className="text-text-muted">Employer: </span>
                              <span className="text-dark">{app.employer}</span>
                            </div>
                          )}
                          {app.job_title && (
                            <div>
                              <span className="text-text-muted">Job title: </span>
                              <span className="text-dark">{app.job_title}</span>
                            </div>
                          )}
                          {app.employment_start_date && (
                            <div>
                              <span className="text-text-muted">Start date: </span>
                              <span className="text-dark">{formatUkDate(app.employment_start_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Declaration & signature */}
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Declaration &amp; signature</p>
                        <div className="flex items-center gap-2 text-sm">
                          {app.declaration_agreed ? (
                            <>
                              <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              <span className="text-dark">Declaration agreed</span>
                            </>
                          ) : (
                            <span className="text-red-600">Declaration not agreed</span>
                          )}
                        </div>
                        {app.signature_data_url && (
                          <div className="mt-3 inline-block rounded-lg border border-gray-300 bg-white p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={app.signature_data_url}
                              alt={`Signature of ${app.signed_name}`}
                              className="h-auto max-h-32 w-auto max-w-full"
                            />
                          </div>
                        )}
                        <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-text-muted">Signed name: </span>
                            <span className="text-dark font-medium">{app.signed_name}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Signed at: </span>
                            <span className="text-dark">{formatDateTime(app.signed_at)}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-text-muted break-all">
                          {app.ip_address ? `IP ${app.ip_address}` : "IP unknown"}
                          {app.user_agent ? ` · ${app.user_agent}` : ""}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(app.id);
                          }}
                          disabled={downloadingId === app.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          {downloadingId === app.id ? "Preparing…" : "Download PDF"}
                        </button>
                        <a
                          href={`mailto:${app.email}?subject=Re: Your tenancy application — McGowan Lettings`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
                        >
                          Reply
                        </a>
                        {!app.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(app);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-50"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApplication(app.id);
                          }}
                          disabled={deletingId === app.id}
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
