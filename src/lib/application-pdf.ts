/**
 * Builds the branded "Residential Rental Application" PDF that is emailed to
 * David (and the applicant) and downloadable from the admin inbox.
 *
 * Server-only: reads the logo from disk with `fs` and uses pdf-lib, so never
 * import this from a client component.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { DECLARATION_TEXT, type TenantApplicationRow } from "@/lib/application-types";
import { isWellFormedPng } from "@/lib/png-check";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 40;
const BOTTOM_LIMIT = MARGIN + FOOTER_H;

const BRAND = rgb(0.671, 0.827, 0);
const TEXT = rgb(0.102, 0.102, 0.102);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.85, 0.85, 0.83);
const LABEL_W = 100; // shared label column so single- and two-column rows align

const FOOTER_LINE =
  "McGowan Residential Lettings Ltd · PO Box 546, Bury, Lancashire BL8 9HB · t. 0161 797 6967 · " +
  "e. info@mcgowanlettings.co.uk · w. mcgowanlettings.co.uk · Company No. 7598462 · VAT No. 982 3545 94";

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * pdf-lib's StandardFonts only encode WinAnsi (roughly Latin-1). Replace
 * anything outside that range so `drawText` never throws on, say, an emoji
 * or a Cyrillic character in an address field.
 */
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "?");
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushWord = (word: string) => {
    // A single word longer than the line: hard-split by character.
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let chunk = "";
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = "";
        }
        chunk += ch;
      }
      if (chunk) current = chunk;
      return;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  };

  for (const word of words) pushWord(word);
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** Word-wraps text (respecting explicit newlines) to fit `maxWidth`. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  return text.split("\n").flatMap((line) => wrapLine(line, font, size, maxWidth));
}

// ---------------------------------------------------------------------------
// Date formatting (Europe/London)
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

function formatMoney(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  return /^[\d.,]+$/.test(trimmed) ? `£${trimmed}` : trimmed;
}

function formatRent(rent: string | null): string {
  if (!rent || !rent.trim()) return "—";
  const trimmed = rent.trim();
  return /^[\d.,]+$/.test(trimmed) ? `£${trimmed} pcm` : trimmed;
}

// ---------------------------------------------------------------------------
// Layout engine
// ---------------------------------------------------------------------------

class Layout {
  page: PDFPage;
  y = PAGE_H - MARGIN;

  private pageCount = 0;

  constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
    private logo: PDFImage | null,
    private continuationLabel = ""
  ) {
    this.page = this.newPage();
  }

  private newPage(): PDFPage {
    const page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.page = page;
    this.y = PAGE_H - MARGIN;
    this.drawFooter(page);
    this.pageCount += 1;
    // Pages after the first get a continuation line so they never look orphaned.
    if (this.pageCount > 1 && this.continuationLabel) {
      const size = 8.5;
      page.drawText(sanitize(this.continuationLabel), {
        x: MARGIN,
        y: this.y - 8,
        size,
        font: this.regular,
        color: MUTED,
      });
      this.y -= 20;
      page.drawLine({
        start: { x: MARGIN, y: this.y },
        end: { x: PAGE_W - MARGIN, y: this.y },
        thickness: 0.6,
        color: RULE,
      });
      this.y -= 26;
    }
    return page;
  }

  private drawFooter(page: PDFPage) {
    const size = 7;
    const lines = wrapText(sanitize(FOOTER_LINE), this.regular, size, CONTENT_W);
    let y = MARGIN + (lines.length - 1) * (size + 2);
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + lines.length * (size + 2) + 6 },
      end: { x: PAGE_W - MARGIN, y: MARGIN + lines.length * (size + 2) + 6 },
      thickness: 1,
      color: BRAND,
    });
    for (const line of lines) {
      const w = this.regular.widthOfTextAtSize(line, size);
      page.drawText(line, { x: (PAGE_W - w) / 2, y, size, font: this.regular, color: MUTED });
      y -= size + 2;
    }
  }

  /** Ensure `height` points of vertical room; starts a new page if not. */
  ensure(height: number) {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  space(h: number) {
    this.y -= h;
  }

  header(receivedLabel?: string) {
    const logoH = 34;
    if (this.logo) {
      const scale = logoH / this.logo.height;
      const w = this.logo.width * scale;
      this.page.drawImage(this.logo, { x: MARGIN, y: this.y - logoH, width: w, height: logoH });
    }
    if (receivedLabel) {
      const size = 8.5;
      const w = this.regular.widthOfTextAtSize(receivedLabel, size);
      this.page.drawText(receivedLabel, {
        x: PAGE_W - MARGIN - w,
        y: this.y - logoH + 4,
        size,
        font: this.regular,
        color: MUTED,
      });
    }
    this.y -= logoH + 20;

    this.page.drawText("Residential Rental Application", {
      x: MARGIN,
      y: this.y,
      size: 19,
      font: this.bold,
      color: TEXT,
    });
    this.y -= 12;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 2,
      color: BRAND,
    });
    this.y -= 14;
  }

  section(title: string) {
    this.ensure(70);
    this.space(9);
    this.page.drawText(sanitize(title).toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 8.5,
      font: this.bold,
      color: MUTED,
    });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 17;
  }

  /** Label/value row. Value wraps; label column fixed width. No rules — whitespace separates. */
  field(label: string, value: string | null | undefined) {
    const labelW = LABEL_W;
    const size = 10;
    const lineH = 13.5;
    const text = sanitize(value) || "\u2014";
    const lines = wrapText(text, this.regular, size, CONTENT_W - labelW);
    const rowH = lines.length * lineH + 11;
    this.ensure(rowH);

    this.page.drawText(sanitize(label), {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.bold,
      color: MUTED,
    });
    let y = this.y;
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN + labelW, y, size, font: this.regular, color: TEXT });
      y -= lineH;
    }
    this.y -= rowH;
  }

  /** One column of a paired row. Returns the height it needs. */
  private colHeight(value: string | null | undefined, valueW: number, size: number, lineH: number) {
    const text = sanitize(value) || "\u2014";
    return wrapText(text, this.regular, size, valueW).length * lineH;
  }

  private drawCol(x: number, label: string, value: string | null | undefined, labelW: number, valueW: number) {
    const size = 10;
    const lineH = 13.5;
    this.page.drawText(sanitize(label), { x, y: this.y, size: 9, font: this.bold, color: MUTED });
    let y = this.y;
    for (const line of wrapText(sanitize(value) || "\u2014", this.regular, size, valueW)) {
      this.page.drawText(line, { x: x + labelW, y, size, font: this.regular, color: TEXT });
      y -= lineH;
    }
  }

  /** Two label/value pairs side by side. Pass null for the right pair to leave it blank. */
  fieldPair(
    leftLabel: string,
    leftValue: string | null | undefined,
    rightLabel?: string,
    rightValue?: string | null | undefined
  ) {
    const labelW = LABEL_W;
    const colW = CONTENT_W / 2;
    const valueW = colW - labelW - 8;
    const lineH = 13.5;
    const h = Math.max(
      this.colHeight(leftValue, valueW, 10, lineH),
      rightLabel ? this.colHeight(rightValue, valueW, 10, lineH) : 0
    );
    const rowH = h + 11;
    this.ensure(rowH);
    this.drawCol(MARGIN, leftLabel, leftValue, labelW, valueW);
    if (rightLabel) {
      this.drawCol(MARGIN + colW + 6, rightLabel, rightValue, labelW, valueW);
    }
    this.y -= rowH;
  }

  paragraph(text: string, size = 9.5, color = TEXT) {
    const lineH = size * 1.45;
    const lines = wrapText(sanitize(text), this.regular, size, CONTENT_W);
    for (const line of lines) {
      this.ensure(lineH);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.regular, color });
      this.y -= lineH;
    }
  }

  /** Tick-box confirmation line — replaces the clumsy "Agreed | Yes" row. */
  confirmation(text: string, checked = true) {
    const size = 9.5;
    this.ensure(24);
    const boxY = this.y - 1.5;
    this.page.drawRectangle({
      x: MARGIN,
      y: boxY,
      width: 9.5,
      height: 9.5,
      borderColor: TEXT,
      borderWidth: 0.75,
    });
    if (checked) {
      this.page.drawLine({
        start: { x: MARGIN + 2, y: boxY + 5 },
        end: { x: MARGIN + 4, y: boxY + 2.4 },
        thickness: 1.1,
        color: TEXT,
      });
      this.page.drawLine({
        start: { x: MARGIN + 4, y: boxY + 2.4 },
        end: { x: MARGIN + 7.8, y: boxY + 7.4 },
        thickness: 1.1,
        color: TEXT,
      });
    }
    this.page.drawText(sanitize(text), {
      x: MARGIN + 18,
      y: this.y,
      size,
      font: this.regular,
      color: TEXT,
    });
    this.y -= 22;
  }

  /** Signature on the left, printed name + date on the right — one balanced block. */
  signatureBlock(image: PDFImage | null, printName: string, dateSigned: string) {
    const lineW = 225;
    const maxW = 205;
    const maxH = 46;
    const blockH = 74;
    this.ensure(blockH + 6);
    const top = this.y;

    // --- left: the signature itself, sitting on its baseline
    const baselineY = top - maxH - 6;
    if (image) {
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;
      this.page.drawImage(image, { x: MARGIN + 4, y: baselineY + 3, width: w, height: h });
    } else {
      this.page.drawText("(signature not captured)", {
        x: MARGIN + 4,
        y: baselineY + 14,
        size: 9,
        font: this.regular,
        color: MUTED,
      });
    }
    this.page.drawLine({
      start: { x: MARGIN, y: baselineY },
      end: { x: MARGIN + lineW, y: baselineY },
      thickness: 0.75,
      color: TEXT,
    });
    this.page.drawText("Signature of applicant", {
      x: MARGIN,
      y: baselineY - 11,
      size: 8,
      font: this.regular,
      color: MUTED,
    });

    // --- right: printed name and date, aligned to the same column grid as the rows above
    const colX = MARGIN + CONTENT_W / 2 + 6;
    const valueW = CONTENT_W / 2 - LABEL_W - 8;
    const pairs: [string, string][] = [
      ["Print name", printName],
      ["Date signed", dateSigned],
    ];
    let py = top - 6;
    for (const [label, value] of pairs) {
      this.page.drawText(sanitize(label), {
        x: colX,
        y: py,
        size: 9,
        font: this.bold,
        color: MUTED,
      });
      let vy = py;
      for (const line of wrapText(sanitize(value) || "\u2014", this.regular, 10, valueW)) {
        this.page.drawText(line, { x: colX + LABEL_W, y: vy, size: 10, font: this.regular, color: TEXT });
        vy -= 13.5;
      }
      py = vy - 8;
    }

    this.y = top - blockH;
  }

  officeUseBox() {
    const boxH = 48;
    this.ensure(boxH + 10);
    this.space(5);
    const top = this.y;
    this.page.drawRectangle({
      x: MARGIN,
      y: top - boxH,
      width: CONTENT_W,
      height: boxH,
      borderColor: RULE,
      borderWidth: 0.8,
    });
    this.page.drawText("OFFICE USE ONLY", {
      x: MARGIN + 14,
      y: top - 17,
      size: 7.5,
      font: this.bold,
      color: MUTED,
    });

    const items = ["Reference check", "Suitable", "Agreement confirmed"];
    const size = 9;
    const y = top - 36;
    let x = MARGIN + 14;
    for (const item of items) {
      this.page.drawRectangle({
        x,
        y: y - 2,
        width: 9.5,
        height: 9.5,
        borderColor: MUTED,
        borderWidth: 0.7,
      });
      this.page.drawText(item, { x: x + 15, y, size, font: this.regular, color: TEXT });
      x += 15 + this.regular.widthOfTextAtSize(item, size) + 34;
    }
    this.y = top - boxH - 8;
  }
}

