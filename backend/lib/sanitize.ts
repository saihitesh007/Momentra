/** Normalizes untrusted prompt text and neutralizes tag delimiters used by prompt templates. */
export function sanitizeForPrompt(value: string | null | undefined, maxLength = 1000): string {
  return (value ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, Math.max(0, maxLength))
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Adds a clear data delimiter around sanitized user-controlled values. */
export function userDataBlock(value: string | null | undefined, maxLength = 1000): string {
  return `<user_data>${sanitizeForPrompt(value, maxLength)}</user_data>`;
}
