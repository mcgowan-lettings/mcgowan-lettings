const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const QUALITY = 0.75;
const MAX_INPUT_BYTES = 50 * 1024 * 1024;
// A decode/encode that hasn't finished by now (e.g. iOS under memory pressure)
// is treated as failed so the upload batch can't hang forever.
const COMPRESS_TIMEOUT_MS = 30_000;

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heic-sequence" ||
    file.type === "image/heif" ||
    file.type === "image/heif-sequence" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

/** The file's image MIME type — from `file.type`, or its extension when the picker left it blank. */
function resolveType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return EXTENSION_TYPES[ext] ?? "";
}

function jpegName(name: string): string {
  return /\.\w+$/.test(name) ? name.replace(/\.\w+$/, ".jpg") : `${name || "image"}.jpg`;
}

export async function compressImage(file: File): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Maximum is ${MAX_INPUT_BYTES / 1024 / 1024}MB.`
    );
  }

  // HEIC/HEIF first — iPhones sometimes hand these over with a blank MIME
  // type, so the name check must run before the type check below.
  if (isHeic(file)) {
    throw new Error(
      "HEIC format is not supported. Please change your iPhone camera settings to \"Most Compatible\" (Settings → Camera → Formats), or select a JPG/PNG file."
    );
  }

  if (!SUPPORTED_TYPES.includes(resolveType(file))) {
    throw new Error(
      `${file.name || "This file"} isn't a supported image. Please choose a JPG, PNG or WebP file.`
    );
  }

  // Skip if already small (under 500KB)
  if (file.size < 500 * 1024) return file;

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    let canvas: HTMLCanvasElement | null = null;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      img.onload = null;
      img.onerror = null;
      // Release the backing store now rather than waiting for GC — iOS
      // Safari caps total canvas memory and big batches hit that cap.
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    };
    const succeed = (result: File) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const timer = setTimeout(
      () => fail(new Error(`Processing ${file.name} took too long. Try again, or upload fewer photos at once.`)),
      COMPRESS_TIMEOUT_MS
    );

    img.onload = () => {
      try {
        let { width, height } = img;

        // Scale down if exceeds max dimensions
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // getContext returns null when the browser can't allocate a canvas
        // (common on iPads under memory pressure).
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error(`Not enough memory to process ${file.name}. Try uploading fewer photos at once.`);
        }

        // JPEG has no alpha: paint white first so transparent PNG areas
        // don't come out black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Compression didn't help, use original
              succeed(file);
              return;
            }
            succeed(
              new File([blob], jpegName(file.name), {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          QUALITY
        );
      } catch (err) {
        fail(err instanceof Error ? err : new Error(`Could not process ${file.name}.`));
      }
    };
    img.onerror = () =>
      fail(new Error("Could not read image. It may be corrupted or in an unsupported format."));
    img.src = objectUrl;
  });
}
