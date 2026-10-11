/**
 * Canonical origin for the public site. `www` is the primary host — the apex
 * (mcgowanlettings.co.uk) 307-redirects to it — so every canonical URL,
 * metadataBase, sitemap entry, robots line, OG url and JSON-LD `url` must use
 * this, never the bare apex, or search engines see redirecting canonicals.
 */
export const SITE_URL = "https://www.mcgowanlettings.co.uk";
