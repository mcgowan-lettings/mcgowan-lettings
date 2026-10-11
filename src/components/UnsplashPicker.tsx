"use client";

import { useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { trackUnsplashDownload } from "@/app/actions/unsplash";

/**
 * Build an Authorization header for the admin-only Unsplash route. The
 * picker is only ever mounted inside the admin UI so a session is always
 * available; if it isn't, we still send no token and let the route return
 * 401 to surface the problem instead of failing silently.
 */
async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

interface UnsplashPhoto {
  id: string;
  thumb: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string | null;
}

/**
 * Report a selection to Unsplash (API guideline requirement). Fire-and-forget:
 * selection never waits on, or fails because of, this call.
 */
function reportUnsplashDownload(photo: UnsplashPhoto) {
  if (!photo.downloadLocation) return;
  const downloadLocation = photo.downloadLocation;
  void (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await trackUnsplashDownload(downloadLocation, session.access_token);
    } catch {
      // Best-effort only.
    }
  })();
}

/** Photographer credit Unsplash requires wherever the photo is shown. */
export type PhotoCredit = { name: string; url: string };

interface UnsplashPickerProps {
  onSelect: (url: string, credit: PhotoCredit) => void;
  onClose: () => void;
}

export default function UnsplashPicker({ onSelect, onClose }: UnsplashPickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-binding the key listener on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration mount guard
    setMounted(true);
  }, []);

  // Escape closes; focus moves into the dialog on open and back on close.
  useEffect(() => {
    if (!mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [mounted]);

  // The query the current results belong to ("Load more" must page through
  // THAT, not whatever has since been typed), and a counter so a slow
  // response from an older search can't overwrite a newer one.
  const searchedQueryRef = useRef("");
  const requestSeqRef = useRef(0);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // React events bubble through portals to the React parent — the picker
    // is rendered inside the blog editor's <form>, so without this a search
    // would also submit (save) the post.
    e?.stopPropagation();
    const q = query.trim();
    if (!q) return;
    const seq = ++requestSeqRef.current;
    searchedQueryRef.current = q;

    setLoading(true);
    setError("");
    setSearched(true);
    setPage(1);

    try {
      const res = await fetch(
        `/api/unsplash/search?q=${encodeURIComponent(q)}&page=1`,
        { headers: await authHeaders() }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (seq !== requestSeqRef.current) return;
      setPhotos(data.results);
      setTotalPages(data.totalPages);
    } catch {
      if (seq !== requestSeqRef.current) return;
      setError("Failed to search photos. Please try again.");
      setPhotos([]);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    const seq = requestSeqRef.current;
    const q = searchedQueryRef.current;
    if (!q) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/unsplash/search?q=${encodeURIComponent(q)}&page=${nextPage}`,
        { headers: await authHeaders() }
      );
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      // A new search started meanwhile — these results belong to the old one.
      if (seq !== requestSeqRef.current) return;
      // Unsplash pages can overlap (results shift as the index updates), so
      // drop ids we already have — duplicate keys break React reconciliation.
      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = (data.results as UnsplashPhoto[]).filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        return [...prev, ...fresh];
      });
      setPage(nextPage);
      setError("");
    } catch {
      setError("Failed to load more photos.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-2xl max-h-[80vh] rounded-xl bg-white shadow-xl flex flex-col overflow-hidden outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-dark">Search Stock Photos</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Free photos from Unsplash — no storage used
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-gray-100 hover:text-dark transition-colors"
          >
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={search} className="flex gap-2 border-b border-gray-100 px-5 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "house", "office", "apartment"...'
            aria-label="Search stock photos"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-dark outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            autoFocus={typeof window !== "undefined" && window.innerWidth > 768}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="min-h-11 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          )}

          {!searched && !loading && (
            <p className="text-sm text-text-muted text-center py-8">
              Search for a photo to use as your blog cover image.
            </p>
          )}

          {searched && !loading && photos.length === 0 && !error && (
            <p className="text-sm text-text-muted text-center py-8">
              No photos found. Try a different search term.
            </p>
          )}

          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      reportUnsplashDownload(photo);
                      onSelect(photo.url, { name: photo.photographer, url: photo.photographerUrl });
                    }}
                    className="group relative aspect-[16/10] overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <Image
                      src={photo.thumb}
                      alt={photo.alt}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Use this
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {page < totalPages && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="min-h-11 rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
