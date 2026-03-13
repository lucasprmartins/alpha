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
