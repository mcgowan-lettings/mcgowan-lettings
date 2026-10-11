"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SortableImageGrid from "../SortableImageGrid";
import VideoList from "../VideoList";
import { transcodeVideoToMp4, MAX_VIDEO_BYTES, assertUploadableVideo } from "@/lib/video-transcode";
import { useStorageUsage, formatBytes } from "@/lib/use-storage-usage";
import RichTextEditor from "@/components/RichTextEditor";
import { FormMessages, useRevealMessages } from "@/app/admin/form-feedback";
import { createProperty } from "@/app/actions/admin";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import {
  ACTION_THREW_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  STALE_UPLOAD_CHECK_MS,
  findMissingUploads,
  mapSettledWithConcurrency,
  parseWholeNumber,
  prepareEpcFile,
  safeExtension,
  storagePathsForUrl,
  uploadPropertyPhoto,
  UPLOAD_CACHE_CONTROL,
} from "../upload-helpers";

const AREAS = [
  "Bury",
  "Bolton",
  "Manchester",
  "Rochdale",
  "Rossendale",
  "Accrington",
  "Burnley",
];
const TYPES = [
  "Terraced",
  "End Terraced",
  "Semi Detached",
  "Detached",
  "Detached Bungalow",
  "Semi Detached Bungalow",
  "Apartment",
  "Penthouse",
  "Studio Apartment",
  "Town House",
  "Quasi Semi",
  "Barn Conversion",
  "House Share",
];
const STATUSES = ["To Let", "Let Agreed"];
const FURNISHED_OPTIONS = ["Unfurnished", "Furnished", "Part Furnished"];
const COUNCIL_TAX_BANDS = ["", "A", "B", "C", "D", "E", "F", "G", "H"];
// Studio is stored as 0 bedrooms; displayed as "Studio" across the public site.
const BEDROOM_OPTIONS = [
  { value: "0", label: "Studio" },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
];

