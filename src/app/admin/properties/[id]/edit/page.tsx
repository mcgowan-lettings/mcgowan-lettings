"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { deleteProperty as deletePropertyAction } from "@/app/actions/admin";
import SortableImageGrid from "../../SortableImageGrid";
import { compressImage } from "@/lib/compress-image";
import { useStorageUsage, formatBytes } from "@/lib/use-storage-usage";

const AREAS = [
  "Bury",
  "Bolton",
  "Manchester",
  "Rossendale",
  "Accrington",
  "Burnley",
];
const TYPES = [
  "Terraced",
  "End Terraced",
  "Semi Detached",
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

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const storage = useStorageUsage();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    area: "Bury",
    beds: "",
    baths: "",
    type: "House",
    active: true,
    featured: false,
    status: "To Let",
    furnished: "Unfurnished",
    available_from: "",
    council_tax_band: "",
    epc_document: "",
    features: "",
  });

  const fetchProperty = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      setError("Property not found.");
      setLoading(false);
      return;
    }

    setForm({
      title: data.title,
      description: data.description ?? "",
      price: data.price.toString(),
      location: data.location,
      area: data.area,
      beds: data.beds.toString(),
      baths: data.baths.toString(),
      type: data.type,
      active: data.active,
      featured: data.featured,
      status: data.status ?? "To Let",
      furnished: data.furnished ?? "Unfurnished",
      available_from: data.available_from ?? "",
      council_tax_band: data.council_tax_band ?? "",
      epc_document: data.epc_document ?? "",
      features: (data.features ?? []).join("\n"),
    });
    setImageUrls(data.images ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

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

    const newUrls: string[] = [];

    for (const rawFile of Array.from(files)) {
      let file: File;
      try {
        file = await compressImage(rawFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process image.");
        continue;
      }
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath);

      newUrls.push(publicUrl);
    }

    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = async (index: number) => {
    const url = imageUrls[index];
    const path = url.split("/property-images/")[1];
    if (path) {
      await supabase.storage.from("property-images").remove([path]);
    }
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!form.title || !form.price || !form.location || !form.beds || !form.baths) {
      setError("Please fill in all required fields.");
      setSaving(false);
      return;
    }

    const featuresArray = form.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        title: form.title,
        description: form.description || null,
        price: parseInt(form.price),
        location: form.location,
        area: form.area,
        beds: parseInt(form.beds),
        baths: parseInt(form.baths),
        type: form.type,
        active: form.active,
        featured: form.featured,
        images: imageUrls,
        status: form.status,
        furnished: form.furnished,
        available_from: form.available_from || null,
        council_tax_band: form.council_tax_band || null,
        epc_document: form.epc_document || null,
        features: featuresArray.length > 0 ? featuresArray : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Property updated successfully.");
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    const result = await deletePropertyAction(id, imageUrls);

    if (!result.success) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/admin/properties");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-text-muted transition-colors hover:bg-gray-200 hover:text-dark"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
              Edit Property
            </h2>
            <p className="text-sm text-text-muted">{form.title || "Loading..."}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Basic Information
          </h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Price (per month) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  &pound;
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
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
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Address / Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Area <span className="text-red-500">*</span>
              </label>
              <select
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
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
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.beds}
                onChange={(e) => updateField("beds", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.baths}
                onChange={(e) => updateField("baths", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Furnished
              </label>
              <select
                value={form.furnished}
                onChange={(e) => updateField("furnished", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {FURNISHED_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Available From
              </label>
              <input
                type="date"
                value={form.available_from}
                onChange={(e) => updateField("available_from", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Council Tax Band
              </label>
              <select
                value={form.council_tax_band}
                onChange={(e) => updateField("council_tax_band", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                <option value="">Not specified</option>
                {COUNCIL_TAX_BANDS.filter(Boolean).map((b) => (
                  <option key={b} value={b}>Band {b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              EPC Certificate
            </label>
            {form.epc_document ? (
              <div className="flex items-center gap-3">
                <a
                  href={form.epc_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-dark font-medium hover:underline truncate"
                >
                  View uploaded EPC →
                </a>
                <button
                  type="button"
                  onClick={() => updateField("epc_document", "")}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
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
                    const fileExt = file.name.split(".").pop();
                    const fileName = `epc-${Date.now()}.${fileExt}`;
                    const filePath = `epc/${fileName}`;
                    const { error: upErr } = await supabase.storage
                      .from("property-images")
                      .upload(filePath, file);
                    if (upErr) {
                      setError(`Failed to upload EPC: ${upErr.message}`);
                      return;
                    }
                    const { data: { publicUrl } } = supabase.storage
                      .from("property-images")
                      .getPublicUrl(filePath);
                    updateField("epc_document", publicUrl);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
              />
              <span className="text-sm text-dark">Active (visible on site)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-brand"
              />
              <span className="text-sm text-dark">Featured on homepage</span>
            </label>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Key Features
          </h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Features (one per line)
            </label>
            <textarea
              rows={5}
              value={form.features}
              onChange={(e) => updateField("features", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              placeholder={"Double glazed throughout\nGas central heating\nRear garden\nOff-street parking"}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Enter each feature on a new line. Leave blank to auto-generate from property details.
            </p>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">
            Images
          </h3>

          {/* Existing images — drag to reorder */}
          <SortableImageGrid
            images={imageUrls}
            onReorder={setImageUrls}
            onRemove={removeImage}
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
                  <strong>Storage almost full</strong> ({formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}). Delete old images or upgrade your plan before uploading more.
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
                {uploading ? "Uploading..." : !storage.loading && storage.percentage >= 95 ? "Storage full — cannot upload" : "Click to upload more images"}
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

        {/* Submit buttons */}
        <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/properties"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-dark"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
