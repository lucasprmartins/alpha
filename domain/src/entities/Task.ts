import type { Result } from "../Result";
import { err, ok } from "../Result";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskProps {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 200;

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["pending"],
  cancelled: ["pending"],
};

export class Task {
  readonly id: string;
  private _title: string;
  private _description: string | null;
  private _status: TaskStatus;
  private _priority: TaskPriority;
  private _dueDate: Date | null;
  private _completedAt: Date | null;
  private _cancelledAt: Date | null;
  private _cancellationReason: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TaskProps) {
    this.id = props.id;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._priority = props.priority;
    this._dueDate = props.dueDate;
    this._completedAt = props.completedAt;
    this._cancelledAt = props.cancelledAt;
    this._cancellationReason = props.cancellationReason;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get priority(): TaskPriority {
    return this._priority;
  }

  get dueDate(): Date | null {
    return this._dueDate;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isOverdue(): boolean {
    if (!this._dueDate) {
      return false;
    }
    if (this._status === "completed" || this._status === "cancelled") {
      return false;
    }
    return this._dueDate < new Date();
  }

  get isActive(): boolean {
    return this._status === "pending" || this._status === "in_progress";
  }

  static create(input: CreateTaskInput): Result<Task, TaskValidationError> {
    const titleError = Task.validateTitle(input.title);
    if (titleError) {
      return err(titleError);
    }

    if (input.dueDate && input.dueDate < new Date()) {
      return err(new TaskValidationError("A data limite deve ser no futuro"));
    }

    const now = new Date();
    return ok(
      new Task({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description ?? null,
        status: "pending",
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ?? null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  start(): Result<void, InvalidTaskTransitionError> {
    return this.transitionTo("in_progress");
  }

  complete(): Result<void, InvalidTaskTransitionError> {
    const result = this.transitionTo("completed");
    if (result.ok) {
      this._completedAt = new Date();
    }
    return result;
  }

  cancel(
    reason: string
  ): Result<void, TaskValidationError | InvalidTaskTransitionError> {
    if (!reason.trim()) {
      return err(
        new TaskValidationError("O motivo do cancelamento é obrigatório")
      );
    }
    const result = this.transitionTo("cancelled");
    if (result.ok) {
      this._cancelledAt = new Date();
      this._cancellationReason = reason;
    }
    return result;
  }

  reopen(): Result<void, InvalidTaskTransitionError> {
    const result = this.transitionTo("pending");
    if (result.ok) {
      this._completedAt = null;
      this._cancelledAt = null;
      this._cancellationReason = null;
    }
    return result;
  }

  changeTitle(title: string): Result<void, TaskValidationError> {
    const activeError = this.ensureActive();
    if (activeError) {
      return err(activeError);
    }
    const titleError = Task.validateTitle(title);
    if (titleError) {
      return err(titleError);
    }
    this._title = title;
    this.touch();
    return ok(undefined);
  }

  changeDescription(
    description: string | null
  ): Result<void, TaskValidationError> {
    const activeError = this.ensureActive();
    if (activeError) {
      return err(activeError);
    }
    this._description = description;
    this.touch();
    return ok(undefined);
  }

  changePriority(priority: TaskPriority): Result<void, TaskValidationError> {
    const activeError = this.ensureActive();
    if (activeError) {
      return err(activeError);
    }
    this._priority = priority;
    this.touch();
    return ok(undefined);
  }

  changeDueDate(dueDate: Date | null): Result<void, TaskValidationError> {
    const activeError = this.ensureActive();
    if (activeError) {
      return err(activeError);
    }
    if (dueDate && dueDate < new Date()) {
      return err(new TaskValidationError("A data limite deve ser no futuro"));
    }
    this._dueDate = dueDate;
    this.touch();
    return ok(undefined);
  }

  private transitionTo(
    target: TaskStatus
  ): Result<void, InvalidTaskTransitionError> {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      return err(new InvalidTaskTransitionError(this._status, target));
    }
    this._status = target;
    this.touch();
    return ok(undefined);
  }

  private ensureActive(): TaskValidationError | null {
    if (!this.isActive) {
      return new TaskValidationError(
        `Não é possível modificar uma tarefa com status "${this._status}"`
      );
    }
    return null;
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private static validateTitle(title: string): TaskValidationError | null {
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN_LENGTH) {
      return new TaskValidationError("O título não pode ser vazio");
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      return new TaskValidationError(
        `O título não pode exceder ${TITLE_MAX_LENGTH} caracteres`
      );
    }
    return null;
  }
}

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Tarefa não encontrada: ${id}`);
    this.name = "TaskNotFoundError";
  }
}

export class TaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskValidationError";
  }
}

export class InvalidTaskTransitionError extends Error {
  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Não é possível transicionar de "${from}" para "${to}"`);
    this.name = "InvalidTaskTransitionError";
  }
}
