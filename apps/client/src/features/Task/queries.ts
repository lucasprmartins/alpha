import { api } from "@app/api/client";
import type { QueryClient } from "@tanstack/react-query";
import type { TaskData, TaskStatus } from "@/features/Task/contracts";

export const taskListOptions = () => api.task.listTasks.queryOptions();

export const taskKeys = () => api.task.key();

const listQueryKey = () => taskListOptions().queryKey;

interface MutationContext {
  client: QueryClient;
}

async function snapshotAndUpdate<TVariables>(
  variables: TVariables,
  context: MutationContext,
  updater: (tasks: TaskData[], variables: TVariables) => TaskData[]
) {
  const queryKey = listQueryKey();
  await context.client.cancelQueries({ queryKey });
  const previous = context.client.getQueryData(queryKey) as
    | TaskData[]
    | undefined;
  context.client.setQueryData(queryKey, (old: TaskData[] | undefined) =>
    old ? updater(old, variables) : old
  );
  return { previous };
}

function rollback(
  onMutateResult: { previous?: TaskData[] } | undefined,
  context: MutationContext
) {
  context.client.setQueryData(listQueryKey(), onMutateResult?.previous);
}

function invalidate(context: MutationContext) {
  context.client.invalidateQueries({ queryKey: listQueryKey() });
}

export const createTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.createTask.mutationOptions>[0],
    "onSettled"
  >
) =>
  api.task.createTask.mutationOptions({
    ...opts,
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });

export const startTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.startTask.mutationOptions>[0],
    "onMutate" | "onError" | "onSettled"
  >
) =>
  api.task.startTask.mutationOptions({
    ...opts,
    onMutate: (variables, context) =>
      snapshotAndUpdate(variables, context, (tasks, { id }) =>
        tasks.map((t) =>
          t.id === id ? { ...t, status: "in_progress" satisfies TaskStatus } : t
        )
      ),
    onError: (_error, _variables, onMutateResult, context) =>
      rollback(onMutateResult, context),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });

export const completeTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.completeTask.mutationOptions>[0],
    "onMutate" | "onError" | "onSettled"
  >
) =>
  api.task.completeTask.mutationOptions({
    ...opts,
    onMutate: (variables, context) =>
      snapshotAndUpdate(variables, context, (tasks, { id }) =>
        tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "completed" satisfies TaskStatus,
                completedAt: new Date(),
                isActive: false,
              }
            : t
        )
      ),
    onError: (_error, _variables, onMutateResult, context) =>
      rollback(onMutateResult, context),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });

export const cancelTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.cancelTask.mutationOptions>[0],
    "onMutate" | "onError" | "onSettled"
  >
) =>
  api.task.cancelTask.mutationOptions({
    ...opts,
    onMutate: (variables, context) =>
      snapshotAndUpdate(variables, context, (tasks, { id, reason }) =>
        tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "cancelled" satisfies TaskStatus,
                cancelledAt: new Date(),
                cancellationReason: reason,
                isActive: false,
              }
            : t
        )
      ),
    onError: (_error, _variables, onMutateResult, context) =>
      rollback(onMutateResult, context),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });

export const reopenTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.reopenTask.mutationOptions>[0],
    "onMutate" | "onError" | "onSettled"
  >
) =>
  api.task.reopenTask.mutationOptions({
    ...opts,
    onMutate: (variables, context) =>
      snapshotAndUpdate(variables, context, (tasks, { id }) =>
        tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "pending" satisfies TaskStatus,
                completedAt: null,
                cancelledAt: null,
                cancellationReason: null,
                isActive: true,
              }
            : t
        )
      ),
    onError: (_error, _variables, onMutateResult, context) =>
      rollback(onMutateResult, context),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });

export const deleteTaskOptions = (
  opts?: Omit<
    Parameters<typeof api.task.deleteTask.mutationOptions>[0],
    "onMutate" | "onError" | "onSettled"
  >
) =>
  api.task.deleteTask.mutationOptions({
    ...opts,
    onMutate: (variables, context) =>
      snapshotAndUpdate(variables, context, (tasks, { id }) =>
        tasks.filter((t) => t.id !== id)
      ),
    onError: (_error, _variables, onMutateResult, context) =>
      rollback(onMutateResult, context),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      invalidate(context),
  });
