"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { submitApplication } from "@/app/actions/apply";
import {
  DECLARATION_TEXT,
  EMPLOYMENT_STATUSES,
  type ApplicationFormData,
} from "@/lib/application-types";
import { ArrowRightIcon, CheckIcon } from "@/components/Icons";

/* ───────────────────────── HELPERS ───────────────────────── */

/** yyyy-mm-dd in local time (avoids the UTC-shift bug of toISOString). */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function maxDobDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return isoDate(d);
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const subscribeNoop = () => () => {};
let todayCache: { key: string; label: string } | null = null;
function getTodayLabel(): string {
  const now = new Date();
  const key = isoDate(now);
  if (!todayCache || todayCache.key !== key) {
    todayCache = { key, label: formatLongDate(now) };
  }
  return todayCache.label;
}
function getEmpty(): string {
  return "";
}
function getTodayIso(): string {
  return isoDate(new Date());
}

function needsEmployer(status: string): boolean {
  return status.startsWith("Employed") || status === "Self-employed";
}

const NI_REGEX = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]?$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ───────────────────────── SHARED CLASSES ───────────────────────── */

// 16px on mobile so iOS Safari doesn't auto-zoom the field; py-3 makes the
// control ≥ 48px tall for comfortable thumbs.
const inputBase =
  "w-full border rounded-md px-4 py-3 text-base sm:text-sm bg-white text-dark placeholder:text-text-light focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors";
