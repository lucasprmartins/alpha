import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "../";
import type { AuthResult, UseSignOutOptions } from "../contracts";
import { useAuthConfig } from "./useAuthConfig";

export const useSignOut = (options?: UseSignOutOptions) => {
  const config = useAuthConfig();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (): Promise<AuthResult> => {
      await auth.signOut();

      queryClient.removeQueries({ queryKey: config.queryKey });
      navigate({ to: options?.redirectTo ?? config.redirects.afterSignOut });

      options?.onSuccess?.();
      config.onSignOutSuccess?.();

      return { success: true };
    },
  });
};
