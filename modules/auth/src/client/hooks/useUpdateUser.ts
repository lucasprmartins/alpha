import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "..";
import { sessionOptions } from "../config";

interface UpdateUserInput {
  name?: string;
  username?: string;
  displayUsername?: string;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const res = await auth.updateUser(input);
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao atualizar perfil");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionOptions.queryKey });
    },
  });
};
