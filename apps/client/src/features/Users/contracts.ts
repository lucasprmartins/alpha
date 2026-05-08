export interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username?: string | null;
  displayUsername?: string | null;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type UserRole = "admin" | "user";

export function isUserBanned(user: UserData): boolean {
  if (!user.banned) {
    return false;
  }
  if (!user.banExpires) {
    return true;
  }
  const expires =
    user.banExpires instanceof Date
      ? user.banExpires
      : new Date(user.banExpires);
  return expires.getTime() > Date.now();
}

export function getUserRole(user: UserData): UserRole {
  return user.role === "admin" ? "admin" : "user";
}

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
