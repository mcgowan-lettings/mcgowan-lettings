import { renderInline } from "@/lib/rich-text";

type Props =
  | { html: string; plainText?: never }
  | { html?: never; plainText: string };

// Render the full description inline. Previously this collapsed to ~150px with
// a "Read full description" toggle, but that toggle relied on React hydration
// — which fails on some older iPad Safari versions, leaving David's tenants
// unable to read past the fold. Showing everything is also better for SEO.
export default function ExpandableDescription(props: Props) {
  const isHtml = "html" in props && props.html !== undefined;

  if (isHtml) {
    return (
      <div
        className="rich-content text-[15px]"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    );
  }

  const paragraphs = props.plainText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-text-muted text-[15px] leading-relaxed">
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
