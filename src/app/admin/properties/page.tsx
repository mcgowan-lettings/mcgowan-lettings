"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminThumb from "@/app/admin/AdminThumb";
import { useAutoClear } from "@/app/admin/form-feedback";
import { supabase } from "@/lib/supabase";
import { deleteProperty as deletePropertyAction, togglePropertyActive, togglePropertyFeatured, togglePropertyNew } from "@/app/actions/admin";
import { SESSION_EXPIRED_MESSAGE } from "./upload-helpers";

// Nothing on this page is unsaved, so a refresh is safe advice here.
const TOGGLE_THREW_MESSAGE = "Couldn't update — your session may have expired. Refresh and sign in again.";

interface Property {
  id: string;
  title: string;
  location: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  type: string;
  active: boolean;
  featured: boolean;
  is_new: boolean;
  images: string[];
  videos: string[] | null;
  epc_document: string | null;
  created_at: string;
}

/**
 * What the homepage will show for a given number of active + featured
 * listings — mirrors getFeaturedProperties() in src/app/page.tsx: 6 cards if
 * 6+ are featured, otherwise up to 3 (available before Let Agreed); with none
 * featured it falls back to the available listings.
 */
function featuredHint(n: number): string {
  if (n === 0) {
    return "Nothing featured — the homepage shows your available listings instead. Star 3 or 6 active listings to choose them.";
  }
  if (n < 3) {
    return `The homepage shows ${n === 1 ? "this 1 listing" : "these 2 listings"}. Star 3 or 6 active listings to fill a full row or two.`;
  }
  if (n === 3 || n === 6) return `The homepage shows all ${n} featured listings.`;
  if (n < 6) {
    return `The homepage shows only 3 of these ${n} (available ones first). Star exactly 3 or 6 to control which appear.`;
  }
  return `The homepage shows only 6 of these ${n} (available ones first). Star exactly 6 to control which appear.`;
}

