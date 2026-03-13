import { AuthContext, defaultAuthConfig, sessionOptions } from "../config";
import type { AuthContextValue, AuthProviderProps } from "../contracts";

export const AuthProvider = ({
  children,
  redirects,
  onSignInSuccess,
  onSignUpSuccess,
  onSignOutSuccess,
  onError,
}: AuthProviderProps) => {
  const value: AuthContextValue = {
    redirects: {
      ...defaultAuthConfig.redirects,
      ...redirects,
    },
    onSignInSuccess,
    onSignUpSuccess,
    onSignOutSuccess,
    onError,
    queryKey: sessionOptions.queryKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
