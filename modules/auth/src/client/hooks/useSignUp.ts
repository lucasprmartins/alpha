import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "../";
import type {
  AuthResult,
  SignUpCredentials,
  UseSignUpOptions,
} from "../contracts";
import { useAuthConfig } from "./useAuthConfig";

export const useSignUp = (options?: UseSignUpOptions) => {
  const config = useAuthConfig();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: SignUpCredentials): Promise<AuthResult> => {
      const result = await auth.signUp.email(credentials);

      if (result.error) {
        const error = {
          message: result.error.message ?? "Erro ao criar conta.",
        };
        options?.onError?.(error);
        config.onError?.(error);
        return { success: false, error };
      }

      await queryClient.refetchQueries({ queryKey: config.queryKey });
      navigate({ to: config.redirects.afterSignUp });

      options?.onSuccess?.();
      config.onSignUpSuccess?.();

      return { success: true, data: result.data };
    },
  });
};
