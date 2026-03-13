import { logger } from "@app/config/logger";
import { taskRepository } from "@app/db/repositories/task";
import {
  CancelTask,
  CompleteTask,
  CreateTask,
  DeleteTask,
  ListTasks,
  ReopenTask,
  StartTask,
} from "@app/domain/application/Task";
import type { Task } from "@app/domain/entities/Task";
import { TaskNotFoundError } from "@app/domain/entities/Task";
import { z } from "zod";
import { o, requireAuth } from "../auth";

function toResponse(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    cancelledAt: task.cancelledAt,
    cancellationReason: task.cancellationReason,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    isOverdue: task.isOverdue,
    isActive: task.isActive,
  };
}

const base = o.use(requireAuth).errors({
  NOT_FOUND: { status: 404, data: z.object({ id: z.string() }) },
  BAD_REQUEST: { data: z.object({ message: z.string() }) },
});

const createTask = base
  .route({
    method: "POST",
    path: "/tasks",
    summary: "Criar tarefa",
    tags: ["tasks"],
  })
  .input(
    z.object({
      title: z.string().describe("Título da tarefa"),
      description: z.string().optional().describe("Descrição"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("Prioridade"),
      dueDate: z.coerce.date().optional().describe("Data limite"),
    })
  )
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "createTask input");
    const result = await new CreateTask(taskRepository).execute(input);
    if (!result.ok) {
      throw errors.BAD_REQUEST({ data: { message: result.error.message } });
    }
    const response = toResponse(result.value);
    logger.debug({ task: response }, "createTask output");
    return response;
  });

const listTasks = base
  .route({
    method: "GET",
    path: "/tasks",
    summary: "Listar tarefas",
    tags: ["tasks"],
  })
  .handler(async () => {
    const tasks = await new ListTasks(taskRepository).execute();
    logger.debug({ count: tasks.length }, "listTasks output");
    return tasks.map(toResponse);
  });

const startTask = base
  .route({
    method: "PATCH",
    path: "/tasks/{id}/start",
    summary: "Iniciar tarefa",
    tags: ["tasks"],
  })
  .input(z.object({ id: z.string().describe("ID da tarefa") }))
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "startTask input");
    const result = await new StartTask(taskRepository).execute({
      id: input.id,
    });
    if (!result.ok) {
      if (result.error instanceof TaskNotFoundError) {
        throw errors.NOT_FOUND({ data: { id: input.id } });
      }
      throw errors.BAD_REQUEST({ data: { message: result.error.message } });
    }
    const response = toResponse(result.value);
    logger.debug({ task: response }, "startTask output");
    return response;
  });

const completeTask = base
  .route({
    method: "PATCH",
    path: "/tasks/{id}/complete",
    summary: "Concluir tarefa",
    tags: ["tasks"],
  })
  .input(z.object({ id: z.string().describe("ID da tarefa") }))
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "completeTask input");
    const result = await new CompleteTask(taskRepository).execute({
      id: input.id,
    });
    if (!result.ok) {
      if (result.error instanceof TaskNotFoundError) {
        throw errors.NOT_FOUND({ data: { id: input.id } });
      }
      throw errors.BAD_REQUEST({ data: { message: result.error.message } });
    }
    const response = toResponse(result.value);
    logger.debug({ task: response }, "completeTask output");
    return response;
  });

const cancelTask = base
  .route({
    method: "PATCH",
    path: "/tasks/{id}/cancel",
    summary: "Cancelar tarefa",
    tags: ["tasks"],
  })
  .input(
    z.object({
      id: z.string().describe("ID da tarefa"),
      reason: z.string().describe("Motivo do cancelamento"),
    })
  )
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "cancelTask input");
    const result = await new CancelTask(taskRepository).execute({
      id: input.id,
      reason: input.reason,
    });
    if (!result.ok) {
      if (result.error instanceof TaskNotFoundError) {
        throw errors.NOT_FOUND({ data: { id: input.id } });
      }
      throw errors.BAD_REQUEST({ data: { message: result.error.message } });
    }
    const response = toResponse(result.value);
    logger.debug({ task: response }, "cancelTask output");
    return response;
  });

const reopenTask = base
  .route({
    method: "PATCH",
    path: "/tasks/{id}/reopen",
    summary: "Reabrir tarefa",
    tags: ["tasks"],
  })
  .input(z.object({ id: z.string().describe("ID da tarefa") }))
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "reopenTask input");
    const result = await new ReopenTask(taskRepository).execute({
      id: input.id,
    });
    if (!result.ok) {
      if (result.error instanceof TaskNotFoundError) {
        throw errors.NOT_FOUND({ data: { id: input.id } });
      }
      throw errors.BAD_REQUEST({ data: { message: result.error.message } });
    }
    const response = toResponse(result.value);
    logger.debug({ task: response }, "reopenTask output");
    return response;
  });

const deleteTask = base
  .route({
    method: "DELETE",
    path: "/tasks/{id}",
    summary: "Deletar tarefa",
    tags: ["tasks"],
  })
  .input(z.object({ id: z.string().describe("ID da tarefa") }))
  .handler(async ({ input, errors }) => {
    logger.debug({ input }, "deleteTask input");
    const result = await new DeleteTask(taskRepository).execute({
      id: input.id,
    });
    if (!result.ok) {
      throw errors.NOT_FOUND({ data: { id: input.id } });
    }
    logger.debug({ id: input.id }, "deleteTask output");
  });

export const taskRouter = {
  createTask,
  listTasks,
  startTask,
  completeTask,
  cancelTask,
  reopenTask,
  deleteTask,
};
