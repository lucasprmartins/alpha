import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { router } from "./server";

export type AppRouterClient = RouterClient<typeof router>;

export const SESSION_EXPIRED_REASON = "session-expired";

let redirecting = false;

const link = new RPCLink({
  url: import.meta.env.VITE_SERVER_URL
    ? `${import.meta.env.VITE_SERVER_URL}/rpc`
    : "/rpc",
  async fetch(input, init) {
    const response = await globalThis.fetch(input, {
      ...init,
      credentials: "include",
    });

    if (response.status === 401 && !redirecting) {
      redirecting = true;
      (globalThis as unknown as { location: { href: string } }).location.href =
        `/login?reason=${SESSION_EXPIRED_REASON}`;
    }

    return response;
  },
});

export const client: AppRouterClient = createORPCClient(link);
export const api = createTanstackQueryUtils(client);
