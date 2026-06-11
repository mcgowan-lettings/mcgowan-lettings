"use client";

import { useEffect, useRef, useState } from "react";
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

export default function VideoLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const muteBtnRef = useRef<HTMLButtonElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const lastNonZeroVolumeRef = useRef(DEFAULT_VOLUME);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (volume > 0) lastNonZeroVolumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUSIC_VOLUME_KEY);
      if (stored != null) {
        const n = parseFloat(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time init from localStorage on mount
        if (!Number.isNaN(n) && n >= 0 && n <= 1) setVolume(n);
      }
    } catch {}
  }, []);

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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
        <audio ref={audioRef} src={MUSIC_SRC} preload="auto" />
      </div>
    </div>
  );
}
