import type { Icon } from "@phosphor-icons/react";
import { ShieldCheckIcon, UserCircleIcon } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface AuthResult<T = unknown> {
  data?: T;
  error?: { message: string };
  success: boolean;
}

export interface AuthRedirects {
  afterSignIn: string;
  afterSignOut: string;
  afterSignUp: string;
}

export interface AuthConfig {
  onError?: (error: { message: string }) => void;
  onSignInSuccess?: () => void;
  onSignOutSuccess?: () => void;
  onSignUpSuccess?: () => void;
  redirects: AuthRedirects;
}

export interface AuthContextValue extends AuthConfig {
  queryKey: readonly string[];
}

export interface AuthProviderProps {
  children: ReactNode;
  onError?: (error: { message: string }) => void;
  onSignInSuccess?: () => void;
  onSignOutSuccess?: () => void;
  onSignUpSuccess?: () => void;
  redirects?: Partial<AuthRedirects>;
}

export interface SignInCredentials {
  identifier: string;
  password: string;
}

export interface UseSignInOptions {
  onError?: (error: { message: string }) => void;
  onSuccess?: () => void;
}

export interface SignUpCredentials {
  email: string;
  name: string;
  password: string;
  username: string;
}

export interface UseSignUpOptions {
  onError?: (error: { message: string }) => void;
  onSuccess?: () => void;
}

export interface UseSignOutOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

export interface SignInFormProps {
  onSwitchForm?: () => void;
}

export interface SignUpFormProps {
  onSwitchForm?: () => void;
}

export type SignOutButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "onClick"
>;

export type UserRole = "admin" | "user";

export const ROLES: UserRole[] = ["user", "admin"];

interface RoleMeta {
  label: string;
  icon: Icon;
  badgeClass: string;
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    label: "Admin",
    icon: ShieldCheckIcon,
    badgeClass: "badge badge-soft badge-primary gap-1 font-medium",
  },
  user: {
    label: "Usuário",
    icon: UserCircleIcon,
    badgeClass: "badge badge-soft gap-1 font-medium",
  },
};

export function toUserRole(role?: string | null): UserRole {
  return role === "admin" ? "admin" : "user";
}

export function isAdmin(role?: string | null): boolean {
  return role === "admin";
}
