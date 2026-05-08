import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "..";
import { sessionOptions } from "../config";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
}

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const res = await auth.changePassword(input);
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao alterar senha");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionOptions.queryKey });
    },
  });
};
