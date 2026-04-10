import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJ7-uGq-eke0gRBKbenjpoV4E";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch the Google Maps page and extract review count
    const res = await fetch(GOOGLE_MAPS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });

    const html = await res.text();

    // Try multiple patterns to extract review count
    let count: number | null = null;

    // Pattern 1: "X reviews" in the page
    const reviewMatch = html.match(/(\d[\d,]*)\s*reviews?/i);
    if (reviewMatch) {
      count = parseInt(reviewMatch[1].replace(/,/g, ""), 10);
    }

    // Pattern 2: structured data
    if (!count) {
      const ratingCountMatch = html.match(/"ratingCount"\s*:\s*(\d+)/);
      if (ratingCountMatch) {
        count = parseInt(ratingCountMatch[1], 10);
      }
    }

    // Pattern 3: userRatingsTotal
    if (!count) {
      const totalMatch = html.match(/"userRatingsTotal"\s*:\s*(\d+)/);
      if (totalMatch) {
        count = parseInt(totalMatch[1], 10);
      }
    }

    if (!count || count < 1) {
      return NextResponse.json(
        { error: "Could not extract review count", htmlLength: html.length },
        { status: 500 }
      );
    }

    // Upsert into site_config table
    const { error } = await supabaseAdmin
      .from("site_config")
      .upsert(
        { key: "google_review_count", value: String(count), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
