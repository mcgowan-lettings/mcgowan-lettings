"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import "plyr/dist/plyr.css";

const MUSIC_VOLUME_KEY = "mcgowan:video-music-volume";
const DEFAULT_VOLUME = 1;
// Sweet September fades out from ~113s of its 119s runtime. Restart from t=0
// before the fade begins so the loop point lands music-to-music instead of
// silence-to-music (which would pop). Increment ?v= when the track is swapped
// to bust any cached copies in user browsers.
const MUSIC_SRC = "/audio/virtual-view.mp3?v=2";
const MUSIC_LOOP_AT = 113;

// Speaker icons — 18x18 viewBox to match Plyr's own icon dimensions exactly
// (Plyr forces width/height via --plyr-control-icon-size: 18px), and fully
// filled paths so the visual weight matches the play/fullscreen icons sitting
// next to this one rather than reading as a thinner stroke-based outlier.
const SVG_VOLUME_ON = `<svg aria-hidden="true" focusable="false" viewBox="0 0 18 18"><path d="M9 1.5v15a.5.5 0 0 1-.85.35L3.9 12.5H1.5A.5.5 0 0 1 1 12V6a.5.5 0 0 1 .5-.5h2.4l4.25-4.35A.5.5 0 0 1 9 1.5z" fill="currentColor"/><path d="M11.96 6.45a.7.7 0 0 1 .98-.05 4 4 0 0 1 0 5.2.7.7 0 1 1-1.04-.94 2.6 2.6 0 0 0 0-3.32.7.7 0 0 1 .06-.89z" fill="currentColor"/><path d="M13.95 3.65a.7.7 0 0 1 .98 0 7 7 0 0 1 0 10.7.7.7 0 0 1-.98-1 5.6 5.6 0 0 0 0-8.7.7.7 0 0 1 0-1z" fill="currentColor"/></svg>`;
const SVG_VOLUME_OFF = `<svg aria-hidden="true" focusable="false" viewBox="0 0 18 18"><path d="M9 1.5v15a.5.5 0 0 1-.85.35L3.9 12.5H1.5A.5.5 0 0 1 1 12V6a.5.5 0 0 1 .5-.5h2.4l4.25-4.35A.5.5 0 0 1 9 1.5z" fill="currentColor"/><path d="M11.3 6.3a.7.7 0 0 1 1 0L14 8l1.7-1.7a.7.7 0 0 1 1 1L15 9l1.7 1.7a.7.7 0 0 1-1 1L14 10l-1.7 1.7a.7.7 0 0 1-1-1L13 9l-1.7-1.7a.7.7 0 0 1 0-1z" fill="currentColor"/></svg>`;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function readStoredVolume(): number {
  try {
    const stored = localStorage.getItem(MUSIC_VOLUME_KEY);
    if (stored != null) {
      const n = parseFloat(stored);
      if (!Number.isNaN(n) && n >= 0 && n <= 1) return n;
    }
  } catch {}
  return DEFAULT_VOLUME;
}

/**
 * Modal shell for one or more tour videos: portals to <body>, makes the rest
 * of the page `inert` (so Safari's Tab can't escape into the map iframe),
 * traps focus, handles Escape/scroll lock, and offers prev/next when a
 * listing has several videos. The player itself is keyed by src so switching
 * videos tears Plyr down cleanly and builds a fresh one.
 */