const inputOk = `${inputBase} border-black/10`;
const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-200`;

const labelClass =
  "block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider";

/* ───────────────────────── FORM STATE ───────────────────────── */

type Fields = {
  property_address: string;
  rent_pcm: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  ni_number: string;
  current_address: string;
  period_at_address: string;
  employment_status: string;
  employer: string;
  job_title: string;
  employment_start_date: string;
  monthly_income: string;
  declaration_agreed: boolean;
  signed_name: string;
  website: string;
};

type FieldKey = keyof Fields;
type ErrorKey = FieldKey | "signature";
type Errors = Partial<Record<ErrorKey, string>>;

/* ───────────────────────── SMALL COMPONENTS ───────────────────────── */

function Section({
  step,
  title,
  intro,
  children,
}: {
  step: number;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`apply-step-${step}`}
      className="bg-white rounded-lg border border-black/5 shadow-sm p-5 sm:p-8 md:p-10"
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          aria-hidden="true"
          className="w-9 h-9 shrink-0 rounded-full bg-brand/10 text-brand-deep font-semibold text-sm flex items-center justify-center"
        >
          {step}
        </div>
        <div className="min-w-0">
          <p className="text-brand text-xs font-semibold tracking-[0.15em] uppercase mb-1">
            Step {step} of 5
          </p>
          <h2
            id={`apply-step-${step}`}
            className="font-heading text-2xl md:text-3xl font-semibold text-dark leading-tight"
          >
            {title}
          </h2>
          {intro && (
            <p className="text-text-muted text-sm leading-relaxed mt-2">{intro}</p>
          )}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-red-600 text-sm mt-1.5">
      {message}
    </p>
  );
}

function Optional() {
  return (
    <span className="text-text-light font-normal normal-case"> (optional)</span>
  );
}

/* ───────────────────────── SIGNATURE PAD ───────────────────────── */

type Point = { x: number; y: number };

function SignaturePad({
  onChange,
  hasError,
}: {
  onChange: (hasInk: boolean) => void;
  hasError: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // All strokes in CSS-pixel space so we can re-draw after a resize/DPR change.
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, pts: Point[]) => {
    if (pts.length === 0) return;
    ctx.beginPath();
    if (pts.length === 1) {
      // A tap — draw a dot.
      ctx.arc(pts[0].x, pts[0].y, 1.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      // Quadratic curve through midpoints keeps the line smooth.
      const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }, []);

  const setupContext = useCallback((ctx: CanvasRenderingContext2D, dpr: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.fillStyle = "#1a1a1a";
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setupContext(ctx, dpr);
    ctx.clearRect(0, 0, w, h);
    for (const s of strokesRef.current) drawStroke(ctx, s);
  }, [drawStroke, setupContext]);

  useEffect(() => {
    redraw();
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", redraw);
      return () => window.removeEventListener("resize", redraw);
    }
    const ro = new ResizeObserver(() => redraw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  const pointFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const canvas = e.currentTarget;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* older Safari may throw — capture is a nicety, not required */
    }
    const p = pointFromEvent(e);
    drawingRef.current = true;
    lastRef.current = p;
    strokesRef.current.push([p]);
    const ctx = canvas.getContext("2d");
    if (ctx) drawStroke(ctx, [p]);
    if (!hasInk) {
      setHasInk(true);
      onChange(true);
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    const last = lastRef.current;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    if (!stroke || !last) return;
    // Skip micro-jitter so the curve stays clean.
    if (Math.abs(p.x - last.x) < 0.5 && Math.abs(p.y - last.y) < 0.5) return;
    stroke.push(p);
    const ctx = e.currentTarget.getContext("2d");
    if (ctx) {
      // Incremental segment: midpoint smoothing between the last two points.
      const prev = stroke.length >= 3 ? stroke[stroke.length - 3] : null;
      ctx.beginPath();
      if (prev) {
        const m1 = { x: (prev.x + last.x) / 2, y: (prev.y + last.y) / 2 };
        const m2 = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
        ctx.moveTo(m1.x, m1.y);
        ctx.quadraticCurveTo(last.x, last.y, m2.x, m2.y);
      } else {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    lastRef.current = p;
  };

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // Finalise: redraw so the tail of the stroke is fully smoothed.
    redraw();
  };

  const clear = () => {
    strokesRef.current = [];
    setHasInk(false);
    onChange(false);
    redraw();
  };

  return (
    <div>
      <div
        ref={wrapRef}
        className={`relative w-full h-[180px] sm:h-[200px] rounded-md border-2 bg-white overflow-hidden ${
          hasError ? "border-red-500" : "border-dashed border-black/15"
        }`}
      >
        <canvas
          ref={canvasRef}
          id="signature-pad"
          data-signature-pad="true"
          role="img"
          aria-label="Signature pad — draw your signature with your finger or mouse"
          className="absolute inset-0 block cursor-crosshair select-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          onContextMenu={(e) => e.preventDefault()}
        />
        {!hasInk && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-text-light"
          >
            <span className="font-heading italic text-2xl opacity-60">Sign here</span>
            <span className="text-xs mt-1 opacity-70">
              Use your finger or mouse
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 right-6 bottom-8 border-b border-black/10"
        />
      </div>
      <div className="flex items-center justify-between gap-4 mt-2">
        <p className="text-text-light text-xs">
          Draw your signature inside the box.
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk}
          className="min-h-[44px] px-4 text-sm font-medium text-brand-deep hover:text-brand-dark underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── MAIN FORM ───────────────────────── */

export default function ApplyForm({
  initialProperty = "",
  initialRent = "",
}: {
  initialProperty?: string;
  initialRent?: string;
}) {
  const [fields, setFields] = useState<Fields>({
    property_address: initialProperty,
    rent_pcm: initialRent,
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    ni_number: "",
    current_address: "",
    period_at_address: "",
    employment_status: "",
    employer: "",
    job_title: "",
    employment_start_date: "",
    monthly_income: "",
    declaration_agreed: false,
    signed_name: "",
    website: "",
  });
  const [signedNameTouched, setSignedNameTouched] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Today's date is rendered client-side only (server snapshot is empty) so
  // SSR/hydration can't disagree across time zones.
  const today = useSyncExternalStore(subscribeNoop, getTodayLabel, getEmpty);
  // Client-only so SSR (UTC) and the browser's local clock can't disagree and cause a hydration mismatch
  const maxDob = useSyncExternalStore(subscribeNoop, maxDobDate, getEmpty);
  const todayIso = useSyncExternalStore(subscribeNoop, getTodayIso, getEmpty);

  const set =
    (key: FieldKey) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setFields((prev) => {
        const next = { ...prev, [key]: value } as Fields;
        // Keep "Print name" in sync with full name until the user edits it.
        if (key === "full_name" && !signedNameTouched) {
          next.signed_name = String(value);
        }
        return next;
      });
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

  const showEmployer = needsEmployer(fields.employment_status);

  function validate(): Errors {
    const e: Errors = {};
    const req = (key: FieldKey, msg: string) => {
      const v = fields[key];
      if (typeof v === "string" ? v.trim() === "" : !v) e[key] = msg;
    };

    req("property_address", "Please enter the property address.");
    req("full_name", "Please enter your full name.");
    req("email", "Please enter your email address.");
    if (fields.email && !EMAIL_REGEX.test(fields.email.trim())) {
      e.email = "That email address doesn't look right.";
    }
    req("phone", "Please enter your phone number.");
    if (fields.phone && fields.phone.replace(/\D/g, "").length < 10) {
      e.phone = "Please enter a valid phone number.";
    }
    req("date_of_birth", "Please enter your date of birth.");
    if (fields.date_of_birth && fields.date_of_birth > maxDobDate()) {
      e.date_of_birth = "Applicants must be 18 or over.";
    }
    req("ni_number", "Please enter your National Insurance number.");
    if (fields.ni_number && !NI_REGEX.test(fields.ni_number.replace(/\s+/g, ""))) {
      e.ni_number = "Please enter a valid NI number, e.g. QQ 12 34 56 C.";
    }
    req("current_address", "Please enter your current address.");
    req("period_at_address", "Please tell us how long you've lived there.");
    req("employment_status", "Please select your employment status.");
    if (showEmployer) {
      req("employer", fields.employment_status === "Self-employed" ? "Please enter your business name." : "Please enter your employer.");
      req("job_title", "Please enter your job title.");
      req("employment_start_date", "Please enter your start date.");
    }
    req("monthly_income", "Please enter your monthly income.");
    if (fields.monthly_income && !/^\s*£?\s*[\d,]+(\.\d{1,2})?\s*$/.test(fields.monthly_income)) {
      e.monthly_income = "Please enter a number, e.g. 2400.";
    }
    if (!fields.declaration_agreed) {
      e.declaration_agreed = "You need to agree to the declaration to continue.";
    }
    if (!hasSignature) e.signature = "Please sign in the box above.";
    req("signed_name", "Please print your name.");
    return e;
  }

  function scrollToFirstError(errs: Errors) {
    const order: ErrorKey[] = [
      "property_address",
      "full_name",
      "email",
      "phone",
      "date_of_birth",
      "ni_number",
      "current_address",
      "period_at_address",
      "employment_status",
      "employer",
      "job_title",
      "employment_start_date",
      "monthly_income",
      "declaration_agreed",
      "signature",
      "signed_name",
    ];
    const firstKey = order.find((k) => errs[k]);
    if (!firstKey) return;
    const id = firstKey === "signature" ? "signature-pad" : `apply-${firstKey}`;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    if (firstKey !== "signature" && "focus" in el) {
      // Focus after the scroll settles so the browser doesn't fight it.
      window.setTimeout(() => (el as HTMLElement).focus({ preventScroll: true }), reduce ? 0 : 350);
    }
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      scrollToFirstError(errs);
      return;
    }

    const canvas = formRef.current?.querySelector<HTMLCanvasElement>(
      'canvas[data-signature-pad="true"]'
    );
    let signature_data_url = "";
    try {
      signature_data_url = canvas ? canvas.toDataURL("image/png") : "";
    } catch {
      signature_data_url = "";
    }
    if (!signature_data_url) {
      setErrors({ signature: "We couldn't capture your signature — please try again." });
      scrollToFirstError({ signature: "x" });
      return;
    }

    setSubmitting(true);

    const payload: ApplicationFormData = {
      property_address: fields.property_address.trim(),
      rent_pcm: fields.rent_pcm.trim() || undefined,
      full_name: fields.full_name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      date_of_birth: fields.date_of_birth,
      ni_number: fields.ni_number.replace(/\s+/g, "").toUpperCase(),
      current_address: fields.current_address.trim(),
      period_at_address: fields.period_at_address.trim(),
      employment_status: fields.employment_status,
      employer: showEmployer ? fields.employer.trim() : undefined,
      job_title: showEmployer ? fields.job_title.trim() : undefined,
      employment_start_date: showEmployer ? fields.employment_start_date.trim() : undefined,
      monthly_income: fields.monthly_income.replace(/[£,\s]/g, ""),
      declaration_agreed: fields.declaration_agreed,
      signature_data_url,
      signed_name: fields.signed_name.trim(),
      website: fields.website,
    };

    try {
      const result = await submitApplication(payload);
      if (result.success) {
        setSubmitted(true);
        const reduce =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        setServerError(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError(
        "We couldn't send your application. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success panel ── */
  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-8 md:p-12 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
          <CheckIcon className="w-8 h-8 text-brand" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-dark mb-3">
          Application sent
        </h2>
        <p className="text-text-muted leading-relaxed max-w-md mx-auto mb-2">
          Thank you, {fields.full_name.trim().split(" ")[0] || "there"}. David
          will be in touch shortly.
        </p>
        <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
          A copy of your signed application has been emailed to{" "}
          <span className="text-dark font-medium">{fields.email.trim()}</span>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] gap-2 bg-brand text-dark font-semibold px-8 py-3 rounded-sm hover:bg-brand-light transition-colors"
        >
          Back to the homepage
          <ArrowRightIcon className="w-4 h-4 shrink-0" />
        </Link>
      </div>
    );
  }

  const cls = (key: ErrorKey) => (errors[key] ? inputErr : inputOk);
  const aria = (key: ErrorKey) =>
    errors[key]
      ? { "aria-invalid": true as const, "aria-describedby": `apply-${key}-error` }
      : {};

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6 md:space-y-8">
      {/* Honeypot — bots fill it, humans never see it (CLAUDE.md rule 6). */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="apply_website">Website</label>
        <input
          type="text"
          id="apply_website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={set("website")}
        />
      </div>

      {/* ── 1. Property ── */}
      <Section
        step={1}
        title="The property"
        intro="The home you're applying for. We've filled this in if David sent you a link."
      >
        <div>
          <label htmlFor="apply-property_address" className={labelClass}>
            Property address *
          </label>
          <input
            type="text"
            id="apply-property_address"
            name="property_address"
            autoComplete="off"
            value={fields.property_address}
            onChange={set("property_address")}
            className={cls("property_address")}
            placeholder="e.g. 12 Example Street, Bury, BL9 0AA"
            {...aria("property_address")}
          />
          <FieldError id="apply-property_address-error" message={errors.property_address} />
        </div>
        <div className="sm:max-w-xs">
          <label htmlFor="apply-rent_pcm" className={labelClass}>
            Rent per month
            <Optional />
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-base sm:text-sm"
            >
              £
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="apply-rent_pcm"
              name="rent_pcm"
              value={fields.rent_pcm}
              onChange={set("rent_pcm")}
              className={`${cls("rent_pcm")} pl-8`}
              placeholder="950"
            />
          </div>
        </div>
      </Section>

      {/* ── 2. About you ── */}
      <Section step={2} title="About you" intro="Your contact details and where you live now.">
        <div>
          <label htmlFor="apply-full_name" className={labelClass}>
            Full name *
          </label>
          <input
            type="text"
            id="apply-full_name"
            name="full_name"
            autoComplete="name"
            value={fields.full_name}
            onChange={set("full_name")}
            className={cls("full_name")}
            placeholder="Your full legal name"
            {...aria("full_name")}
          />
          <FieldError id="apply-full_name-error" message={errors.full_name} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="apply-email" className={labelClass}>
              Email *
            </label>
            <input
              type="email"
              id="apply-email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={fields.email}
              onChange={set("email")}
              className={cls("email")}
              placeholder="you@example.com"
              {...aria("email")}
            />
            <FieldError id="apply-email-error" message={errors.email} />
          </div>
          <div>
            <label htmlFor="apply-phone" className={labelClass}>
              Phone *
            </label>
            <input
              type="tel"
              id="apply-phone"
              name="phone"
              autoComplete="tel"
              value={fields.phone}
              onChange={set("phone")}
              className={cls("phone")}
              placeholder="07123 456789"
              {...aria("phone")}
            />
            <FieldError id="apply-phone-error" message={errors.phone} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="apply-date_of_birth" className={labelClass}>
              Date of birth *
            </label>
            <input
              type="date"
              id="apply-date_of_birth"
              name="date_of_birth"
              autoComplete="bday"
              max={maxDob || undefined}
              value={fields.date_of_birth}
              onChange={set("date_of_birth")}
              className={`${cls("date_of_birth")} min-h-[48px] appearance-none`}
              {...aria("date_of_birth")}
            />
            <FieldError id="apply-date_of_birth-error" message={errors.date_of_birth} />
          </div>
          <div>
            <label htmlFor="apply-ni_number" className={labelClass}>
              National Insurance number *
            </label>
            <input
              type="text"
              id="apply-ni_number"
              name="ni_number"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={13}
              value={fields.ni_number}
              onChange={set("ni_number")}
              className={`${cls("ni_number")} uppercase tracking-wide`}
              placeholder="QQ 12 34 56 C"
              {...aria("ni_number")}
            />
            <FieldError id="apply-ni_number-error" message={errors.ni_number} />
          </div>
        </div>

        <div>
          <label htmlFor="apply-current_address" className={labelClass}>
            Current address *
          </label>
          <textarea
            id="apply-current_address"
            name="current_address"
            rows={3}
            autoComplete="street-address"
            value={fields.current_address}
            onChange={set("current_address")}
            className={`${cls("current_address")} resize-none`}
            placeholder="House number, street, town and postcode"
            {...aria("current_address")}
          />
          <FieldError id="apply-current_address-error" message={errors.current_address} />
        </div>

        <div className="sm:max-w-xs">
          <label htmlFor="apply-period_at_address" className={labelClass}>
            Time at this address *
          </label>
          <input
            type="text"
            id="apply-period_at_address"
            name="period_at_address"
            value={fields.period_at_address}
            onChange={set("period_at_address")}
            className={cls("period_at_address")}
            placeholder='e.g. "3 years 2 months"'
            {...aria("period_at_address")}
          />
          <FieldError id="apply-period_at_address-error" message={errors.period_at_address} />
        </div>
      </Section>

      {/* ── 3. Employment ── */}
      <Section step={3} title="Employment" intro="This helps David confirm the tenancy is affordable.">
        <div>
          <label htmlFor="apply-employment_status" className={labelClass}>
            Employment status *
          </label>
          <div className="relative">
            <select
              id="apply-employment_status"
              name="employment_status"
              value={fields.employment_status}
              onChange={set("employment_status")}
              className={`${cls("employment_status")} appearance-none pr-10`}
              {...aria("employment_status")}
            >
              <option value="" disabled>
                Select your status
              </option>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </div>
          <FieldError id="apply-employment_status-error" message={errors.employment_status} />
        </div>

        {showEmployer && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label htmlFor="apply-employer" className={labelClass}>
                {fields.employment_status === "Self-employed" ? "Business name *" : "Employer *"}
              </label>
              <input
                type="text"
                id="apply-employer"
                name="employer"
                autoComplete="organization"
                value={fields.employer}
                onChange={set("employer")}
                className={cls("employer")}
                placeholder={
                  fields.employment_status === "Self-employed"
                    ? "Your trading name"
                    : "Company you work for"
                }
                {...aria("employer")}
              />
              <FieldError id="apply-employer-error" message={errors.employer} />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="apply-job_title" className={labelClass}>
                  Job title *
                </label>
                <input
                  type="text"
                  id="apply-job_title"
                  name="job_title"
                  autoComplete="organization-title"
                  value={fields.job_title}
                  onChange={set("job_title")}
                  className={cls("job_title")}
                  placeholder="e.g. Nurse"
                  {...aria("job_title")}
                />
                <FieldError id="apply-job_title-error" message={errors.job_title} />
              </div>
              <div>
                <label htmlFor="apply-employment_start_date" className={labelClass}>
                  Start date *
                </label>
                <input
                  type="date"
                  id="apply-employment_start_date"
                  name="employment_start_date"
                  autoComplete="off"
                  max={todayIso || undefined}
                  value={fields.employment_start_date}
                  onChange={set("employment_start_date")}
                  className={`${cls("employment_start_date")} min-h-[48px] appearance-none`}
                  {...aria("employment_start_date")}
                />
                <FieldError
                  id="apply-employment_start_date-error"
                  message={errors.employment_start_date}
                />
              </div>
            </div>
          </div>
        )}

        <div className="sm:max-w-xs">
          <label htmlFor="apply-monthly_income" className={labelClass}>
            Monthly income *
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-base sm:text-sm"
            >
              £
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="apply-monthly_income"
              name="monthly_income"
              value={fields.monthly_income}
              onChange={set("monthly_income")}
              className={`${cls("monthly_income")} pl-8`}
              placeholder="2400"
              {...aria("monthly_income")}
            />
          </div>
          <p className="text-text-light text-xs mt-1.5">
            Take-home pay per month, before rent. Include benefits or pension if relevant.
          </p>
          <FieldError id="apply-monthly_income-error" message={errors.monthly_income} />
        </div>
      </Section>

      {/* ── 4. Declaration ── */}
      <Section step={4} title="Declaration" intro="Please read this carefully before signing.">
        <div
          className={`rounded-md border p-5 sm:p-6 bg-cream ${
            errors.declaration_agreed ? "border-red-500" : "border-black/10"
          }`}
        >
          <p className="text-dark text-sm leading-relaxed">{DECLARATION_TEXT}</p>
        </div>
        <label
          htmlFor="apply-declaration_agreed"
          className="flex items-start gap-3 cursor-pointer min-h-[44px] py-1"
        >
          <input
            type="checkbox"
            id="apply-declaration_agreed"
            name="declaration_agreed"
            checked={fields.declaration_agreed}
            onChange={set("declaration_agreed")}
            className="mt-0.5 w-5 h-5 shrink-0 rounded border-black/20 accent-[#abd300] cursor-pointer"
            {...aria("declaration_agreed")}
          />
          <span className="text-dark text-sm leading-relaxed">
            I have read and agree to the declaration above. *
          </span>
        </label>
        <FieldError id="apply-declaration_agreed-error" message={errors.declaration_agreed} />
      </Section>

      {/* ── 5. Signature ── */}
      <Section step={5} title="Your signature" intro="Sign below to confirm your application.">
        <div>
          <span className={labelClass}>Signature *</span>
          <SignaturePad
            hasError={Boolean(errors.signature)}
            onChange={(ink) => {
              setHasSignature(ink);
              if (ink && errors.signature) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.signature;
                  return next;
                });
              }
            }}
          />
          <FieldError id="apply-signature-error" message={errors.signature} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="apply-signed_name" className={labelClass}>
              Print name *
            </label>
            <input
              type="text"
              id="apply-signed_name"
              name="signed_name"
              autoComplete="name"
              value={fields.signed_name}
              onChange={(e) => {
                setSignedNameTouched(true);
                set("signed_name")(e);
              }}
              className={cls("signed_name")}
              placeholder="Your name as signed"
              {...aria("signed_name")}
            />
            <FieldError id="apply-signed_name-error" message={errors.signed_name} />
          </div>
          <div>
            <span className={labelClass}>Date</span>
            <div
              className="w-full border border-black/10 rounded-md px-4 py-3 text-base sm:text-sm bg-warm-grey text-dark min-h-[48px] flex items-center"
              aria-live="polite"
            >
              {today || " "}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5 sm:p-8 md:p-10">
        {serverError && (
          <p role="alert" className="text-red-600 text-sm mb-4">
            {serverError}
          </p>
        )}
        {Object.keys(errors).length > 0 && !serverError && (
          <p role="alert" className="text-red-600 text-sm mb-4">
            Please check the highlighted fields above.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="group w-full sm:w-auto inline-flex items-center justify-center min-h-[52px] gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Sending your application&hellip;
            </>
          ) : (
            <>
              Submit application
              <ArrowRightIcon className="w-4 h-4 shrink-0 translate-y-px transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <p className="text-text-muted text-xs leading-relaxed mt-5">
          Your details are used only to assess this tenancy application and are
          handled in line with our{" "}
          <Link href="/privacy" className="text-brand-deep underline underline-offset-2 hover:text-brand-dark">
            privacy policy
          </Link>
          . A signed copy is emailed to you and to McGowan Residential Lettings.
        </p>
      </div>
    </form>
  );
}
