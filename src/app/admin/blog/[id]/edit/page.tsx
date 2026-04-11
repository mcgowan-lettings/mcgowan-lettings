"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress-image";
import { deleteBlogPost as deleteBlogPostAction } from "@/app/actions/admin";
import UnsplashPicker from "@/components/UnsplashPicker";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  const [success, setSuccess] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [showUnsplash, setShowUnsplash] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    published: false,
  });

  const fetchPost = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      setError("Blog post not found.");
      setLoading(false);
      return;
    }

    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? "",
      content: data.content ?? "",
      published: data.published,
    });
    setCoverImage(data.cover_image ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && typeof value === "string") {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
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
    const fileExt = compressed.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, compressed);

    if (uploadError) {
      setError(`Failed to upload image: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("property-images").getPublicUrl(filePath);

    // Remove old cover image from storage
    if (coverImage) {
      const oldPath = coverImage.split("/property-images/")[1];
      if (oldPath) {
        await supabase.storage.from("property-images").remove([oldPath]);
      }
    }

    setCoverImage(publicUrl);
    setUploading(false);
    e.target.value = "";
  };

  const removeCover = async () => {
    if (coverImage) {
      const path = coverImage.split("/property-images/")[1];
      if (path) {
        await supabase.storage.from("property-images").remove([path]);
      }
    }
    setCoverImage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!form.title || !form.slug) {
      setError("Please enter a title.");
      setSaving(false);
      return;
    }

    // Check for duplicate slug (exclude current post)
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", form.slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      setError("A blog post with this URL slug already exists. Please change the title or edit the slug.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_image: coverImage || null,
        published: form.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Post updated successfully.");
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    const result = await deleteBlogPostAction(id, coverImage || null);

    if (!result.success) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/admin/blog");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
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
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-text-muted transition-colors hover:bg-gray-200 hover:text-dark"
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
          onClick={handleDelete}
          disabled={deleting}
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
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-text-muted outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <p className="text-xs text-text-muted mt-1.5">
              Auto-generated from title. Edit only if needed.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Excerpt
            </label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder="A short summary shown on the blog listing page..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Content
            </label>
            <textarea
              rows={12}
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder={"Write your blog post content here.\n\nUse blank lines to separate paragraphs.\n\n## Start a line with ## to create a heading"}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Separate paragraphs with blank lines. Start a line with <span className="font-mono bg-gray-100 px-1 rounded">##</span> to create a section heading.
            </p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
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
                className="text-xs text-red-500 hover:text-red-700 font-medium"
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
              onSelect={(url) => {
                // If there was an uploaded cover, clean it up
                if (coverImage) {
                  const oldPath = coverImage.split("/property-images/")[1];
                  if (oldPath) {
                    supabase.storage.from("property-images").remove([oldPath]);
                  }
                }
                setCoverImage(url);
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
            disabled={saving || uploading}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
