const WHITESPACE_RE = /\s+/;

export function getInitials(name: string): string {
  const parts = name.trim().split(WHITESPACE_RE).filter(Boolean);
  const first = parts[0];
  if (!first) {
    return "?";
  }
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = parts.at(-1) ?? first;
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}
