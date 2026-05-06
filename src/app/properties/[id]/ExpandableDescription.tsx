import { renderInline } from "@/lib/rich-text";

type Props =
  | { html: string; plainText?: never }
  | { html?: never; plainText: string };

// CSS-only collapse via a hidden checkbox + peer-checked variants. Visually
// matches the previous useState-based toggle (truncated to ~150px, gradient
// fade, "Read full description" → "Show less"), but works without React
// hydration so older iPad Safari can still expand the description.
export default function ExpandableDescription(props: Props) {
  const isHtml = "html" in props && props.html !== undefined;

  const plainLength = isHtml
    ? props.html.replace(/<[^>]+>/g, " ").trim().length
    : props.plainText.length;
  const paragraphCount = isHtml
    ? (props.html.match(/<p\b/gi) ?? []).length
    : props.plainText.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const isLong = paragraphCount > 2 || plainLength > 500;

  const legacyParagraphs = isHtml
    ? []
    : props.plainText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

  const body = isHtml ? (
    <div
      className="rich-content text-[15px]"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  ) : (
    <div className="space-y-3">
      {legacyParagraphs.map((p, i) => (
        <p key={i} className="text-text-muted text-[15px] leading-relaxed">
          {renderInline(p)}
        </p>
      ))}
    </div>
  );

  if (!isLong) {
    return <div>{body}</div>;
  }

  // Single description per page → one stable id is fine.
  const toggleId = "property-description-toggle";

  return (
    <div className="relative">
      <input
        type="checkbox"
        id={toggleId}
        className="peer sr-only"
        aria-hidden="true"
      />
      <div className="overflow-hidden max-h-[150px] peer-checked:max-h-none peer-checked:overflow-visible">
        {body}
      </div>
      {/* Fade gradient over the bottom of the truncated body. Hidden when
          expanded. Positioned at top:86px = 150px (max-h) − 64px (h-16). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent peer-checked:hidden"
        style={{ top: "86px" }}
      />
      <label
        htmlFor={toggleId}
        className="peer-checked:hidden mt-2 inline-block text-sm font-semibold text-brand-dark hover:underline cursor-pointer"
      >
        Read full description
      </label>
      <label
        htmlFor={toggleId}
        className="hidden peer-checked:inline-block mt-2 text-sm font-semibold text-brand-dark hover:underline cursor-pointer"
      >
        Show less
      </label>
    </div>
  );
}
