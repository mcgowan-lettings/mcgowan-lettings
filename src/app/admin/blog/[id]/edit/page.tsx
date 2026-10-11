"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress-image";
import { deleteBlogPost as deleteBlogPostAction, updateBlogPost, removeStorageFiles } from "@/app/actions/admin";
import UnsplashPicker, { type PhotoCredit } from "@/components/UnsplashPicker";
import RichTextEditor from "@/components/RichTextEditor";
import { generateSlug } from "@/lib/slug";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import {
  STALE_UPLOAD_CHECK_MS,
  findMissingUploads,
  safeExtension,
  storagePathFromUrl,
} from "@/app/admin/properties/upload-helpers";

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
};

/** Timestamps from Postgres and from JS ISO strings differ in format. */
function sameTimestamp(a: string | null, b: string | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return !Number.isNaN(ta) && ta === tb;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Set when the post couldn't be loaded — the form is not rendered then, so
  // an empty form can never be saved over the real post.
  const [loadError, setLoadError] = useState("");
  // Turned off just before navigating away after a successful delete.
  const [leaving, setLeaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [showUnsplash, setShowUnsplash] = useState(false);
  // Cover URL and slug as loaded from the saved row. The saved cover is only
  // deleted from storage after a successful save (so Cancel never leaves the
  // post pointing at a missing file); the slug is passed to updateBlogPost so
  // the old URL is revalidated when it changes.
  const savedCover = useRef("");
  const savedSlug = useRef("");
  // Mirror of savedSlug for render (refs can't be read during render).
  const [liveSlug, setLiveSlug] = useState("");
  // Set only for Unsplash covers; an uploaded photo has no credit.
  const [coverCredit, setCoverCredit] = useState<PhotoCredit | null>(null);
  // The row's updated_at when loaded (or last saved here) — used to warn
  // before overwriting changes made elsewhere, e.g. in another tab.
  const loadedUpdatedAt = useRef<string | null>(null);
  // When the page was opened; after ~20h an unsaved uploaded cover may have
  // been reaped by cleanupOrphans (24h grace window).
  const openedAt = useRef(0);

  const emptyForm: PostForm = { title: "", slug: "", excerpt: "", content: "", published: false };
  const [form, setForm] = useState<PostForm>(emptyForm);
  // Snapshot of the form + cover as last loaded/saved, for the unsaved guard.
  const [baseline, setBaseline] = useState<{ form: PostForm; cover: string }>({ form: emptyForm, cover: "" });

  const dirty =
    !loading &&
    !loadError &&
    (form.title !== baseline.form.title ||
      form.slug !== baseline.form.slug ||
      form.excerpt !== baseline.form.excerpt ||
      form.content !== baseline.form.content ||
      form.published !== baseline.form.published ||
      coverImage !== baseline.cover);
  useUnsavedGuard(!leaving && (dirty || uploading || saving));

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const loadPost = useCallback(async (isCancelled: () => boolean = () => false) => {
    setLoading(true);
    setLoadError("");
    setError("");
    let data;
    let fetchError;
    try {
      ({ data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single());
    } catch (err) {
      fetchError = { code: "", message: err instanceof Error ? err.message : "Network error" };
    }
    if (isCancelled()) return;

    if (fetchError || !data) {
      // PGRST116 = .single() matched no rows: the post genuinely doesn't exist.
      setLoadError(
        !fetchError || fetchError.code === "PGRST116"
          ? "Blog post not found — it may have been deleted."
          : "Couldn't load this post — check your connection and try again."
      );
      setLoading(false);
      return;
    }

    const loaded: PostForm = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? "",
      content: data.content ?? "",
      published: data.published,
    };
    setForm(loaded);
    setBaseline({ form: loaded, cover: data.cover_image ?? "" });
    setCoverImage(data.cover_image ?? "");
    setCoverCredit(
      data.cover_credit_name && data.cover_credit_url
        ? { name: data.cover_credit_name, url: data.cover_credit_url }
        : null
    );
    savedCover.current = data.cover_image ?? "";
    savedSlug.current = data.slug;
    loadedUpdatedAt.current = data.updated_at ?? null;
    setLiveSlug(data.slug);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    loadPost(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadPost]);

  // Unlike the new-post page, the title never rewrites the slug here: the post
  // may already be live and indexed, and a silent slug change 404s the old URL.
  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Delete a cover from storage only if it was uploaded this session (unsaved). */
  const removeUnsavedCover = async (url: string) => {
    if (!url || url === savedCover.current) return;
    const path = storagePathFromUrl(url);
    if (!path) return;
    try {
      await supabase.storage.from("property-images").remove([path]);
    } catch {
      // Harmless — cleanupOrphans reaps it after the 24h grace window.
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image.");
      setUploading(false);
      return;
    }
    const fileExt = safeExtension(compressed, "jpg");
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      // Names are unique timestamps and never overwritten, so cache for a year.
      .upload(filePath, compressed, { cacheControl: "31536000" });

    if (uploadError) {
      setError(`Failed to upload image: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("property-images").getPublicUrl(filePath);

    await removeUnsavedCover(coverImage);

    setCoverImage(publicUrl);
    setCoverCredit(null);
    setUploading(false);
    e.target.value = "";
  };

  const removeCover = async () => {
    await removeUnsavedCover(coverImage);
    setCoverImage("");
    setCoverCredit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!form.title.trim()) {
      setError("Please enter a title.");
      setSaving(false);
      return;
    }
    const slug = generateSlug(form.slug);
    if (!slug) {
      setError("The URL slug needs at least one letter or number.");
      setSaving(false);
      return;
    }

    // An uploaded cover isn't referenced by the saved row until now, so
    // cleanupOrphans reaps it after 24h. If the page has been open that long,
    // check it still exists rather than saving a dead link.
    if (
      openedAt.current &&
      Date.now() - openedAt.current > STALE_UPLOAD_CHECK_MS &&
      coverImage &&
      coverImage !== savedCover.current &&
      storagePathFromUrl(coverImage)
    ) {
      const missing = await findMissingUploads([coverImage]);
      if (missing.length > 0) {
        setCoverImage("");
        setCoverCredit(null);
        setError("The cover image uploaded more than a day ago was cleaned up — please re-upload it.");
        setSaving(false);
        return;
      }
    }

    // Optimistic concurrency: warn if the row changed since it was loaded
    // (another tab, or the publish toggle on the list page). A failed read
    // doesn't block the save.
    try {
      const { data: current } = await supabase
        .from("blog_posts")
        .select("updated_at")
        .eq("id", id)
        .maybeSingle();
      const remoteUpdatedAt: string | null = current?.updated_at ?? null;
      if (current && !sameTimestamp(remoteUpdatedAt, loadedUpdatedAt.current)) {
        const overwrite = window.confirm(
          "This post was changed elsewhere since you opened it (e.g. another tab). Save anyway and overwrite those changes?"
        );
        if (!overwrite) {
          setSaving(false);
          return;
        }
      }
    } catch {
      // Network hiccup — fall through; the save itself will surface errors.
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
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    // The action checks for duplicate slugs server-side.
    const updatedAt = new Date().toISOString();
    let result: Awaited<ReturnType<typeof updateBlogPost>>;
    try {
      result = await updateBlogPost(id, {
        title: form.title,
        slug,
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_image: coverImage || null,
        cover_credit_name: coverImage && coverCredit ? coverCredit.name : null,
        cover_credit_url: coverImage && coverCredit ? coverCredit.url : null,
        published: form.published,
        updated_at: updatedAt,
      }, session.access_token, savedSlug.current);
    } catch {
      setError("Couldn't save — your session may have expired. Copy any unsaved text, then refresh and sign in again.");
      setSaving(false);
      return;
    }

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }
    loadedUpdatedAt.current = result.updated_at ?? updatedAt;

    // Row saved — now drop the old saved cover if it was replaced/removed.
    // Failure is harmless (cleanupOrphans reaps it), so the result is ignored.
    if (savedCover.current && savedCover.current !== coverImage) {
      removeStorageFiles([savedCover.current], session.access_token).catch(() => {});
    }
    savedCover.current = coverImage;
    savedSlug.current = slug;
    setLiveSlug(slug);
    setForm((prev) => ({ ...prev, slug }));
    setBaseline({ form: { ...form, slug }, cover: coverImage });

    setSuccess("Post updated successfully.");
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    let session;
    try {
      ({ data: { session } } = await supabase.auth.getSession());
    } catch {
      setError("Couldn't check your session — check your connection and try again.");
      setDeleting(false);
      return;
    }
    if (!session) {
      setError("Session expired. Please sign in again.");
      setDeleting(false);
      return;
    }
    // Use the *saved* cover and slug: those are what's live. An unsaved
    // replacement cover is removed separately.
    let result: Awaited<ReturnType<typeof deleteBlogPostAction>>;
    try {
      result = await deleteBlogPostAction(id, savedCover.current || null, session.access_token, savedSlug.current);
    } catch {
      setError("Couldn't delete — your session may have expired. Refresh and sign in again.");
      setDeleting(false);
      return;
    }

    if (!result.success) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    await removeUnsavedCover(coverImage).catch(() => {});

    // Deleted — the guard must not prompt on the redirect.
    setLeaving(true);
    router.push("/admin/blog");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => loadPost()}
              className="min-h-11 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light"
            >
              Retry
            </button>
            <Link
              href="/admin/blog"
              className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
            >
              Back to blog posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
              Edit Post
            </h2>
            <p className="text-sm text-text-muted">{form.title || "Loading..."}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Details */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Post Details
          </h3>

          <div>
            <label htmlFor="edit-post-title" className="mb-1.5 block text-sm font-medium text-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-post-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="edit-post-slug" className="mb-1.5 block text-sm font-medium text-dark">
              Slug
            </label>
            <input
              id="edit-post-slug"
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              onBlur={(e) => setForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-text-muted outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <p className="text-xs text-text-muted mt-1.5">
              {form.slug !== liveSlug
                ? "Changing the slug changes the post's web address — existing links to it will stop working."
                : "The post's web address. Changing the title doesn't change it."}
            </p>
          </div>

          <div>
            <label htmlFor="edit-post-excerpt" className="mb-1.5 block text-sm font-medium text-dark">
              Excerpt
            </label>
            <textarea
              id="edit-post-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder="A short summary shown on the blog listing page..."
            />
          </div>

          <div>
            <p id="edit-post-content-label" className="mb-1.5 block text-sm font-medium text-dark">
              Content
            </p>
            <RichTextEditor
              labelledBy="edit-post-content-label"
              rows={12}
              value={form.content}
              onChange={(v) => updateField("content", v)}
              includeHeading
              placeholder={"Write your blog post content here.\n\nUse blank lines to separate paragraphs."}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Separate paragraphs with blank lines. Use the toolbar for headings, <strong>bold</strong>, <em>italic</em> and links.
            </p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
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
                  src={coverImage}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
              <button
                type="button"
                onClick={removeCover}
                className="inline-flex min-h-11 items-center text-xs text-red-500 hover:text-red-700 font-medium"
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
                await removeUnsavedCover(coverImage);
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
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading || deleting}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
