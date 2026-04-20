"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { deleteBlogPost as deleteBlogPostAction } from "@/app/actions/admin";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  published: boolean;
  created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setMessage({ text: "Failed to load blog posts.", type: "error" });
      } else {
        setPosts(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePublished = async (id: string, currentPublished: boolean) => {
    setToggling(id);
    const { error } = await supabase
      .from("blog_posts")
      .update({ published: !currentPublished, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage({ text: "Failed to update post.", type: "error" });
    } else {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: !currentPublished } : p))
      );
      setMessage({
        text: `Post ${!currentPublished ? "published" : "unpublished"}.`,
        type: "success",
      });
    }
    setToggling(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    const result = await deleteBlogPostAction(post.id, post.cover_image);
    if (!result.success) {
      setMessage({ text: result.error || "Failed to delete post.", type: "error" });
      setDeletingId(null);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setMessage({ text: "Post deleted.", type: "success" });
    setDeletingId(null);
    setTimeout(() => setMessage(null), 3000);
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
            Blog Posts
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {posts.length} posts total &middot;{" "}
            {posts.filter((p) => p.published).length} published
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Post
        </Link>
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

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-text-muted">No blog posts yet.</p>
          <Link
            href="/admin/blog/new"
            className="mt-3 inline-block text-sm font-medium text-brand-dark hover:underline"
          >
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">Post</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Date</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">Published</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      !post.published ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {post.cover_image ? (
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-dark">
                            {post.title}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {post.excerpt ? post.excerpt.slice(0, 80) + (post.excerpt.length > 80 ? "..." : "") : "No excerpt"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(post.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          togglePublished(post.id, post.published)
                        }
                        disabled={toggling === post.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          post.published ? "bg-brand" : "bg-gray-300"
                        } ${toggling === post.id ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            post.published
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-dark transition-colors hover:bg-gray-200"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === post.id ? "Deleting..." : "Delete"}
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
            {posts.map((post) => (
              <div
                key={post.id}
                className={`p-4 ${!post.published ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {post.cover_image ? (
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-dark text-sm">
                      {post.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(post.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        onClick={() =>
                          togglePublished(post.id, post.published)
                        }
                        disabled={toggling === post.id}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            post.published ? "bg-brand" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              post.published
                                ? "translate-x-4.5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </span>
                        <span className="text-text-muted">
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </button>

                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-xs font-medium text-brand-dark hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deletingId === post.id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === post.id ? "Deleting..." : "Delete"}
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
