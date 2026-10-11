"use client";

type Props = {
  videos: string[];
  onRemove: (index: number) => void;
  /** Disables Remove while a save is in flight (see SortableImageGrid). */
  removeDisabled?: boolean;
};

function fileNameFromUrl(url: string): string {
  const last = url.split("/").pop() ?? url;
  return decodeURIComponent(last.split("?")[0]);
}

export default function VideoList({ videos, onRemove, removeDisabled = false }: Props) {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {videos.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5"
        >
          <div className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-dark">
            <video
              src={url}
              preload="metadata"
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <svg className="h-6 w-6 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-dark">
              {fileNameFromUrl(url)}
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted hover:text-brand-dark hover:underline"
            >
              Preview in new tab
            </a>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={removeDisabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-text-muted"
            title="Remove video"
            aria-label={`Remove video ${index + 1}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
