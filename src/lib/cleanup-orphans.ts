import { supabase } from "@/lib/supabase";

const BUCKET = "property-images";
const PREFIXES = ["properties", "properties/videos", "epc"];

/**
 * Hard cap on how many files we'll delete in one pass. Even if every other
 * safety check passed, this is a "if something has gone catastrophically
 * wrong, fail closed" backstop. David has ~18 active properties at most a
 * few hundred files; 500 is generous and still well below "wipe the bucket".
 */
const MAX_DELETIONS_PER_CALL = 500;

function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/**
 * Delete storage files in `property-images` that aren't referenced by any
 * row in the `properties` table.
 *
 * Safety model
 * ------------
 * Earlier this function destructured `data` and ignored the error from
 * Supabase. That meant a transient query failure produced an empty
 * `referenced` set and the next pass deleted the entire bucket. Since this
 * runs on every admin page load (via useStorageUsage), one network blip
 * could wipe every property's photos. The current implementation:
 *
 *   1. Throws if the properties query errors. The caller swallows the
 *      throw, so worst case is "no cleanup runs this turn" — never "all
 *      files deleted".
 *   2. Throws if the storage list errors for any prefix. Same reasoning:
 *      we'd otherwise delete files based on incomplete reference data.
 *   3. Hard-caps deletions at MAX_DELETIONS_PER_CALL. If we ever queue more
 *      than that, refuse and throw — something has gone wrong upstream and
 *      the operator needs to investigate manually.
 */
export async function cleanupOrphans(): Promise<number> {
  const { data: rows, error: rowsError } = await supabase
    .from("properties")
    .select("images, videos, epc_document");

  if (rowsError) {
    throw new Error(`cleanupOrphans: failed to list properties: ${rowsError.message}`);
  }
  if (!rows) {
    // `null` data with no error shouldn't happen, but if it does, treat it
    // as a failure rather than "every file is an orphan".
    throw new Error("cleanupOrphans: properties query returned null data");
  }

  const referenced = new Set<string>();
  for (const row of rows) {
    for (const u of (row.images as string[] | null) ?? []) {
      const p = pathFromUrl(u);
      if (p) referenced.add(p);
    }
    for (const u of (row.videos as string[] | null) ?? []) {
      const p = pathFromUrl(u);
      if (p) referenced.add(p);
    }
    const epc = pathFromUrl(row.epc_document as string | null);
    if (epc) referenced.add(epc);
  }

  const toDelete: string[] = [];
  for (const prefix of PREFIXES) {
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(prefix, { limit: pageSize, offset });

      if (listError) {
        throw new Error(
          `cleanupOrphans: failed to list ${prefix}: ${listError.message}`
        );
      }
      if (!data || data.length === 0) break;

      for (const file of data) {
        if (!file.metadata) continue;
        const fullPath = `${prefix}/${file.name}`;
        if (!referenced.has(fullPath)) toDelete.push(fullPath);
      }

      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }

  if (toDelete.length > MAX_DELETIONS_PER_CALL) {
    throw new Error(
      `cleanupOrphans: refusing to delete ${toDelete.length} files in one ` +
        `call (cap is ${MAX_DELETIONS_PER_CALL}). Investigate before retrying.`
    );
  }

  if (toDelete.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(toDelete);
    if (removeError) {
      throw new Error(`cleanupOrphans: remove failed: ${removeError.message}`);
    }
  }
  return toDelete.length;
}
