"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("valuation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage({ text: "Failed to load valuation requests.", type: "error" });
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const toggleExpand = async (request: ValuationRequest) => {
    if (expandedId === request.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(request.id);

    // Mark as read if unread
    if (!request.read) {
      const { error } = await supabase
        .from("valuation_requests")
        .update({ read: true })
        .eq("id", request.id);

      if (!error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, read: true } : r
          )
        );
      }
    }
  };

  const markAllRead = async () => {
    const unreadIds = requests.filter((r) => !r.read).map((r) => r.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("valuation_requests")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      setMessage({ text: "Failed to mark all as read.", type: "error" });
    } else {
      setRequests((prev) => prev.map((r) => ({ ...r, read: true })));
      setMessage({ text: "All requests marked as read.", type: "success" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this valuation request?")) return;

    const { error } = await supabase
      .from("valuation_requests")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage({ text: "Failed to delete request.", type: "error" });
    } else {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
      setMessage({ text: "Request deleted.", type: "success" });
    }
    setTimeout(() => setMessage(null), 3000);
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

  const escapeCsvField = (field: string | null | undefined): string => {
    const str = field ?? "";
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCsv = () => {
    const headers = [
      "name", "email", "phone", "address", "property_type",
      "bedrooms", "situation", "message", "created_at",
    ];
    const rows = requests.map((r) =>
      [
        r.name, r.email, r.phone, r.address, r.property_type,
        r.bedrooms, r.situation, r.message, r.created_at,
      ]
        .map(escapeCsvField)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `mcgowan-valuations-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted uppercase">
                              {request.property_type}
                            </span>
                          )}
                          {request.bedrooms && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                              {request.bedrooms} bed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-light flex-shrink-0">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">
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
                            href={`mailto:${request.email}`}
                            className="text-brand-dark hover:underline"
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
                            <span className="text-dark font-medium">{request.address}</span>
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
                              <span className="text-dark">{request.situation}</span>
                            </div>
                          )}
                        </div>
                        {request.message && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Message</p>
                            <p className="text-sm text-dark whitespace-pre-wrap leading-relaxed">
                              {request.message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <a
                          href={`mailto:${request.email}?subject=Re: Your property valuation request — McGowan Lettings`}
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
                          href={`https://wa.me/${request.phone.replace(/\D/g, "")}`}
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
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
