"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress-image";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    published: false,
  });

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

    const compressed = await compressImage(file);
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

    setCoverImage(publicUrl);
    setCoverPreview(URL.createObjectURL(compressed));
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
    setCoverPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.title || !form.slug) {
      setError("Please enter a title.");
      setSaving(false);
      return;
    }

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", form.slug)
      .maybeSingle();

    if (existing) {
      setError("A blog post with this URL slug already exists. Please change the title or edit the slug.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("blog_posts").insert({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content || null,
      cover_image: coverImage || null,
      published: form.published,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/blog");
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
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
            New Blog Post
          </h2>
          <p className="text-sm text-text-muted">Write a new blog article</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
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
              placeholder="e.g. 5 Things Landlords Must Do Before Letting a Property"
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
              placeholder="auto-generated-from-title"
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
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove cover image
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-brand-dark">
                  {uploading ? "Uploading..." : "Click to upload cover image"}
                </span>
                <p className="text-xs text-text-muted mt-1">
                  JPG, PNG or WebP. Recommended 16:9 aspect ratio.
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/admin/blog"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
