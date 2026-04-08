"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Property {
  id: string;
  title: string;
  location: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  type: string;
  active: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchProperties = useCallback(async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage({ text: "Failed to load properties.", type: "error" });
    } else {
      setProperties(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    const { error } = await supabase
      .from("properties")
      .update({ active: !currentActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage({ text: "Failed to update property.", type: "error" });
    } else {
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
      );
    }
    setToggling(null);
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const { error } = await supabase
      .from("properties")
      .update({
        featured: !currentFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage({ text: "Failed to update featured status.", type: "error" });
    } else {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, featured: !currentFeatured } : p
        )
      );
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dark font-[family-name:var(--font-playfair)]">
            Properties
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {properties.length} properties total &middot;{" "}
            {properties.filter((p) => p.active).length} active &middot;{" "}
            {properties.filter((p) => p.featured).length} featured
          </p>
          <p className="text-xs text-text-muted mt-1">
            The homepage shows 3 or 6 featured properties — mark exactly 3 or 6 to fill the grid evenly.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-brand-light"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Property
        </Link>
      </div>

      {/* Notification */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Properties list */}
      {properties.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-text-muted">No properties yet.</p>
          <Link
            href="/admin/properties/new"
            className="mt-3 inline-block text-sm font-medium text-brand-dark hover:underline"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">Property</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Area</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Price</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Beds</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">Active</th>
                  <th className="px-4 py-3 font-medium text-text-muted text-center">Featured</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => (
                  <tr
                    key={property.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      !property.active ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {property.images?.[0] ? (
                            <Image
                              src={property.images[0]}
                              alt={property.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-dark">
                            {property.title}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {property.type} &middot; {property.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {property.area}
                    </td>
                    <td className="px-4 py-3 font-medium text-dark">
                      &pound;{property.price.toLocaleString()}/mo
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {property.beds}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          toggleActive(property.id, property.active)
                        }
                        disabled={toggling === property.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          property.active ? "bg-brand" : "bg-gray-300"
                        } ${toggling === property.id ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            property.active
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          toggleFeatured(property.id, property.featured)
                        }
                        className={`transition-colors ${
                          property.featured
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        }`}
                        title={
                          property.featured
                            ? "Remove from featured"
                            : "Mark as featured"
                        }
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill={property.featured ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/properties/${property.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-dark transition-colors hover:bg-gray-200"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {properties.map((property) => (
              <div
                key={property.id}
                className={`p-4 ${!property.active ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {property.images?.[0] ? (
                      <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-dark text-sm">
                      {property.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {property.area} &middot; {property.beds} bed &middot;{" "}
                      &pound;{property.price.toLocaleString()}/mo
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        onClick={() =>
                          toggleActive(property.id, property.active)
                        }
                        disabled={toggling === property.id}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            property.active ? "bg-brand" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              property.active
                                ? "translate-x-4.5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </span>
                        <span className="text-text-muted">
                          {property.active ? "Active" : "Inactive"}
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          toggleFeatured(property.id, property.featured)
                        }
                        className={`flex items-center gap-1 text-xs ${
                          property.featured
                            ? "text-amber-500"
                            : "text-gray-400"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill={property.featured ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                        Featured
                      </button>

                      <Link
                        href={`/admin/properties/${property.id}/edit`}
                        className="text-xs font-medium text-brand-dark hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
