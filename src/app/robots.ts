import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/apply", "/guarantor"] },
    ],
    sitemap: "https://mcgowanlettings.co.uk/sitemap.xml",
    host: "https://mcgowanlettings.co.uk",
  };
}
