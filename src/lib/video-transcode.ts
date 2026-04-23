"use client";

export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

export type TranscodeStage = "loading" | "transcoding";

async function transcodeWithWebCodecs(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  const {
    Input, Output, Conversion,
    BlobSource, BufferTarget,
    Mp4OutputFormat,
    ALL_FORMATS,
  } = await import("mediabunny");

  onProgress?.("loading", 0);

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
  const srcW = videoTrack?.displayWidth ?? 1920;
  const srcH = videoTrack?.displayHeight ?? 1080;
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

  onProgress?.("transcoding", 0);

  conversion.onProgress = (p) => {
    onProgress?.("transcoding", Math.min(p, 1));
  };

  await conversion.execute();

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

async function transcodeWithMediaRecorder(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  const mimeType = pickMediaRecorderMime();
  if (!mimeType) {
    throw new Error("Your browser does not support video conversion. Please upload an MP4 file.");
  }

  onProgress?.("loading", 0);

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = URL.createObjectURL(file);

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
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const type = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
      resolve(new Blob(chunks, { type }));
    };
    recorder.onerror = () => reject(new Error("Video conversion failed."));
  });

  recorder.start(1000);
  onProgress?.("transcoding", 0);

  try {
    await video.play();
  } catch {
    recorder.stop();
    throw new Error("Browser blocked video playback during conversion.");
  }

  const duration = video.duration;

  await new Promise<void>((resolve) => {
    video.onended = () => {
      recorder.stop();
      resolve();
    };
    const drawFrame = () => {
      if (video.ended || video.paused) {
        recorder.stop();
        resolve();
        return;
      }
      ctx.drawImage(video, 0, 0, outW, outH);
      if (duration && isFinite(duration)) {
        onProgress?.("transcoding", Math.min(video.currentTime / duration, 1));
      }
      requestAnimationFrame(drawFrame);
    };
    drawFrame();
  });

  const blob = await done;
  URL.revokeObjectURL(video.src);

  const outExt = mimeType.startsWith("video/mp4") ? ".mp4" : ".webm";
  const outType = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
  const newName = file.name.replace(/\.[^.]+$/, "") + outExt;

  return new File([blob], newName, { type: outType });
}

function supportsWebCodecs(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoDecoder !== "undefined";
}

export async function transcodeVideoToMp4(
  file: File,
  onProgress?: (stage: TranscodeStage, ratio: number) => void
): Promise<File> {
  if (supportsWebCodecs()) {
    return transcodeWithWebCodecs(file, onProgress);
  }
  return transcodeWithMediaRecorder(file, onProgress);
}
