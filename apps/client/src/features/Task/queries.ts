import { api, client } from "@app/api/client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { TaskData } from "@/features/Task/contracts";
import { queryClient } from "@/lib/query";

export const taskListOptions = () => api.task.listTasks.queryOptions();

export const taskCollection = createCollection(
  queryCollectionOptions<TaskData>({
    queryKey: taskListOptions().queryKey,
    queryFn: () => client.task.listTasks(),
    queryClient,
    getKey: (task) => task.id,
    onInsert: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((mutation) => {
          const modified = mutation.modified as TaskData;
          return client.task.createTask({
            title: modified.title,
            description: modified.description ?? undefined,
            priority: modified.priority,
            dueDate: modified.dueDate ?? undefined,
          });
        })
      );
    },
    onUpdate: async ({ transaction }) => {
      function resolveTransition(original: TaskData, modified: TaskData) {
        if (original.status === modified.status) {
          return null;
        }

        if (modified.status === "in_progress") {
          return client.task.startTask({ id: original.id });
        }
        if (modified.status === "completed") {
          return client.task.completeTask({ id: original.id });
        }
        if (modified.status === "cancelled") {
          return client.task.cancelTask({
            id: original.id,
            reason: modified.cancellationReason ?? "",
          });
        }
        if (modified.status === "pending") {
          return client.task.reopenTask({ id: original.id });
        }

        return null;
      }

      const ops = transaction.mutations
        .map((m) =>
          resolveTransition(m.original as TaskData, m.modified as TaskData)
        )
        .filter(Boolean);

      await Promise.all(ops);
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((mutation) =>
          client.task.deleteTask({ id: mutation.key as string })
        )
      );
    },
  })
);
