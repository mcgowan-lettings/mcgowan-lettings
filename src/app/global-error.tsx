"use client";

// Last-resort boundary for errors in the root layout itself. It replaces the
// whole document, so no globals.css / fonts / header — keep it self-contained
// with inline styles.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          color: "#ffffff",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <title>Something went wrong | McGowan Residential Lettings</title>
        <main style={{ maxWidth: 480 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 600, fontSize: 32, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Sorry, the site hit an unexpected error. Please try again, or call
            us on <a href="tel:01617976967" style={{ color: "#abd300" }}>0161 797 6967</a>.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              padding: "12px 32px",
              border: 0,
              borderRadius: 2,
              background: "#abd300",
              color: "#1a1a1a",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {/* Plain <a>: a full reload is the right recovery when the root layout failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginLeft: 16, color: "#ffffff" }}>
            Home
          </a>
        </main>
      </body>
    </html>
  );
}
