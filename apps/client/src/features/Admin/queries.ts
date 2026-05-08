import { auth } from "@app/auth/client";
import { queryOptions } from "@tanstack/react-query";
import type { UserData } from "@/features/Admin/contracts";

export const USERS_QUERY_KEY = ["users", "list"] as const;

export const usersListOptions = queryOptions({
  queryKey: USERS_QUERY_KEY,
  queryFn: async (): Promise<UserData[]> => {
    const res = await auth.admin.listUsers({ query: { limit: 100 } });
    if (res.error) {
      throw new Error(res.error.message ?? "Falha ao listar usuários");
    }
    return res.data.users as UserData[];
  },
});
