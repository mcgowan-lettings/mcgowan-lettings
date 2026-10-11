"use client";

import { useState, useRef } from "react";
import AdminThumb from "@/app/admin/AdminThumb";

type Props = {
  images: string[];
  onReorder: (images: string[]) => void;
  onRemove: (index: number) => void;
  /** Disables Remove while a save is in flight: removing deletes unsaved
   * files from Storage, which the saving row may already reference. */
  removeDisabled?: boolean;
};

export default function SortableImageGrid({ images, onReorder, onRemove, removeDisabled = false }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Firefox won't start an HTML5 drag unless some data is set.
    // Custom type: Firefox needs *some* data to start a drag, but text/plain
    // would get typed into a field if the tile is dropped on an input.
    e.dataTransfer.setData("application/x-photo-index", String(index));
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = [...images];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(overIndex, 0, moved);
      onReorder(reordered);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  // Without preventDefault, Firefox treats the drop as a navigation to the
  // "text/plain" payload; reordering itself happens in dragend.
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorder(reordered);
  };

  if (images.length === 0) return null;

  return (
    // One column under 360px: two-column tiles there are too short for the
    // 44px remove + move buttons without them overlapping.
    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((url, index) => (
        <div
          key={`${url}-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(index, e)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(index, e)}
          onDrop={handleDrop}
          className={`group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 cursor-grab active:cursor-grabbing transition-transform ${
            overIndex === index && dragIndex !== index
              ? "ring-2 ring-brand scale-[1.02]"
              : ""
          }`}
        >
          <AdminThumb
            src={url}
            alt={`Property image ${index + 1}`}
            fill
            className="object-cover pointer-events-none"
            sizes="200px"
          />
          {/* Remove button — always visible on touch devices (incl. iPad);
              only hidden until hover where a real hover exists. The 44px
              button is transparent with a smaller visual circle inside. */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={removeDisabled}
            aria-label={`Remove photo ${index + 1}`}
            className="group/btn absolute right-0 top-0 flex h-11 w-11 items-center justify-center opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:!opacity-30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white group-hover/btn:bg-black/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
          {/* Move buttons — shown on touch devices (phones and iPads), where
              drag-and-drop isn't available; mouse users drag instead. */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between [@media(hover:hover)]:hidden">
              <button
                type="button"
                onClick={() => moveImage(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move photo ${index + 1} left`}
                className="group/btn flex h-11 w-11 items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white group-hover/btn:bg-black/80">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={() => moveImage(index, index + 1)}
                disabled={index === images.length - 1}
                aria-label={`Move photo ${index + 1} right`}
                className="group/btn flex h-11 w-11 items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white group-hover/btn:bg-black/80">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </button>
            </div>
          )}
          {/* Main badge */}
          {index === 0 && (
            <span className="absolute left-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-xs font-semibold text-dark">
              Main
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
