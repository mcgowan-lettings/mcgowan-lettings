/**
 * Top-left badge on property cards (home, /properties, similar properties).
 * "Let Agreed" wins over "New Property" — a let property is no longer new to
 * anyone browsing. David toggles is_new by hand from the admin list.
 */
export default function PropertyCardBadge({
  status,
  isNew,
}: {
  status: string | null;
  isNew?: boolean | null;
}) {
  if (status === "Let Agreed") {
    return (
      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
        Let Agreed
      </div>
    );
  }
  if (isNew) {
    return (
      <div className="absolute top-3 left-3 bg-brand text-dark text-xs font-medium px-3 py-1 rounded-full shadow-sm">
        New Property
      </div>
    );
  }
  return null;
}
