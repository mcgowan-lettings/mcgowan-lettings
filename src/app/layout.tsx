import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteShell from "@/components/SiteShell";
import { supabaseAdmin } from "@/lib/supabase-server";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mcgowanlettings.co.uk"),
  title: "McGowan Residential Lettings | Premium Lettings in Greater Manchester",
  description:
    "McGowan Residential Lettings — professional letting agents covering Bolton, Bury, Manchester & Rossendale. Find your perfect rental property or let your investment with confidence.",
  openGraph: {
    title: "McGowan Residential Lettings | Greater Manchester",
    description:
      "Professional letting agents covering Bolton, Bury, Manchester & Rossendale. Find your perfect rental property or let your investment with confidence.",
    url: "https://mcgowanlettings.co.uk",
    siteName: "McGowan Residential Lettings",
    type: "website",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "McGowan Residential Lettings — Greater Manchester" }],
  },
  twitter: { card: "summary_large_image", images: ["/hero.jpg"] },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

async function getReviewCount(): Promise<number | null> {
  try {
    const { data } = await supabaseAdmin
      .from("site_config")
      .select("value")
      .eq("key", "google_review_count")
      .single();
    const parsed = data?.value ? Number(data.value) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reviewCount = await getReviewCount();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "McGowan Residential Lettings Ltd.",
    url: "https://mcgowanlettings.co.uk",
    logo: "https://mcgowanlettings.co.uk/mcgowan-logo.png",
    image: "https://mcgowanlettings.co.uk/hero.jpg",
    telephone: "0161 797 6967",
    email: "info@mcgowanlettings.co.uk",
    priceRange: "££",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bury",
      addressRegion: "Greater Manchester",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 53.5935,
      longitude: -2.2975,
    },
    areaServed: [
      "Bury", "Bolton", "Manchester", "Rossendale", "Accrington", "Burnley",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "14:00",
      },
    ],
    sameAs: [
      "https://wa.me/447457428720",
    ],
  };

  if (reviewCount) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteShell>{children}</SiteShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
