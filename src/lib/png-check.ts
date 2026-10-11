/**
 * PNG validation for user-supplied signature images. Server-only (node:zlib).
 *
 * pdf-lib's PNG decoder can spin forever — blocking the event loop — on a
 * truncated file (a chunk whose declared length runs past the end) AND on
 * well-framed chunks whose IDAT payload isn't valid zlib. So anything we hand
 * it from the public /apply action must first pass this check: correct
 * signature, chunk framing with matching CRCs, an IHDR of sane dimensions in
 * a format a canvas produces (8-bit, non-interlaced grey/RGB/grey+alpha/RGBA,
 * or palette with PLTE), IDAT data that actually inflates to exactly the
 * expected size with valid scanline filter bytes, and a terminating IEND.
 */
import { inflateSync } from "node:zlib";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// Signature pads are at most ~720×240 CSS px at DPR ≤ 3. A tiny but huge-
// dimension PNG (e.g. blank 4096×4096 ≈ a few KB) would otherwise make
// pdf-lib decode ~64 MB of pixels per request.
const MAX_WIDTH = 3000;
const MAX_HEIGHT = 1200;
const MAX_PIXELS = 3_000_000;

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array, start: number, end: number): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readU32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

// colour type → channels, for the 8-bit formats we accept.
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function isWellFormedPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8 + 12 + 13 + 12) return false;
  for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_MAGIC[i]) return false;

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  let sawPlte = false;
  const idat: Uint8Array[] = [];
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (length > 0x7fffffff || dataEnd + 4 > bytes.length) return false;
    const type = String.fromCharCode(bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3]);
    if (!/^[A-Za-z]{4}$/.test(type)) return false;
    if (readU32(bytes, dataEnd) !== crc32(bytes, typeStart, dataEnd)) return false;

    if (colorType === -1) {
      if (type !== "IHDR" || length !== 13) return false;
      width = readU32(bytes, dataStart);
      height = readU32(bytes, dataStart + 4);
      const bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      const compression = bytes[dataStart + 10];
      const filter = bytes[dataStart + 11];
      const interlace = bytes[dataStart + 12];
      if (width === 0 || height === 0 || width > MAX_WIDTH || height > MAX_HEIGHT || width * height > MAX_PIXELS) return false;
      if (bitDepth !== 8 || !(colorType in CHANNELS) || compression !== 0 || filter !== 0 || interlace !== 0) return false;
    } else if (type === "PLTE") {
      sawPlte = true;
    } else if (type === "IDAT") {
      idat.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      if (!idat.length || length !== 0 || dataEnd + 4 !== bytes.length) return false;
      if (colorType === 3 && !sawPlte) return false;
      return pixelDataIsValid(idat, width, height, CHANNELS[colorType]);
    }
    offset = dataEnd + 4;
  }
  return false;
}

/** Inflate the IDAT stream (capped — a zlib bomb can't exhaust memory) and
 * check it is exactly `height` scanlines, each a filter byte 0–4 followed by
 * `width × channels` bytes. */
function pixelDataIsValid(chunks: Uint8Array[], width: number, height: number, channels: number): boolean {
  const rowBytes = width * channels;
  const expected = height * (1 + rowBytes);
  let raw: Buffer;
  try {
    raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: expected + 1 });
  } catch {
    return false;
  }
  if (raw.length !== expected) return false;
  for (let row = 0; row < height; row++) {
    if (raw[row * (1 + rowBytes)] > 4) return false;
  }
  return true;
}
