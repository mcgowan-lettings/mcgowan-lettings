import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AnimateIn } from "@/components/AnimateIn";

export const revalidate = 60;

export default async function BlogPage() {
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Greater Manchester"
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              News & Insights
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Blog
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Property news, rental market insights, and tips for landlords and
            tenants across Greater Manchester.
          </p>
        </div>
      </section>

      {/* ─── POSTS GRID ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {!posts || posts.length === 0 ? (
            <AnimateIn className="text-center py-16">
              <p className="text-text-muted text-lg">
                No blog posts yet. Check back soon for property news and
                insights.
              </p>
            </AnimateIn>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <AnimateIn key={post.id} delay={i * 0.1}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-lg bg-white border border-black/5 shadow-sm transition-all duration-300 hover:shadow-lg h-full"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-brand/[0.04]">
                          <svg className="h-12 w-12 text-brand-dark/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <time className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      <h2 className="mt-3 font-heading text-xl font-semibold text-dark leading-snug group-hover:text-brand-dark transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mt-3 text-sm text-text-muted leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
                        Read more
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
