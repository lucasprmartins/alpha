import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "../";
import type {
  AuthResult,
  SignInCredentials,
  UseSignInOptions,
} from "../contracts";
import { useAuthConfig } from "./useAuthConfig";

export const useSignIn = (options?: UseSignInOptions) => {
  const config = useAuthConfig();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: SignInCredentials): Promise<AuthResult> => {
      const isEmail = credentials.identifier.includes("@");
      const result = isEmail
        ? await auth.signIn.email({
            email: credentials.identifier,
            password: credentials.password,
          })
        : await auth.signIn.username({
            username: credentials.identifier,
            password: credentials.password,
          });

      if (result.error) {
        const error = {
          message: result.error.message ?? "Erro ao fazer login.",
        };
        options?.onError?.(error);
        config.onError?.(error);
        return { success: false, error };
      }

      await queryClient.refetchQueries({ queryKey: config.queryKey });
      navigate({ to: config.redirects.afterSignIn });

      options?.onSuccess?.();
      config.onSignInSuccess?.();

      return { success: true, data: result.data };
    },
  });
};
