"use client";

export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

export type TranscodeStage = "loading" | "transcoding";

// Any single step that goes this long without moving forward is treated as a
// hang. WebCodecs/hardware-decoder setup can stall forever on some machines
// without ever throwing, which left the UI spinning on "Preparing video...".
const SETUP_TIMEOUT_MS = 60_000;
const STALL_TIMEOUT_MS = 60_000;

const SEND_TO_VIKTOR = "Please email the clip to Viktor and he'll get it added to the listing for you.";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

// Safari 27.0.1's H.264 encoder silently produces zero output for the High and
// Main profiles in quality mode — encode() queues frames forever and flush()
// never resolves, so every conversion froze at 0%. Baseline profile still
// works (verified: all frames kept, correct orientation) and plays everywhere,
// so mediabunny's chosen avc1.PPCCLL string is rewritten to Baseline at the
// same level for the duration of a conversion. Mediabunny's Conversion API
// doesn't expose the codec string, hence the scoped prototype patch.
function forceAvcBaseline(): () => void {
  if (typeof VideoEncoder === "undefined") return () => {};
  const original = VideoEncoder.prototype.configure;
  VideoEncoder.prototype.configure = function (config: VideoEncoderConfig) {
    const avc = /^avc1\.[0-9a-f]{4}([0-9a-f]{2})$/i.exec(config.codec);
    return original.call(this, avc ? { ...config, codec: `avc1.4200${avc[1]}` } : config);
  };
  return () => {
    VideoEncoder.prototype.configure = original;
  };
}

async function transcodeWithWebCodecs(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  const restoreEncoder = forceAvcBaseline();
  try {
    return await runWebCodecsConversion(file, onProgress);
  } finally {
    restoreEncoder();
  }
}

async function runWebCodecsConversion(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  onProgress?.("loading", 0);

  // Everything before the first progress tick — loading the library, reading
  // the container, probing the decoder, building the pipeline — sits under one
  // deadline, so no step in the "Preparing video..." phase can hang unbounded.
  const setup = async () => {
    const {
      Input, Output, Conversion,
      BlobSource, BufferTarget,
      Mp4OutputFormat,
      ALL_FORMATS,
      canDecodeVideo,
    } = await import("mediabunny");

    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target,
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error("No video track found in this file. Please upload a standard video file (MP4).");
    }

    // Fail fast on source codecs this browser can't decode (most commonly
    // iPhone HEVC / H.265 recordings).
    const srcCodec = videoTrack.codec;
    if (!srcCodec || !(await canDecodeVideo(srcCodec))) {
      throw new Error(`This clip is in a video format that can't be converted here. ${SEND_TO_VIKTOR}`);
    }

    const srcW = videoTrack.displayWidth ?? 1920;
    const srcH = videoTrack.displayHeight ?? 1080;
    const isLandscape = srcW >= srcH;

    const conversion = await Conversion.init({
      input,
      output,
      video: {
        codec: "avc",
        bitrate: 3_500_000,
        ...(isLandscape ? { width: Math.min(srcW, 1920) } : { height: Math.min(srcH, 1920) }),
      },
      audio: { discard: true },
    });

    return { conversion, target };
  };

  const setupPromise = setup();
  let built: Awaited<typeof setupPromise>;
  try {
    built = await withTimeout(
      setupPromise,
      SETUP_TIMEOUT_MS,
      `Preparing the video timed out. ${SEND_TO_VIKTOR}`,
    );
  } catch (err) {
    // The timeout only stops us waiting — setup() keeps running. If it builds
    // a conversion after we've given up, cancel it so it can't hold decoders
    // or memory while the MediaRecorder fallback runs.
    setupPromise.then(
      ({ conversion }) => conversion.cancel().catch(() => {}),
      () => {},
    );
    throw err;
  }
  const { conversion, target } = built;

  onProgress?.("transcoding", 0);

  let lastProgressAt = Date.now();
  conversion.onProgress = (p) => {
    lastProgressAt = Date.now();
    onProgress?.("transcoding", Math.min(p, 1));
  };

  let watchdog: ReturnType<typeof setInterval> | undefined;
  const stalled = new Promise<never>((_, reject) => {
    watchdog = setInterval(() => {
      if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
        void conversion.cancel().catch(() => {});
        reject(new Error(`Converting the video stalled. ${SEND_TO_VIKTOR}`));
      }
    }, 5_000);
  });

  try {
    await Promise.race([conversion.execute(), stalled]);
  } finally {
    clearInterval(watchdog);
  }

  const buffer = target.buffer!;
  const newName = file.name.replace(/\.[^.]+$/, "") + ".mp4";
  return new File([buffer], newName, { type: "video/mp4" });
}

function pickMediaRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of [
    "video/mp4; codecs=avc1",
    "video/mp4",
    "video/webm; codecs=vp9",
    "video/webm",
  ]) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

const INTERRUPTED_MESSAGE =
  "Video conversion was interrupted — keep this tab open while converting.";

/** Thrown when the fallback recorder was interrupted (tab hidden / playback paused). */
class ConversionInterruptedError extends Error {}

