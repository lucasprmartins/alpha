import { TerminalWindowIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { TaskPage } from "@/features/Task/components";
import { taskListOptions } from "@/features/Task/queries";

function TaskErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.75rem)] items-center justify-center">
      <div className="flex max-w-lg flex-col items-center gap-4 rounded-xl bg-base-200 p-8 text-center">
        <WarningCircleIcon className="h-12 w-12 text-warning" weight="bold" />
        <h1 className="font-bold text-base-content text-xl">
          Tabela de tarefas não encontrada
        </h1>
        <p className="text-balance text-base-content/60 text-sm">
          O domínio <strong>Task</strong> é um exemplo incluso no projeto. Para
          testá-lo, sincronize o schema com o banco de dados:
        </p>
        <div className="flex w-full items-center gap-2 rounded-lg bg-base-300 px-4 py-3 font-mono text-sm">
          <TerminalWindowIcon
            className="h-5 w-5 shrink-0 text-primary"
            weight="bold"
          />
          <code className="select-all text-base-content">bun run db:push</code>
        </div>
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

export const Route = createFileRoute("/_auth/tasks")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(taskListOptions());
  },
  component: TaskPage,
  errorComponent: TaskErrorComponent,
});
