import type { TaskRepository } from "../contracts/Task";
import type {
  CreateTaskInput,
  InvalidTaskTransitionError,
  TaskPriority,
  TaskValidationError,
} from "../entities/Task";
import { Task, TaskNotFoundError } from "../entities/Task";
import type { Result } from "../Result";
import { err, ok } from "../Result";

export class CreateTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(
    input: CreateTaskInput
  ): Promise<Result<Task, TaskValidationError>> {
    const result = Task.create(input);
    if (!result.ok) {
      return result;
    }
    await this.repository.create(result.value);
    return result;
  }
}

export class ListTasks {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  execute(): Promise<Task[]> {
    return this.repository.findAll();
  }
}

export class StartTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(input: {
    id: string;
  }): Promise<Result<Task, TaskNotFoundError | InvalidTaskTransitionError>> {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }
    const result = task.start();
    if (!result.ok) {
      return result;
    }
    await this.repository.update(task);
    return ok(task);
  }
}

export class CompleteTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(input: {
    id: string;
  }): Promise<Result<Task, TaskNotFoundError | InvalidTaskTransitionError>> {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }
    const result = task.complete();
    if (!result.ok) {
      return result;
    }
    await this.repository.update(task);
    return ok(task);
  }
}

export class CancelTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(input: {
    id: string;
    reason: string;
  }): Promise<
    Result<
      Task,
      TaskNotFoundError | TaskValidationError | InvalidTaskTransitionError
    >
  > {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }
    const result = task.cancel(input.reason);
    if (!result.ok) {
      return result;
    }
    await this.repository.update(task);
    return ok(task);
  }
}

export class ReopenTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(input: {
    id: string;
  }): Promise<Result<Task, TaskNotFoundError | InvalidTaskTransitionError>> {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }
    const result = task.reopen();
    if (!result.ok) {
      return result;
    }
    await this.repository.update(task);
    return ok(task);
  }
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export class UpdateTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(
    input: UpdateTaskInput
  ): Promise<Result<Task, TaskNotFoundError | TaskValidationError>> {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }

    const error = UpdateTask.applyChanges(task, input);
    if (error) {
      return err(error);
    }

    await this.repository.update(task);
    return ok(task);
  }

  private static applyChanges(
    task: Task,
    input: UpdateTaskInput
  ): TaskValidationError | null {
    if (input.title !== undefined) {
      const result = task.changeTitle(input.title);
      if (!result.ok) {
        return result.error;
      }
    }

    if (input.description !== undefined) {
      const result = task.changeDescription(input.description);
      if (!result.ok) {
        return result.error;
      }
    }

    if (input.priority !== undefined) {
      const result = task.changePriority(input.priority);
      if (!result.ok) {
        return result.error;
      }
    }

    if (input.dueDate !== undefined) {
      const result = task.changeDueDate(input.dueDate);
      if (!result.ok) {
        return result.error;
      }
    }

    return null;
  }
}

export class DeleteTask {
  private readonly repository: TaskRepository;

  constructor(repository: TaskRepository) {
    this.repository = repository;
  }

  async execute(input: {
    id: string;
  }): Promise<Result<void, TaskNotFoundError>> {
    const task = await this.repository.findById(input.id);
    if (!task) {
      return err(new TaskNotFoundError(input.id));
    }
    await this.repository.delete(input.id);
    return ok(undefined);
  }
}
