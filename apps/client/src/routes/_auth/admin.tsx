import { WarningCircleIcon } from "@phosphor-icons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminPage } from "@/features/Admin/components";
import { usersListOptions } from "@/features/Admin/queries";

function AdminErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.75rem)] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl bg-base-200 p-8 text-center">
        <WarningCircleIcon className="h-12 w-12 text-error" weight="bold" />
        <h1 className="font-bold text-base-content text-xl">
          Não foi possível carregar a administração
        </h1>
        <p className="text-base-content/60 text-sm">
          Verifique se o plugin <strong>admin</strong> do Better Auth está ativo
          e se você possui o papel necessário.
        </p>
        {import.meta.env.DEV && error.message && (
          <p className="text-base-content/40 text-xs">{error.message}</p>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={reset}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_auth/admin")({
  beforeLoad: ({ context }) => {
    const role = context.session?.user.role;
    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(usersListOptions),
  component: AdminPage,
  errorComponent: AdminErrorComponent,
});
