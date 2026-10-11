/** Encode an untrusted address for a mailto: URL. Encoding stops a public-form
 * address like "x@y.com?bcc=…" from injecting headers/body into David's reply,
 * but the "@" separator must stay literal (RFC 6068 §2) or strict mail
 * handlers see no domain. */
export function mailtoAddress(email: string): string {
  return encodeURIComponent(email).replace(/%40/g, "@");
}
