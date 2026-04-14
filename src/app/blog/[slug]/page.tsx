import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AnimateIn } from "@/components/AnimateIn";
import { renderInline, isHtml } from "@/lib/rich-text";
import BlogRichContent from "./BlogRichContent";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select("title, excerpt, cover_image, content")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) {
    return { title: "Post Not Found | McGowan Residential Lettings" };
  }

  const title = `${post.title} | McGowan Residential Lettings`;
  const fallback = (post.content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const description = post.excerpt || fallback || `Read ${post.title} on the McGowan Residential Lettings blog.`;
  const image = post.cover_image || "/hero.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) {
    notFound();
  }

  const rawContent: string = post.content ?? "";
  const contentIsHtml = isHtml(rawContent);

  // Parse legacy markdown content blocks — lines starting with ## become headings
  const blocks = contentIsHtml
    ? []
    : rawContent
        .split(/\n\n+/)
        .filter((p: string) => p.trim())
        .map((block: string) => {
          const trimmed = block.trim();
          if (trimmed.startsWith("## ")) {
            return { text: trimmed.slice(3), isHeading: true };
          }
          return { text: trimmed, isHeading: false };
        });

  const wordCount = contentIsHtml
    ? rawContent.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
    : rawContent.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));

  const postUrl = `https://mcgowanlettings.co.uk/blog/${slug}`;
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description:
      post.excerpt ||
      (post.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    image: post.cover_image
      ? [post.cover_image.startsWith("http") ? post.cover_image : `https://mcgowanlettings.co.uk${post.cover_image}`]
      : ["https://mcgowanlettings.co.uk/hero.jpg"],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Organization",
      name: "McGowan Residential Lettings Ltd.",
      url: "https://mcgowanlettings.co.uk",
    },
    publisher: {
      "@type": "Organization",
      name: "McGowan Residential Lettings Ltd.",
      logo: {
        "@type": "ImageObject",
        url: "https://mcgowanlettings.co.uk/mcgowan-logo.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="100vw"
              quality={85}
              className="object-cover object-center opacity-40"
              priority
            />
          ) : (
            <Image
              src="/hero.jpg"
              alt="Greater Manchester"
              fill
              sizes="100vw"
              quality={85}
              className="object-cover object-center opacity-40"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-10 w-full">
          <div className="flex items-center gap-3 mb-4">
            <time className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              {new Date(post.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-white/50 text-sm">{readingTime} min read</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-[1.15]">
            {post.title}
          </h1>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          {/* Breadcrumb */}
          <AnimateIn>
            <nav className="mb-10 flex items-center gap-2 text-sm text-text-muted">
              <Link href="/" className="hover:text-dark transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-dark transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-dark font-medium truncate max-w-[200px] sm:max-w-none">
                {post.title}
              </span>
            </nav>
          </AnimateIn>

          {/* Article */}
          <AnimateIn delay={0.1}>
            <article>
              {post.excerpt && (
                <div className="mb-10 pb-10 border-b border-black/10">
                  <div className="w-10 h-[3px] bg-brand mb-5" />
                  <p className="text-xl md:text-2xl text-dark font-heading font-medium leading-snug">
                    {post.excerpt}
                  </p>
                </div>
              )}

              {contentIsHtml ? (
                <BlogRichContent html={rawContent} />
              ) : (
                <div className="space-y-6">
                  {blocks.map(
                    (block: { text: string; isHeading: boolean }, i: number) =>
                      block.isHeading ? (
                        <h2
                          key={i}
                          className="font-heading text-xl md:text-2xl font-semibold text-dark mt-10 first:mt-0 pl-5 border-l-[3px] border-brand"
                        >
                          {renderInline(block.text)}
                        </h2>
                      ) : (
                        <p
                          key={i}
                          className="text-dark/75 leading-[1.8] text-[15px] md:text-base"
                        >
                          {renderInline(block.text)}
                        </p>
                      )
                  )}
                </div>
              )}
            </article>
          </AnimateIn>

          {/* CTA */}
          <AnimateIn delay={0.15}>
            <div className="mt-14 p-8 bg-dark rounded-lg text-center">
              <p className="text-white/80 text-sm mb-4">
                Need advice on your rental property?
              </p>
              <Link
                href="/valuation"
                className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
              >
                Get a Free Valuation
                <svg
                  className="h-4 w-4"
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
              </Link>
            </div>
          </AnimateIn>

          {/* Back to blog */}
          <AnimateIn delay={0.2}>
            <div className="mt-10 pt-8 border-t border-black/5">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back to all posts
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
