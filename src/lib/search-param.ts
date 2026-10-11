/** First value of a Next.js searchParams entry, as a plain string. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Truncate by code point — slicing UTF-16 can split an emoji into a lone
 * surrogate, which Postgres rejects when the form is submitted. */
export function clip(value: string, max: number): string {
  return Array.from(value).slice(0, max).join("");
}
