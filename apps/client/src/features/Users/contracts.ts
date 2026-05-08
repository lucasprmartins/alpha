import { toUserRole, type UserRole } from "@app/auth/client/contracts";

export type { UserRole } from "@app/auth/client/contracts";

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
  return toUserRole(user.role);
}