// Lowercase and drop punctuation so "43 Harvey St, Bury" matches "43 harvey st bury".
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  // Lists load at most 1000 rows; say so rather than silently hide the rest.
  const [capped, setCapped] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [togglingNew, setTogglingNew] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const messageTimer = useAutoClear();
  /** Successes fade after 3s; errors stay until replaced, so one action's
   * timer can never wipe another action's error. */
  const showMessage = (next: { text: string; type: "success" | "error" }) => {
    setMessage(next);
    if (next.type === "success") messageTimer.schedule(() => setMessage(null));
    else messageTimer.cancel();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        setMessage({ text: "Failed to load properties.", type: "error" });
      } else {
        setProperties(data ?? []);
        setCapped((data ?? []).length >= 1000);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Every word typed must appear somewhere in the address/area/type, in any order.
  const filteredProperties = useMemo(() => {
    const terms = normalise(query).split(" ").filter(Boolean);
    if (terms.length === 0) return properties;
    return properties.filter((p) => {
      const haystack = normalise(`${p.title} ${p.location} ${p.area} ${p.type}`);
      return terms.every((t) => haystack.includes(t));
    });
  }, [properties, query]);

  // Only active + featured listings reach the homepage (src/app/page.tsx).
  const featuredLive = properties.filter((p) => p.featured && p.active).length;

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showMessage({ text: SESSION_EXPIRED_MESSAGE, type: "error" });
        return;
      }

      const result = await togglePropertyActive(id, !currentActive, session.access_token);
      if (!result.success) {
        showMessage({ text: "Failed to update property.", type: "error" });
      } else {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
        );
      }
    } catch {
      showMessage({ text: TOGGLE_THREW_MESSAGE, type: "error" });
    } finally {
      setToggling(null);
    }
  };

  const deleteProperty = async (property: Property) => {
    if (!window.confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(property.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showMessage({ text: SESSION_EXPIRED_MESSAGE, type: "error" });
        return;
      }
      const fileUrls = [...(property.images || []), ...(property.videos || []), property.epc_document].filter(
        (u): u is string => !!u
      );
      const result = await deletePropertyAction(property.id, fileUrls, session.access_token);

      if (!result.success) {
        showMessage({ text: "Failed to delete property.", type: "error" });
      } else {
        setProperties((prev) => prev.filter((p) => p.id !== property.id));
        showMessage({ text: "Property deleted.", type: "success" });
      }
    } catch {
      showMessage({ text: "Couldn't delete — your session may have expired. Refresh and sign in again.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    if (togglingFeatured === id) return;
    setTogglingFeatured(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showMessage({ text: SESSION_EXPIRED_MESSAGE, type: "error" });
        return;
      }

      const result = await togglePropertyFeatured(id, !currentFeatured, session.access_token);
      if (!result.success) {
        showMessage({ text: "Failed to update featured status.", type: "error" });
      } else {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, featured: !currentFeatured } : p
          )
        );
      }
    } catch {
      showMessage({ text: TOGGLE_THREW_MESSAGE, type: "error" });
    } finally {
      setTogglingFeatured(null);
    }
  };

  const toggleNew = async (id: string, currentNew: boolean) => {
    if (togglingNew === id) return;
    setTogglingNew(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showMessage({ text: SESSION_EXPIRED_MESSAGE, type: "error" });
        return;
      }

      const result = await togglePropertyNew(id, !currentNew, session.access_token);
      if (!result.success) {
        showMessage({ text: "Failed to update the New Property badge.", type: "error" });
      } else {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_new: !currentNew } : p
          )
        );
      }
    } catch {
      showMessage({ text: TOGGLE_THREW_MESSAGE, type: "error" });
    } finally {
      setTogglingNew(null);
    }
  };

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
            Properties
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {properties.length} {properties.length === 1 ? "property" : "properties"} total &middot;{" "}
            {properties.filter((p) => p.active).length} active &middot;{" "}
            {featuredLive} featured on the homepage
          </p>
          <p className="text-xs text-text-muted mt-1">{featuredHint(featuredLive)}</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Property
        </Link>
      </div>

      {/* Notification */}
      {capped && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Showing the most recent 1000 — older items aren&apos;t shown.
        </p>
      )}

      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      {properties.length > 0 && (
        <div className="relative">
          <label htmlFor="property-search" className="sr-only">
            Search properties
          </label>
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="property-search"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search by address, area or type…"
            className="block h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-base text-dark shadow-sm placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-dark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Properties list */}
      {properties.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-text-muted">No properties yet.</p>
          <Link
            href="/admin/properties/new"
            className="mt-3 inline-block text-sm font-medium text-brand-dark hover:underline"
          >
            Add your first property
          </Link>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-text-muted">No properties match &ldquo;{query.trim()}&rdquo;.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 inline-block text-sm font-medium text-brand-deep hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">Property</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Area</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Price</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Beds</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">Active</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">Featured</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">New</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      !property.active ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {property.images?.[0] ? (
                            <AdminThumb
                              src={property.images[0]}
                              alt={property.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-dark">
                            {property.title}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {property.type} &middot; {property.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {property.area}
                    </td>
                    <td className="px-4 py-3 font-medium text-dark">
                      &pound;{property.price.toLocaleString("en-GB")}/mo
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {property.beds === 0 ? "Studio" : property.beds}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {/* 44px hit area around the visual switch */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(property.id, property.active)
                        }
                        disabled={toggling === property.id}
                        aria-pressed={property.active}
                        aria-label={`Active (visible on site): ${property.title}`}
                        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg ${
                          toggling === property.id ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            property.active ? "bg-brand" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              property.active
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleFeatured(property.id, property.featured)
                        }
                        disabled={togglingFeatured === property.id}
                        aria-pressed={property.featured}
                        aria-label={`Featured on homepage: ${property.title}`}
                        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          property.featured
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        }`}
                        title={
                          property.featured
                            ? "Remove from featured"
                            : "Mark as featured"
                        }
                      >
                        <svg
                          className="h-5 w-5"
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill={property.featured ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleNew(property.id, property.is_new)}
                        disabled={togglingNew === property.id}
                        aria-pressed={property.is_new}
                        aria-label={`New Property badge: ${property.title}`}
                        className="group/new inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          property.is_new
                            ? "Remove the New Property badge"
                            : "Show the New Property badge"
                        }
                      >
                        {/* 44px hit area; the visible pill stays compact. */}
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                            property.is_new
                              ? "bg-brand text-dark"
                              : "bg-gray-100 text-gray-400 group-hover/new:bg-gray-200 group-hover/new:text-gray-500"
                          }`}
                        >
                          New
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-100 px-3 text-xs font-medium text-dark transition-colors hover:bg-gray-200"
                        >
                          <svg className="h-3.5 w-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteProperty(property)}
                          disabled={deletingId === property.id}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === property.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className={`p-4 ${!property.active ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {property.images?.[0] ? (
                      <AdminThumb
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-dark text-sm">
                      {property.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {property.area} &middot; {property.beds === 0 ? "Studio" : `${property.beds} bed`} &middot;{" "}
                      &pound;{property.price.toLocaleString("en-GB")}/mo
                    </p>
                    {/* min-h-[44px] tap targets; -ml-2 keeps the toggle visually aligned with the title */}
                    <div className="mt-1 -ml-2 flex flex-wrap items-center gap-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(property.id, property.active)
                        }
                        disabled={toggling === property.id}
                        aria-pressed={property.active}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs disabled:opacity-50"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            property.active ? "bg-brand" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              property.active
                                ? "translate-x-4.5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </span>
                        <span className="text-text-muted">
                          {property.active ? "Active" : "Inactive"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleFeatured(property.id, property.featured)
                        }
                        disabled={togglingFeatured === property.id}
                        aria-pressed={property.featured}
                        className={`flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                          property.featured
                            ? "text-amber-500"
                            : "text-gray-400"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill={property.featured ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                        Featured
                      </button>

                      {/* Visual pill inside a 44px tap target */}
                      <button
                        type="button"
                        onClick={() => toggleNew(property.id, property.is_new)}
                        disabled={togglingNew === property.id}
                        aria-pressed={property.is_new}
                        aria-label="New Property badge"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            property.is_new
                              ? "bg-brand text-dark"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          New
                        </span>
                      </button>

                      <Link
                        href={`/admin/properties/${property.id}/edit`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 text-xs font-medium text-brand-dark hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteProperty(property)}
                        disabled={deletingId === property.id}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === property.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
