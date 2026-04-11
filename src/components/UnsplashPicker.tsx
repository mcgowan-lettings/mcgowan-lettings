"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface UnsplashPhoto {
  id: string;
  thumb: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface UnsplashPickerProps {
  onSelect: (url: string) => void;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setPage(1);

    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(query.trim())}&page=1`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setPhotos(data.results);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to search photos. Please try again.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(query.trim())}&page=${nextPage}`);
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.results]);
      setPage(nextPage);
    } catch {
      setError("Failed to load more photos.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-xl bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-dark">Search Stock Photos</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Free photos from Unsplash — no storage used
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-gray-100 hover:text-dark transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-dark outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            autoFocus={typeof window !== "undefined" && window.innerWidth > 768}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={() => onSelect(photo.url)}
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
                    className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50"
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