// ---------------------------------------------------------------------------
// Asset loading
// ---------------------------------------------------------------------------

async function loadLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), "public", "mcgowan-logo.png"));
    return await doc.embedPng(bytes);
  } catch (err) {
    console.error("application-pdf: could not load logo:", err);
    return null;
  }
}

async function loadSignature(doc: PDFDocument, dataUrl: string): Promise<PDFImage | null> {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) return null;
    const meta = dataUrl.slice(0, comma);
    const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
    if (/image\/jpe?g/i.test(meta)) return await doc.embedJpg(bytes);
    // Guard: pdf-lib's PNG decoder can spin forever on a truncated chunk.
    if (!isWellFormedPng(new Uint8Array(bytes))) {
      console.error("application-pdf: signature PNG is malformed; skipping embed");
      return null;
    }
    return await doc.embedPng(bytes);
  } catch (err) {
    console.error("application-pdf: could not embed signature:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function buildApplicationPdf(app: TenantApplicationRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Rental Application - ${sanitize(app.full_name)}`);
  doc.setAuthor("McGowan Residential Lettings Ltd");
  doc.setCreationDate(new Date(app.created_at || Date.now()));

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(doc);
  const signature = await loadSignature(doc, app.signature_data_url);

  const L = new Layout(
    doc,
    regular,
    bold,
    logo,
    `Residential Rental Application \u2014 ${sanitize(app.full_name)}`
  );
  L.header(`Received ${formatDate(app.created_at)}`);

  L.section("Property");
  L.field("Property address", app.property_address);
  L.fieldPair("Rent", formatRent(app.rent_pcm));

  L.section("Personal Information");
  L.fieldPair("Full name", app.full_name, "Date of birth", formatDate(app.date_of_birth));
  L.fieldPair("Email", app.email, "Phone", app.phone);
  L.fieldPair("NI number", app.ni_number, "Period at address", app.period_at_address);
  L.field("Current address", app.current_address);

  L.section("Employment Details");
  L.fieldPair("Employment status", app.employment_status, "Monthly income", formatMoney(app.monthly_income));
  L.fieldPair("Employer", app.employer, "Job title", app.job_title);
  L.fieldPair(
    "Start date",
    app.employment_start_date ? formatDate(app.employment_start_date) : "\u2014"
  );

  L.section("Declaration");
  L.paragraph(DECLARATION_TEXT, 8.5);
  L.space(5);
  L.confirmation(
    app.declaration_agreed
      ? "The applicant has read and agreed to the declaration above."
      : "The applicant did NOT agree to the declaration.",
    app.declaration_agreed
  );

  L.section("Signature");
  L.signatureBlock(signature, app.signed_name, formatDateTime(app.signed_at));

  L.officeUseBox();

  // Page numbers, drawn once the total is known.
  const pages = doc.getPages();
  if (pages.length > 1) {
    pages.forEach((page, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      const size = 7.5;
      const w = regular.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: PAGE_W - MARGIN - w,
        y: PAGE_H - MARGIN - 8,
        size,
        font: regular,
        color: MUTED,
      });
    });
  }

  return doc.save();
}
