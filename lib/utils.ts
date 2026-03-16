export function normalizeToString(input: any): string {
  if (!input) return "";

  if (typeof input === "string") return input;

  if (typeof input === "object") {
    return input.name || input.label || input.title || "";
  }

  return String(input);
}
