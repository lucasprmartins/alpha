import { sessionOptions } from "@app/auth/client/config";
import { WarningCircleIcon } from "@phosphor-icons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
// Layout alternativo: import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar";

// Layout: Sidebar | Header
const LayoutComponent = Sidebar;

function AuthErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <LayoutComponent>
      <div className="flex min-h-[calc(100vh-3.75rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl bg-base-200 p-8 text-center">
          <WarningCircleIcon className="h-12 w-12 text-error" weight="bold" />
          <h1 className="font-bold text-2xl text-base-content">
            Algo deu errado
          </h1>
          <p className="text-base-content/60 text-sm">
            Ocorreu um erro inesperado ao carregar esta página.
          </p>
          {import.meta.env.DEV && error.message && (
            <p className="text-base-content/40 text-xs">{error.message}</p>
          )}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={reset} type="button">
              Tentar novamente
            </button>
            <Link className="btn btn-ghost" to="/dashboard">
              Ir para o início
            </Link>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
}

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionOptions);

    if (!session) {
      throw redirect({ to: "/login" });
    }

    return { session };
  },
  component: () => (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  ),
  pendingComponent: () => (
    <LayoutComponent>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              className="animate-[fadeIn_0.4s_ease-out_both] rounded-xl bg-base-200 p-5"
              key={`skeleton-${i}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-col gap-4">
                <div className="skeleton h-6 w-28" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutComponent>
  ),
  errorComponent: AuthErrorComponent,
});