export default function VideoLightbox({
  sources,
  initialIndex = 0,
  onClose,
  returnFocusRef,
}: {
  sources: string[];
  initialIndex?: number;
  onClose: () => void;
  /** Element to refocus on close. Safari doesn't focus links/buttons on
   *  click, so document.activeElement isn't a reliable trigger there. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(sources.length - 1, 0)),
  );
  const count = sources.length;
  const src = sources[index];

  // Focus management: inert the background, move focus to Close on open,
  // trap Tab inside the dialog, and restore focus to the trigger on close.
  useEffect(() => {
    const activeEl =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null;
    const restoreTarget = returnFocusRef?.current ?? activeEl;

    // The dialog is portalled straight into <body>, so every other body
    // child is background. Only touch elements we inert ourselves.
    const inerted: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === dialogRef.current || !(el instanceof HTMLElement) || el.inert) continue;
      el.inert = true;
      inerted.push(el);
    }

    closeBtnRef.current?.focus();

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && dialog.contains(current);
      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);

    return () => {
      document.removeEventListener("keydown", onTab);
      // Un-inert first: an inert element can't take focus.
      for (const el of inerted) el.inert = false;
      restoreTarget?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture the trigger once, on open
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!src) return null;

  const navBtn =
    "inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-3 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={count > 1 ? `Virtual tour ${index + 1} of ${count}` : "Virtual tour"}
      className="video-lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-8"
      style={{ background: "rgba(24, 24, 27, 0.92)" }}
      onClick={onClose}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-2 md:top-3 md:right-3 h-11 w-11 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white transition-colors flex items-center justify-center"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="video-lightbox-content w-full max-w-5xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <TourPlayer key={src} src={src} maxHeight={count > 1 ? "calc(90vh - 3.5rem)" : "90vh"} />
        {count > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className={navBtn}
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
              aria-label="Previous tour video"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>
            <p className="text-white/80 text-sm tabular-nums" aria-live="polite">
              Tour {index + 1} of {count}
            </p>
            <button
              type="button"
              className={navBtn}
              onClick={() => setIndex((i) => (i + 1) % count)}
              aria-label="Next tour video"
            >
              <span className="hidden sm:inline">Next</span>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** One tour video: Plyr + the background-music track and its controls. */
function TourPlayer({ src, maxHeight }: { src: string; maxHeight: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const muteBtnRef = useRef<HTMLButtonElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  // Client-only (the lightbox only mounts after a click), so reading
  // localStorage in the initialiser can't cause a hydration mismatch.
  const [volume, setVolume] = useState(readStoredVolume);
  const lastNonZeroVolumeRef = useRef(volume > 0 ? volume : DEFAULT_VOLUME);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (volume > 0) lastNonZeroVolumeRef.current = volume;
  }, [volume]);

  // Sync audio + control UI when volume changes
  useEffect(() => {
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(volume));
    } catch {}
    const audio = audioRef.current;
    const video = videoRef.current;
    if (audio) {
      audio.volume = volume;
      if (volume > 0 && video && !video.paused && !video.ended) {
        audio.play().catch(() => {});
      } else if (volume === 0) {
        audio.pause();
      }
    }
    const btn = muteBtnRef.current;
    if (btn) {
      const on = volume > 0;
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Mute background music" : "Unmute background music");
      btn.innerHTML = on ? SVG_VOLUME_ON : SVG_VOLUME_OFF;
    }
    const slider = sliderRef.current;
    if (slider) {
      if (parseFloat(slider.value) !== volume) slider.value = String(volume);
      slider.style.setProperty("--music-vol", String(volume * 100));
    }
  }, [volume]);

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
        fullscreen: { enabled: true, fallback: true, iosNative: true },
      });

      plyr.on("ready", () => {
        if (cancelled) return;
        const controlsEl = plyr.elements?.controls as HTMLElement | null;
        if (!controlsEl || muteBtnRef.current) return;

        const wrapper = document.createElement("div");
        wrapper.className = "plyr__controls__item plyr-music-control";
        wrapper.style.display = "inline-flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "plyr__control";
        btn.dataset.plyr = "music-mute";
        const startVol = volumeRef.current;
        btn.setAttribute("aria-pressed", String(startVol > 0));
        btn.setAttribute(
          "aria-label",
          startVol > 0 ? "Mute background music" : "Unmute background music",
        );
        btn.innerHTML = startVol > 0 ? SVG_VOLUME_ON : SVG_VOLUME_OFF;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          setVolume((v) => (v > 0 ? 0 : lastNonZeroVolumeRef.current || DEFAULT_VOLUME));
        });

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "1";
        slider.step = "0.05";
        slider.value = String(startVol);
        slider.setAttribute("aria-label", "Background music volume");
        slider.dataset.plyr = "music-volume";
        slider.className = "plyr-music-slider";
        slider.style.width = "70px";
        slider.style.cursor = "pointer";
        slider.style.setProperty("--music-vol", String(startVol * 100));
        slider.addEventListener("input", (e) => {
          const v = parseFloat((e.target as HTMLInputElement).value);
          setVolume(Number.isFinite(v) ? v : 0);
        });
        slider.addEventListener("click", (e) => e.stopPropagation());

        wrapper.appendChild(btn);
        wrapper.appendChild(slider);

        const fullscreenBtn = controlsEl.querySelector('[data-plyr="fullscreen"]');
        if (fullscreenBtn) controlsEl.insertBefore(wrapper, fullscreenBtn);
        else controlsEl.appendChild(wrapper);

        muteBtnRef.current = btn;
        sliderRef.current = slider;
      });
    })();

    const video = videoRef.current;
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volumeRef.current;
      audio.loop = false;
    }

    const handlePlay = () => {
      if (volumeRef.current > 0 && audio) audio.play().catch(() => {});
    };
    const handlePause = () => {
      audio?.pause();
    };
    const handleEnded = () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
    const handleAudioTimeUpdate = () => {
      if (audio && audio.currentTime >= MUSIC_LOOP_AT) audio.currentTime = 0;
    };

    video?.addEventListener("play", handlePlay);
    video?.addEventListener("pause", handlePause);
    video?.addEventListener("ended", handleEnded);
    audio?.addEventListener("timeupdate", handleAudioTimeUpdate);

    return () => {
      cancelled = true;
      plyr?.destroy();
      video?.removeEventListener("play", handlePlay);
      video?.removeEventListener("pause", handlePause);
      video?.removeEventListener("ended", handleEnded);
      audio?.removeEventListener("timeupdate", handleAudioTimeUpdate);
      audio?.pause();
      muteBtnRef.current = null;
      sliderRef.current = null;
    };
  }, []);

  return (
    <div className="plyr-brand w-full" style={{ maxHeight }}>
      <video ref={videoRef} src={src} playsInline style={{ maxHeight, objectFit: "contain" }} />
      <audio ref={audioRef} src={MUSIC_SRC} preload="auto" />
    </div>
  );
}
