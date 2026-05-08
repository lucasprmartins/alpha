import { db } from "@app/db";
import { task } from "@app/db/schema/task";
import type { TaskRepository } from "@domain/contracts/Task";
import {
  Task,
  type TaskPriority,
  type TaskProps,
  type TaskStatus,
} from "@domain/entities/Task";
import { eq } from "drizzle-orm";

function toEntity(row: typeof task.$inferSelect): Task {
  const props: TaskProps = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return new Task(props);
}

export const taskRepository: TaskRepository = {
  async create(entity) {
    await db.insert(task).values({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      dueDate: entity.dueDate,
      completedAt: entity.completedAt,
      cancelledAt: entity.cancelledAt,
      cancellationReason: entity.cancellationReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  },

  async findAll() {
    const rows = await db.select().from(task);
    return rows.map(toEntity);
  },

  async findById(id) {
    const [row] = await db.select().from(task).where(eq(task.id, id));
    return row ? toEntity(row) : null;
  },

  async update(entity) {
    await db
      .update(task)
      .set({
        title: entity.title,
        description: entity.description,
        status: entity.status,
        priority: entity.priority,
        dueDate: entity.dueDate,
        completedAt: entity.completedAt,
        cancelledAt: entity.cancelledAt,
        cancellationReason: entity.cancellationReason,
        updatedAt: entity.updatedAt,
      })
      .where(eq(task.id, entity.id));
  },

  async delete(id) {
    await db.delete(task).where(eq(task.id, id));
  },
};
