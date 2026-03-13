import { queryOptions } from "@tanstack/react-query";
import { createContext } from "react";
import { auth } from "./";
import type { AuthConfig, AuthContextValue } from "./contracts";

export const defaultAuthConfig: AuthConfig = {
  redirects: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: () => auth.getSession().then((r) => r.data),
  staleTime: 1000 * 60 * 5,
});
