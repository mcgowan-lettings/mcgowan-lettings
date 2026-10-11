"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress-image";
import { createBlogPost } from "@/app/actions/admin";
import UnsplashPicker, { type PhotoCredit } from "@/components/UnsplashPicker";
import RichTextEditor from "@/components/RichTextEditor";
import { generateSlug } from "@/lib/slug";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import { FormMessages, useRevealMessages } from "@/app/admin/form-feedback";
import {
  ACTION_THREW_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  STALE_UPLOAD_CHECK_MS,
  findMissingUploads,
  safeExtension,
  storagePathFromUrl,
  UPLOAD_CACHE_CONTROL,
} from "@/app/admin/properties/upload-helpers";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { ref: messagesRef, reveal: revealMessages } = useRevealMessages();
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [showUnsplash, setShowUnsplash] = useState(false);
  // Set only for Unsplash covers; an uploaded photo has no credit.
  const [coverCredit, setCoverCredit] = useState<PhotoCredit | null>(null);
  // Once the slug is edited by hand, the title stops overwriting it.
  const [slugTouched, setSlugTouched] = useState(false);
  // Turned off just before navigating away after a successful create.
  const [leaving, setLeaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    published: false,
  });

  // When the page was opened — unsaved uploads older than ~24h get reaped by
  // cleanupOrphans, so a long-open page re-checks its cover before saving.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // Revoke the local preview object URL whenever it's replaced or on unmount.
  const previewRef = useRef("");
  const setPreview = (url: string) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setCoverPreview(url);
  };
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const dirty =
    form.title !== "" ||
    form.slug !== "" ||
    form.excerpt !== "" ||
    form.content !== "" ||
    form.published ||
    coverImage !== "";
  useUnsavedGuard(!leaving && (dirty || uploading || saving));

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && typeof value === "string" && !slugTouched) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      let compressed: File;
      try {
        compressed = await compressImage(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process image.");
        return;
      }
      const fileExt = safeExtension(compressed, "jpg");
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        // Names are unique timestamps and never overwritten, so cache for a year.
        .upload(filePath, compressed, { cacheControl: UPLOAD_CACHE_CONTROL });

      if (uploadError) {
        setError(`Failed to upload image: ${uploadError.message}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath);

      // Replacing an earlier (unsaved) upload — drop the old object.
      await removeStoredCover(coverImage);

      setCoverImage(publicUrl);
      setCoverCredit(null);
      setPreview(URL.createObjectURL(compressed));
    } catch (err) {
      setError(err instanceof Error ? `Failed to upload image: ${err.message}` : "Failed to upload image.");
    } finally {
      setUploading(false);
      // Reset on every path so re-picking the same file fires onChange again.
      input.value = "";
    }
  };

  /** Remove an uploaded cover from storage (no-op for Unsplash URLs). */
  async function removeStoredCover(url: string) {
    const path = url ? storagePathFromUrl(url) : null;
    if (!path) return;
    try {
      await supabase.storage.from("property-images").remove([path]);
    } catch {
      // Harmless — cleanupOrphans reaps it after the 24h grace window.
    }
  }

  const removeCover = async () => {
    if (saving) return;
    await removeStoredCover(coverImage);
    setCoverImage("");
    setCoverCredit(null);
    setPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePost();
    // The error renders at the top of the form, far from the Save button —
    // bring it into view (no-op on success: we navigate away).
    revealMessages();
  };

  const savePost = async () => {
    setError("");
    setSaving(true);

    const title = form.title.trim();
    if (!title) {
      setError("Please enter a title.");
      setSaving(false);
      return;
    }
    const slug = generateSlug(form.slug);
    if (!slug) {
      setError("Slug is empty. The title needs to contain letters or numbers — or edit the slug manually.");
      setSaving(false);
      return;
    }

    // An uploaded cover isn't referenced by any saved row until now, so
    // cleanupOrphans reaps it after 24h. If the page has been open that long,
    // check it still exists rather than saving a dead link.
    if (
      openedAt.current &&
      Date.now() - openedAt.current > STALE_UPLOAD_CHECK_MS &&
      coverImage &&
      storagePathFromUrl(coverImage)
    ) {
      const missing = await findMissingUploads([coverImage]);
      if (missing.length > 0) {
        setCoverImage("");
        setCoverCredit(null);
        setPreview("");
        setError("The cover image uploaded more than a day ago was cleaned up — please re-upload it.");
        setSaving(false);
        return;
      }
    }

    let session;
    try {
      ({ data: { session } } = await supabase.auth.getSession());
    } catch {
      setError("Couldn't check your session — check your connection and try again.");
      setSaving(false);
      return;
    }
    if (!session) {
      setError(SESSION_EXPIRED_MESSAGE);
      setSaving(false);
      return;
    }

    let result: Awaited<ReturnType<typeof createBlogPost>>;
    try {
      result = await createBlogPost({
        title,
        slug,
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_image: coverImage || null,
        cover_credit_name: coverImage && coverCredit ? coverCredit.name : null,
        cover_credit_url: coverImage && coverCredit ? coverCredit.url : null,
        published: form.published,
      }, session.access_token);
    } catch {
      setError(ACTION_THREW_MESSAGE);
      setSaving(false);
      return;
    }

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // Saved — the guard must not prompt on the redirect.
    setLeaving(true);
    router.push("/admin/blog");
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/blog"
          aria-label="Back to blog posts"
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-text-muted transition-colors hover:bg-gray-200 hover:text-dark"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
            New Blog Post
          </h2>
          <p className="text-sm text-text-muted">Write a new blog article</p>
        </div>
      </div>

      <FormMessages ref={messagesRef} error={error} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Post Details
          </h3>

          <div>
            <label htmlFor="new-post-title" className="mb-1.5 block text-sm font-medium text-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="new-post-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="e.g. 5 Things Landlords Must Do Before Letting a Property"
            />
          </div>

          <div>
            <label htmlFor="new-post-slug" className="mb-1.5 block text-sm font-medium text-dark">
              Slug
            </label>
            <input
              id="new-post-slug"
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(e.target.value !== "");
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
              onBlur={(e) => setForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-text-muted outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="auto-generated-from-title"
            />
            <p className="text-xs text-text-muted mt-1.5">
              Auto-generated from title. Edit only if needed.
            </p>
          </div>

          <div>
            <label htmlFor="new-post-excerpt" className="mb-1.5 block text-sm font-medium text-dark">
              Excerpt
            </label>
            <textarea
              id="new-post-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder="A short summary shown on the blog listing page..."
            />
          </div>

          <div>
            <p id="new-post-content-label" className="mb-1.5 block text-sm font-medium text-dark">
              Content
            </p>
            <RichTextEditor
              labelledBy="new-post-content-label"
              rows={12}
              value={form.content}
              onChange={(v) => updateField("content", v)}
              includeHeading
              placeholder={"Write your blog post content here.\n\nUse blank lines to separate paragraphs.\n\nSelect text, then use the B, I or link buttons for formatting."}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Separate paragraphs with blank lines. Use the toolbar for headings, <strong>bold</strong>, <em>italic</em> and links.
            </p>
          </div>

          <label className="flex min-h-11 items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              aria-label="Published (visible on site)"
              checked={form.published}
              onChange={(e) => updateField("published", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
            />
            <span className="text-sm text-dark">Published (visible on site)</span>
          </label>
        </div>

        {/* Cover Image */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Cover Image
          </h3>

          {coverImage ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={coverPreview || coverImage}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
              <button
                type="button"
                onClick={removeCover}
                disabled={saving}
                className="inline-flex min-h-11 items-center text-xs text-red-500 hover:text-red-700 font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove cover image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowUnsplash(true)}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-brand/5"
              >
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-brand-dark">Search stock photos</span>
                  <p className="text-xs text-text-muted mt-1">Free from Unsplash — no storage used</p>
                </div>
              </button>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-brand-dark">
                    {uploading ? "Uploading..." : "Upload your own"}
                  </span>
                  <p className="text-xs text-text-muted mt-1">JPG, PNG or WebP</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {showUnsplash && (
            <UnsplashPicker
              onSelect={async (url, credit) => {
                await removeStoredCover(coverImage);
                setPreview("");
                setCoverImage(url);
                setCoverCredit(credit);
                setShowUnsplash(false);
              }}
              onClose={() => setShowUnsplash(false)}
            />
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/blog"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="min-h-11 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
