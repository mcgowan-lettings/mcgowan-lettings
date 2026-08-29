/**
 * Structural PNG validation for user-supplied signature images.
 *
 * pdf-lib's PNG decoder can spin forever on a truncated file (a chunk whose
 * declared length runs past the end of the buffer), so anything we hand it
 * from the public /apply action must first pass this check: correct
 * signature, well-formed chunk framing with matching CRCs, an IHDR of sane
 * dimensions, at least one IDAT and a terminating IEND.
 */

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_DIMENSION = 4096;

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

export function isWellFormedPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8 + 12 + 13 + 12) return false;
  for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_MAGIC[i]) return false;

  let offset = 8;
  let sawIhdr = false;
  let sawIdat = false;
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (length > 0x7fffffff || dataEnd + 4 > bytes.length) return false;
    const type = String.fromCharCode(bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3]);
    if (!/^[A-Za-z]{4}$/.test(type)) return false;
    if (readU32(bytes, dataEnd) !== crc32(bytes, typeStart, dataEnd)) return false;

    if (!sawIhdr) {
      if (type !== "IHDR" || length !== 13) return false;
      const width = readU32(bytes, dataStart);
      const height = readU32(bytes, dataStart + 4);
      if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) return false;
      sawIhdr = true;
    } else if (type === "IDAT") {
      sawIdat = true;
    } else if (type === "IEND") {
      return sawIdat && length === 0 && dataEnd + 4 === bytes.length;
    }
    offset = dataEnd + 4;
  }
  return false;
}