async function transcodeWithMediaRecorder(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  const mimeType = pickMediaRecorderMime();
  if (!mimeType) {
    throw new Error("Your browser does not support video conversion. Please upload an MP4 file.");
  }

  onProgress?.("loading", 0);

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let watchdog: ReturnType<typeof setInterval> | undefined;
  let onVisibility: (() => void) | undefined;
  const stopRecorder = () => {
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch { /* already stopped */ }
    }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Video took too long to load.")), 30000);
      video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
      video.onerror = () => { clearTimeout(timeout); reject(new Error("Could not read this video file.")); };
    });

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Could not read video dimensions.");
    }

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const scale = Math.min(1, 1920 / Math.max(srcW, srcH));
    const outW = Math.round(srcW * scale) & ~1;
    const outH = Math.round(srcH * scale) & ~1;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(`Not enough memory to convert this video. ${SEND_TO_VIKTOR}`);
    }

    stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5_000_000,
    });
    recorder = rec;

    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
      rec.onstop = () => {
        const type = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
        resolve(new Blob(chunks, { type }));
      };
      rec.onerror = () => reject(new Error("Video conversion failed."));
    });
    // Avoid an unhandled rejection if we bail out before awaiting it.
    done.catch(() => {});

    rec.start(1000);
    onProgress?.("transcoding", 0);

    try {
      await withTimeout(video.play(), 30_000, "Video playback did not start.");
    } catch {
      throw new Error("Browser blocked video playback during conversion.");
    }

    const duration = video.duration;
    const hasDuration = !!duration && isFinite(duration);

    // The recording only contains frames we actually drew, so "finished" means
    // we drew up to (near) the end. A background tab pauses playback and/or
    // rAF, which previously resolved as success with a truncated video.
    let lastDrawnTime = 0;
    let lastTime = -1;
    let lastAdvanceAt = Date.now();
    await new Promise<void>((resolve, reject) => {
      let finished = false;
      const finish = (err?: Error) => {
        if (finished) return;
        finished = true;
        stopRecorder();
        if (err) reject(err);
        else resolve();
      };
      const reachedEnd = () => !hasDuration || lastDrawnTime >= duration * 0.95;

      onVisibility = () => {
        if (document.hidden) {
          video.pause();
          finish(new ConversionInterruptedError(INTERRUPTED_MESSAGE));
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      video.onended = () => {
        finish(reachedEnd() ? undefined : new ConversionInterruptedError(INTERRUPTED_MESSAGE));
      };
      video.onpause = () => {
        // "pause" also fires just before "ended"; only a pause short of the
        // end is an interruption.
        if (!video.ended) finish(new ConversionInterruptedError(INTERRUPTED_MESSAGE));
      };

      // Timer-based so a stall is caught even when rAF is throttled to zero.
      watchdog = setInterval(() => {
        if (Date.now() - lastAdvanceAt > STALL_TIMEOUT_MS) {
          finish(new Error(`Converting the video stalled. ${SEND_TO_VIKTOR}`));
        }
      }, 5_000);

      const drawFrame = () => {
        if (finished) return;
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          lastAdvanceAt = Date.now();
        }
        if (video.ended) {
          finish(reachedEnd() ? undefined : new ConversionInterruptedError(INTERRUPTED_MESSAGE));
          return;
        }
        if (video.paused) {
          finish(new ConversionInterruptedError(INTERRUPTED_MESSAGE));
          return;
        }
        try {
          ctx.drawImage(video, 0, 0, outW, outH);
        } catch {
          finish(new Error(`Converting the video failed. ${SEND_TO_VIKTOR}`));
          return;
        }
        lastDrawnTime = video.currentTime;
        if (hasDuration) {
          onProgress?.("transcoding", Math.min(video.currentTime / duration, 1));
        }
        requestAnimationFrame(drawFrame);
      };
      drawFrame();
    });

    const blob = await done;

    // A broken encoder can "finish" with a near-empty file (Safari 27.0.1 gave
    // 13 KB for a 2-minute clip). Real output is hundreds of KB per second, so
    // anything under ~20 KB/s is a failed recording, not a video worth uploading.
    if (blob.size < Math.max(50_000, (hasDuration ? duration : 0) * 20_000)) {
      throw new Error(`Converting the video failed. ${SEND_TO_VIKTOR}`);
    }

    const outExt = mimeType.startsWith("video/mp4") ? ".mp4" : ".webm";
    const outType = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
    const newName = file.name.replace(/\.[^.]+$/, "") + outExt;

    return new File([blob], newName, { type: outType });
  } finally {
    clearInterval(watchdog);
    if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
    stopRecorder();
    stream?.getTracks().forEach((t) => t.stop());
    video.onended = null;
    video.onpause = null;
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

function supportsWebCodecs(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoDecoder !== "undefined";
}

export async function transcodeVideoToMp4(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  if (supportsWebCodecs()) {
    try {
      return await transcodeWithWebCodecs(file, onProgress);
    } catch (webCodecsErr) {
      // WebCodecs couldn't handle this clip — most commonly iPhone HEVC on a
      // device without HEVC decode support. The MediaRecorder fallback plays
      // the clip through a <video> element, which uses the browser's native
      // decoder and often succeeds where WebCodecs can't. Only if that fails
      // too do we surface the original (friendlier, actionable) error.
      try {
        return await transcodeWithMediaRecorder(file, onProgress);
      } catch (fallbackErr) {
        // An interruption is actionable (keep the tab open), so surface it
        // rather than the WebCodecs error.
        if (fallbackErr instanceof ConversionInterruptedError) throw fallbackErr;
        throw webCodecsErr;
      }
    }
  }
  return transcodeWithMediaRecorder(file, onProgress);
}
