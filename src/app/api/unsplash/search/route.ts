import { NextRequest, NextResponse } from "next/server";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function GET(req: NextRequest) {
  if (!ACCESS_KEY) {
    return NextResponse.json(
      { error: "Unsplash API key not configured" },
      { status: 500 }
    );
  }

  const query = req.nextUrl.searchParams.get("q") || "house";
  const page = req.nextUrl.searchParams.get("page") || "1";

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`,
    {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch from Unsplash" },
      { status: res.status }
    );
  }

  const data = await res.json();

  const results = data.results.map(
    (photo: {
      id: string;
      urls: { small: string; raw: string };
      alt_description: string | null;
      user: { name: string; links: { html: string } };
    }) => ({
      id: photo.id,
      thumb: photo.urls.small,
      url: `${photo.urls.raw}&w=1600&q=80`,
      alt: photo.alt_description || "Stock photo",
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    })
  );

  return NextResponse.json({
    results,
    totalPages: data.total_pages,
  });
}
