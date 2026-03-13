import { AuthProvider } from "@app/auth/client/components/AuthProvider";
import { MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface RouterContext {
  queryClient: QueryClient;
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl bg-base-200 p-8 text-center">
        <WarningCircleIcon className="h-12 w-12 text-error" weight="bold" />
        <h1 className="font-bold text-2xl text-base-content">
          Algo deu errado
        </h1>
        <p className="text-base-content/60 text-sm">
          Ocorreu um erro inesperado ao carregar a aplicação.
        </p>
        {import.meta.env.DEV && error.message && (
          <p className="text-base-content/40 text-xs">{error.message}</p>
        )}
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={reset} type="button">
            Tentar novamente
          </button>
          <Link className="btn btn-ghost" to="/">
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function RootNotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl bg-base-200 p-8 text-center">
        <MagnifyingGlassIcon
          className="h-12 w-12 text-base-content/30"
          weight="bold"
        />
        <h1 className="font-bold text-2xl text-base-content">
          Página não encontrada
        </h1>
        <p className="text-base-content/60 text-sm">
          A página que você procura não existe ou foi removida.
        </p>
        <Link className="btn btn-primary" to="/dashboard">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <AuthProvider
      redirects={{
        afterSignIn: "/dashboard",
        afterSignUp: "/dashboard",
        afterSignOut: "/",
      }}
    >
      <Outlet />
      {import.meta.env.VITE_DEVTOOLS === "true" && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </>
      )}
    </AuthProvider>
  ),
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-lg" />
    </div>
  ),
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});
