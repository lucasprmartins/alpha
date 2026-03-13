import { api } from "@app/api/client";

export const taskListOptions = () => api.task.listTasks.queryOptions();

export const taskKeys = () => api.task.key();

export const createTaskOptions = api.task.createTask.mutationOptions;
export const startTaskOptions = api.task.startTask.mutationOptions;
export const completeTaskOptions = api.task.completeTask.mutationOptions;
export const cancelTaskOptions = api.task.cancelTask.mutationOptions;
export const reopenTaskOptions = api.task.reopenTask.mutationOptions;
export const deleteTaskOptions = api.task.deleteTask.mutationOptions;
