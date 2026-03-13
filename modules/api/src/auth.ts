import type { Context } from "@app/auth/server";
import { ORPCError, os } from "@orpc/server";

export const o = os.$context<Context>();

function assertAuth(context: Context) {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Você não está autenticado.",
    });
  }
  return context.session;
}

export const requireAuth = o.middleware(({ context, next }) => {
  const session = assertAuth(context);
  return next({ context: { session } });
});

export function requireRole(...roles: string[]) {
  return o.middleware(({ context, next }) => {
    const session = assertAuth(context);
    if (!roles.includes(session.user.role ?? "")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Você não tem permissão.",
      });
    }
    return next({ context: { session } });
  });
}
