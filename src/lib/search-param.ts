/** First value of a Next.js searchParams entry, as a plain string. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
