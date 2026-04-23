"use client";

import { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

export default function VideoLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let plyr: any = null;
    let cancelled = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import("plyr");
      const Plyr = mod.default ?? mod;
      if (cancelled || !videoRef.current) return;
      plyr = new Plyr(videoRef.current, {
        controls: ["play-large", "play", "progress", "current-time", "fullscreen"],
        hideControls: false,
        clickToPlay: true,
      });
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      plyr?.destroy();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="video-lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-8"
      style={{ background: "rgba(24, 24, 27, 0.92)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-2 md:top-3 md:right-3 h-11 w-11 md:h-10 md:w-10 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white transition-colors flex items-center justify-center"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="video-lightbox-content w-full max-w-5xl max-h-[90vh] plyr-brand"
        onClick={(e) => e.stopPropagation()}
      >
        <video ref={videoRef} src={src} playsInline style={{ maxHeight: "90vh", objectFit: "contain" }} />
      </div>
    </div>
  );
}