const INITIAL_FORM = {
  title: "",
  description: "",
  price: "",
  location: "",
  area: "Bury",
  beds: "",
  baths: "",
  type: "Terraced",
  active: true,
  featured: false,
  is_new: false,
  status: "To Let",
  furnished: "Unfurnished",
  available_from: "",
  council_tax_band: "",
  epc_document: "",
  features: "",
};
type FormState = typeof INITIAL_FORM;

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingEpc, setUploadingEpc] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [epcError, setEpcError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const storage = useStorageUsage();
  const { ref: messagesRef, reveal: revealMessages } = useRevealMessages();
  // When the page was opened — every upload here is unsaved, so after ~20h
  // cleanupOrphans (24h grace) may already have reaped some of them.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  // Set once the property is created, so the unsaved-work guard is off
  // before router.push navigates away.
  const [created, setCreated] = useState(false);

  const dirty =
    imageUrls.length > 0 ||
    videoUrls.length > 0 ||
    (Object.keys(INITIAL_FORM) as (keyof FormState)[]).some((k) => form[k] !== INITIAL_FORM[k]);
  useUnsavedGuard(!created && (dirty || uploading || uploadingVideo || uploadingEpc || saving));

  const updateField = (
    field: string,
    value: string | boolean | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    // Process a few files at a time — compression is CPU-bound (Canvas
    // resize) and uploads are network-bound, so some overlap helps, but
    // decoding a 30-photo batch at once exhausts memory on iPads. Settled
    // semantics mean one bad file doesn't poison the rest of the batch.
    const results = await mapSettledWithConcurrency(
      Array.from(files),
      3,
      // Photo + its listing-card thumbnail; see uploadPropertyPhoto.
      uploadPropertyPhoto
    );

    const newUrls: string[] = [];
    const errors: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        newUrls.push(result.value);
      } else {
        errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }

    setImageUrls((prev) => [...prev, ...newUrls]);
    if (errors.length > 0) {
      setError(errors.length === 1 ? errors[0] : `${errors.length} images failed: ${errors[0]}`);
    }
    setUploading(false);

    // Reset the file input
    e.target.value = "";
  };

  /** Every file on this page is unsaved, so removing one deletes it from storage. */
  const deleteUploadedFile = async (url: string) => {
    // Photos take their thumbnail with them.
    const paths = storagePathsForUrl(url);
    if (!paths.length) return;
    try {
      await supabase.storage.from("property-images").remove(paths);
    } catch {
      // Harmless — cleanupOrphans reaps it after the 24h grace window.
    }
  };

  const removeImage = async (index: number) => {
    if (saving) return;
    // Capture the URL and drop it from state *before* the network delete, so
    // rapid clicks can't shift indexes and remove the wrong photo.
    const url = imageUrls[index];
    if (!url) return;
    setImageUrls((prev) => prev.filter((u) => u !== url));
    await deleteUploadedFile(url);
  };

  const uploadVideoFile = async (file: File, contentType: string): Promise<string | null> => {
    assertUploadableVideo(file);
    const ext = safeExtension(file, "mp4");
    const base = file.name.replace(/\.[^.]*$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "video";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}.${ext}`;
    const filePath = `properties/videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, file, { contentType, cacheControl: UPLOAD_CACHE_CONTROL });

    if (uploadError) {
      // Throw so the caller routes this into videoError — the general form
      // error renders at the top of the page, out of sight from the video box.
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);
    return publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingVideo(true);
    setVideoError("");

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        if (!file.type.startsWith("video/")) {
          throw new Error("File is not a video.");
        }
        if (file.size > MAX_VIDEO_BYTES) {
          throw new Error(
            `Video is too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Maximum is ${MAX_VIDEO_BYTES / 1024 / 1024 / 1024} GB. Try recording a shorter clip or in lower quality.`
          );
        }

        setVideoStatus(`Converting ${file.name}...`);
        setVideoProgress(0);

        const uploadFile = await transcodeVideoToMp4(file, (stage, ratio) => {
          if (stage === "loading") {
            setVideoStatus("Preparing video...");
          } else {
            setVideoStatus("Converting video...");
            setVideoProgress(Math.round(ratio * 100));
          }
        });

        setVideoStatus("Uploading...");
        setVideoProgress(100);

        const publicUrl = await uploadVideoFile(uploadFile, uploadFile.type);
        if (publicUrl) newUrls.push(publicUrl);
      } catch (err) {
        setVideoError(err instanceof Error ? err.message : "Failed to process video.");
      }
    }

    setVideoUrls((prev) => [...prev, ...newUrls]);
    setUploadingVideo(false);
    setVideoStatus("");
    setVideoProgress(0);
    e.target.value = "";
  };

  const removeVideo = async (index: number) => {
    if (saving) return;
    const url = videoUrls[index];
    if (!url) return;
    setVideoUrls((prev) => prev.filter((u) => u !== url));
    await deleteUploadedFile(url);
  };

  const removeEpc = async () => {
    if (saving) return;
    const url = form.epc_document;
    updateField("epc_document", "");
    setEpcError("");
    if (url) await deleteUploadedFile(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProperty();
    // The error renders at the top of this long form, far from the Save
    // button — bring it into view (no-op on success: we navigate away).
    revealMessages();
  };

  const saveProperty = async () => {
    setError("");

    const title = form.title.trim();
    const location = form.location.trim();
    if (!title || !form.price || !location || !form.beds || !form.baths) {
      setError("Please fill in all required fields.");
      return;
    }

    const price = parseWholeNumber(form.price);
    const beds = parseWholeNumber(form.beds);
    const baths = parseWholeNumber(form.baths);
    if (price === null || price <= 0) {
      setError("Price must be a whole number of pounds greater than 0 (e.g. 850).");
      return;
    }
    if (beds === null || baths === null) {
      setError("Bedrooms and bathrooms must be whole numbers (e.g. 2).");
      return;
    }

    const featuresArray = form.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    setSaving(true);
    let navigating = false;
    try {
      // Every upload on this page is unsaved; if it has been open long enough
      // for cleanupOrphans (24h grace) to reap some, catch it before saving
      // dead links.
      if (openedAt.current && Date.now() - openedAt.current > STALE_UPLOAD_CHECK_MS) {
        const missing = new Set(
          await findMissingUploads([
            ...imageUrls,
            ...videoUrls,
            ...(form.epc_document ? [form.epc_document] : []),
          ])
        );
        if (missing.size > 0) {
          setImageUrls((prev) => prev.filter((u) => !missing.has(u)));
          setVideoUrls((prev) => prev.filter((u) => !missing.has(u)));
          if (missing.has(form.epc_document)) updateField("epc_document", "");
          setError("Some photos uploaded more than a day ago were cleaned up — please re-upload them.");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(SESSION_EXPIRED_MESSAGE);
        return;
      }

      const result = await createProperty({
        title,
        description: form.description || null,
        price,
        location,
        area: form.area,
        beds,
        baths,
        type: form.type,
        active: form.active,
        featured: form.featured,
        is_new: form.is_new,
        images: imageUrls,
        videos: videoUrls,
        status: form.status,
        furnished: form.furnished,
        available_from: form.available_from || null,
        council_tax_band: form.council_tax_band || null,
        epc_document: form.epc_document || null,
        features: featuresArray.length > 0 ? featuresArray : null,
      }, session.access_token);

      if (!result.success) {
        setError(result.error);
        return;
      }

      navigating = true;
      setCreated(true);
      router.push("/admin/properties");
    } catch {
      // A thrown action (requireAdmin on an expired session, network drop,
      // deploy skew) must not leave the button stuck; form state is untouched.
      setError(ACTION_THREW_MESSAGE);
    } finally {
      // Stay "Saving..." while navigating away so it can't double-submit.
      if (!navigating) setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/properties"
          aria-label="Back to properties"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-text-muted transition-colors hover:bg-gray-200 hover:text-dark"
        >
          <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
            Add Property
          </h2>
          <p className="text-sm text-text-muted">Create a new property listing</p>
        </div>
      </div>

      <FormMessages ref={messagesRef} error={error} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Basic Information
          </h3>

          <div>
            <label htmlFor="property-title" className="mb-1.5 block text-sm font-medium text-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="property-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="e.g. 3 Bedroom Semi-Detached House"
            />
          </div>

          <div>
            <p id="property-description-label" className="mb-1.5 block text-sm font-medium text-dark">
              Description
            </p>
            <div role="group" aria-labelledby="property-description-label">
              <RichTextEditor
                labelledBy="property-description-label"
                rows={6}
                value={form.description}
                onChange={(v) => updateField("description", v)}
                placeholder="Describe the property..."
              />
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              Use the toolbar for <strong>bold</strong>, <em>italic</em> and links.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="property-price" className="mb-1.5 block text-sm font-medium text-dark">
                Price (per month) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  &pound;
                </span>
                <input
                  id="property-price"
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="850"
                />
              </div>
            </div>

            <div>
              <label htmlFor="property-type" className="mb-1.5 block text-sm font-medium text-dark">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                id="property-type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Location
          </h3>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="property-location" className="mb-1.5 block text-sm font-medium text-dark">
                Address / Location <span className="text-red-500">*</span>
              </label>
              <input
                id="property-location"
                type="text"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="e.g. Walmersley Road, Bury"
              />
            </div>

            <div>
              <label htmlFor="property-area" className="mb-1.5 block text-sm font-medium text-dark">
                Area <span className="text-red-500">*</span>
              </label>
              <input
                id="property-area"
                type="text"
                required
                list="area-suggestions"
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                onBlur={(e) => updateField("area", e.target.value.trim())}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
                placeholder="e.g. Bury"
              />
              <datalist id="area-suggestions">
                {AREAS.map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-text-muted">
                Pick from the list, or type a new area to add it.
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Details
          </h3>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="property-beds" className="mb-1.5 block text-sm font-medium text-dark">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <select
                id="property-beds"
                required
                value={form.beds}
                onChange={(e) => updateField("beds", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                <option value="" disabled>
                  Select…
                </option>
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="property-baths" className="mb-1.5 block text-sm font-medium text-dark">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <input
                id="property-baths"
                type="number"
                required
                min="0"
                value={form.baths}
                onChange={(e) => updateField("baths", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="property-status" className="mb-1.5 block text-sm font-medium text-dark">
                Status
              </label>
              <select
                id="property-status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="property-furnished" className="mb-1.5 block text-sm font-medium text-dark">
                Furnished
              </label>
              <select
                id="property-furnished"
                value={form.furnished}
                onChange={(e) => updateField("furnished", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {FURNISHED_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="property-available-from" className="mb-1.5 block text-sm font-medium text-dark">
                Available From
              </label>
              <input
                id="property-available-from"
                type="date"
                value={form.available_from}
                onChange={(e) => updateField("available_from", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label htmlFor="property-council-tax" className="mb-1.5 block text-sm font-medium text-dark">
                Council Tax Band
              </label>
              <select
                id="property-council-tax"
                value={form.council_tax_band}
                onChange={(e) => updateField("council_tax_band", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                <option value="">Not specified</option>
                {COUNCIL_TAX_BANDS.filter(Boolean).map((b) => (
                  <option key={b} value={b}>Band {b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-1.5 block text-sm font-medium text-dark">
              EPC Certificate
            </p>
            {form.epc_document ? (
              <div className="flex items-center gap-3">
                <a
                  href={form.epc_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-sm text-brand-dark font-medium hover:underline truncate"
                >
                  View uploaded EPC →
                </a>
                <button
                  type="button"
                  onClick={removeEpc}
                  disabled={saving}
                  aria-label="Remove EPC certificate"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 text-xs text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm text-text-muted">Upload EPC (PDF or image)</span>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
                    setEpcError("");
                    if (!allowed.includes(file.type)) {
                      setEpcError("EPC must be a PDF, JPG, PNG or WebP file.");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      setEpcError("EPC file is too large. Maximum is 10MB.");
                      e.target.value = "";
                      return;
                    }
                    setUploadingEpc(true);
                    try {
                      const uploadFile = await prepareEpcFile(file);
                      const fileExt = safeExtension(uploadFile, "pdf");
                      const fileName = `epc-${Date.now()}.${fileExt}`;
                      const filePath = `epc/${fileName}`;
                      const { error: upErr } = await supabase.storage
                        .from("property-images")
                        .upload(filePath, uploadFile, {
                          cacheControl: UPLOAD_CACHE_CONTROL,
                          contentType: uploadFile.type || file.type,
                        });
                      if (upErr) {
                        setEpcError(`Failed to upload EPC: ${upErr.message}`);
                        return;
                      }
                      const { data: { publicUrl } } = supabase.storage
                        .from("property-images")
                        .getPublicUrl(filePath);
                      updateField("epc_document", publicUrl);
                    } catch (err) {
                      setEpcError(err instanceof Error ? `Failed to upload EPC: ${err.message}` : "Failed to upload EPC.");
                    } finally {
                      setUploadingEpc(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            )}
            {uploadingEpc && (
              <p className="mt-1.5 text-xs text-text-muted">Uploading EPC...</p>
            )}
            {epcError && (
              <p className="mt-1.5 text-xs text-red-600">{epcError}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex min-h-[44px] items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
              />
              <span className="text-sm text-dark">Active (visible on site)</span>
            </label>

            <div>
              <label className="flex min-h-[44px] items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  aria-describedby="featured-hint"
                  className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
                />
                <span className="text-sm text-dark">Featured on homepage</span>
              </label>
              <p id="featured-hint" className="-mt-1.5 pl-[1.625rem] text-xs text-text-muted">
                Shows this listing on the home page.
              </p>
            </div>

            <label className="flex min-h-[44px] items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_new}
                onChange={(e) => updateField("is_new", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
              />
              <span className="text-sm text-dark">Show &ldquo;New Property&rdquo; badge</span>
            </label>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Key Features
          </h3>
          <div>
            <label htmlFor="property-features" className="mb-1.5 block text-sm font-medium text-dark">
              Features (one per line)
            </label>
            <textarea
              id="property-features"
              rows={5}
              value={form.features}
              onChange={(e) => updateField("features", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base sm:text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder={"Double glazed throughout\nGas central heating\nRear garden\nOff-street parking"}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Enter each feature on a new line. Leave blank to hide this section.
            </p>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Images
          </h3>

          {/* Uploaded images — drag to reorder */}
          <SortableImageGrid
            images={imageUrls}
            onReorder={setImageUrls}
            onRemove={removeImage}
            removeDisabled={saving}
          />

          {/* Storage warning */}
          {!storage.loading && storage.percentage >= 75 && (
            <div className={`rounded-lg px-3 py-2 text-xs ${
              storage.percentage >= 90
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {storage.percentage >= 90 ? (
                <>
                  <strong>Storage almost full</strong> ({formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}). Contact Viktor, or delete media from old listings before uploading more.
                </>
              ) : (
                <>
                  <strong>Storage {storage.percentage.toFixed(0)}% full</strong> ({formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}). Consider removing images from archived properties.
                </>
              )}
            </div>
          )}

          {/* Upload button */}
          <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-brand/5 ${
            !storage.loading && storage.percentage >= 95 ? "opacity-50 pointer-events-none" : ""
          }`}>
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-brand-dark">
                {uploading ? "Uploading..." : !storage.loading && storage.percentage >= 95 ? "Storage full — cannot upload" : "Tap or click to upload images"}
              </span>
              <p className="text-xs text-text-muted mt-1">
                JPG, PNG or WebP. First image will be the main photo.
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || (!storage.loading && storage.percentage >= 95)}
              className="hidden"
            />
          </label>
        </div>

        {/* Videos */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
              Virtual Tour Video
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Upload a short walkthrough video. Shown as a &ldquo;Virtual Tour&rdquo; button on the property page.
            </p>
          </div>

          <VideoList videos={videoUrls} onRemove={removeVideo} removeDisabled={saving} />

          {videoError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {videoError}
            </div>
          )}

          {uploadingVideo ? (
            <div className="rounded-lg border-2 border-dashed border-brand/50 bg-brand/5 px-6 py-8">
              <div className="flex items-center gap-3 mb-3">
                <svg className="h-5 w-5 animate-spin text-brand-dark" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-sm font-medium text-brand-dark">{videoStatus}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-brand transition-all duration-200"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                Don&rsquo;t close this tab — conversion runs in your browser.
              </p>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-brand-dark">Upload video</span>
                <p className="text-xs text-text-muted mt-1">
                  Straight from your iPhone is fine &mdash; MP4, MOV all accepted. Record in landscape for best results.
                </p>
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/properties"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading || uploadingVideo || uploadingEpc}
            className="min-h-[44px] rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Create Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
