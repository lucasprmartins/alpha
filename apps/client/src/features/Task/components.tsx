import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CheckSquareOffsetIcon,
  ClockIcon,
  FunnelSimpleIcon,
  PlayIcon,
  PlusIcon,
  ProhibitIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useLiveQuery } from "@tanstack/react-db";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cancelTaskTransition,
  completeTaskTransition,
  createTask,
  PRIORITY_CONFIG,
  reopenTaskTransition,
  STATUS_CONFIG,
  STATUS_TABS,
  type StatusFilter,
  startTaskTransition,
  type TaskData,
  type TaskPriority,
} from "@/features/Task/contracts";
import { taskCollection } from "@/features/Task/queries";

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Hoje";
  }
  if (diffDays === 1) {
    return "Amanhã";
  }
  if (diffDays === -1) {
    return "Ontem";
  }
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d atrás`;
  }
  if (diffDays <= 7) {
    return `em ${diffDays}d`;
  }
  return formatDate(date);
}

// ─── Types ──────────────────────────────────────────────────────────

interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  overdue: number;
  counts: Record<string, number>;
}

function summarizeTasks(tasks: TaskData[]): TaskSummary {
  let completed = 0;
  let inProgress = 0;
  let cancelled = 0;
  let overdue = 0;
  const counts: Record<string, number> = {};

  for (const t of tasks) {
    counts[t.status] = (counts[t.status] || 0) + 1;
    if (t.status === "completed") {
      completed++;
    } else if (t.status === "in_progress") {
      inProgress++;
    } else if (t.status === "cancelled") {
      cancelled++;
    }
    if (t.isOverdue) {
      overdue++;
    }
  }

  return {
    total: tasks.length,
    completed,
    inProgress,
    cancelled,
    overdue,
    counts,
  };
}

// ─── Progress Bar ───────────────────────────────────────────────────

function ProgressBar({ summary }: { summary: TaskSummary }) {
  const { total, completed, inProgress, cancelled } = summary;
  if (total === 0) {
    return null;
  }

  const pct = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-base-300">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-success"
          style={{ width: `${(completed / total) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-info/60"
          style={{
            left: `${(completed / total) * 100}%`,
            width: `${(inProgress / total) * 100}%`,
          }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-error/30"
          style={{
            left: `${((completed + inProgress) / total) * 100}%`,
            width: `${(cancelled / total) * 100}%`,
          }}
        />
      </div>
      <span className="shrink-0 font-medium text-base-content/40 text-xs tabular-nums tracking-wide">
        {pct}%
      </span>
    </div>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────

function StatsRow({ summary }: { summary: TaskSummary }) {
  const { completed, inProgress, overdue } = summary;

  const stats = [
    {
      label: "Concluídas",
      value: completed,
      color: "text-success",
      icon: CheckCircleIcon,
    },
    {
      label: "Em progresso",
      value: inProgress,
      color: "text-info",
      icon: ClockIcon,
    },
    {
      label: "Atrasadas",
      value: overdue,
      color: "text-error",
      icon: WarningCircleIcon,
      hide: overdue === 0,
    },
  ];

  return (
    <div className="flex items-center gap-5">
      {stats
        .filter((s) => !s.hide)
        .map((stat) => (
          <div className="flex items-center gap-1.5 text-xs" key={stat.label}>
            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} weight="bold" />
            <span className="text-base-content/50">
              <span className={`font-semibold tabular-nums ${stat.color}`}>
                {stat.value}
              </span>{" "}
              {stat.label.toLowerCase()}
            </span>
          </div>
        ))}
    </div>
  );
}

// ─── Style helpers ───────────────────────────────────────────────────

const STATUS_ICON_STYLE: Record<TaskData["status"], string> = {
  in_progress: "text-info",
  completed: "text-success",
  cancelled: "text-base-content/25",
  pending: "text-base-content/30",
};

const PRIORITY_BADGE_STYLE: Record<TaskPriority, string> = {
  urgent: "bg-error/10 text-error",
  high: "bg-warning/10 text-warning",
  medium: "bg-info/10 text-info",
  low: "bg-base-300/50 text-base-content/40",
};

// ─── Task Card sub-components ────────────────────────────────────────

function TaskCardActions({
  task,
  onStart,
  onComplete,
  onCancel,
  onReopen,
  onDelete,
}: {
  task: TaskData;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      {task.status === "pending" && (
        <>
          <button
            className="btn btn-ghost btn-xs tooltip tooltip-left text-info hover:bg-info/10"
            data-tip="Iniciar"
            onClick={onStart}
            type="button"
          >
            <PlayIcon className="h-3.5 w-3.5" weight="fill" />
          </button>
          <button
            className="btn btn-ghost btn-xs tooltip tooltip-left text-warning hover:bg-warning/10"
            data-tip="Cancelar"
            onClick={onCancel}
            type="button"
          >
            <ProhibitIcon className="h-3.5 w-3.5" weight="bold" />
          </button>
        </>
      )}
      {task.status === "in_progress" && (
        <>
          <button
            className="btn btn-ghost btn-xs tooltip tooltip-left text-success hover:bg-success/10"
            data-tip="Concluir"
            onClick={onComplete}
            type="button"
          >
            <CheckCircleIcon className="h-3.5 w-3.5" weight="bold" />
          </button>
          <button
            className="btn btn-ghost btn-xs tooltip tooltip-left text-warning hover:bg-warning/10"
            data-tip="Cancelar"
            onClick={onCancel}
            type="button"
          >
            <ProhibitIcon className="h-3.5 w-3.5" weight="bold" />
          </button>
        </>
      )}
      {(task.status === "completed" || task.status === "cancelled") && (
        <button
          className="btn btn-ghost btn-xs tooltip tooltip-left text-info hover:bg-info/10"
          data-tip="Reabrir"
          onClick={onReopen}
          type="button"
        >
          <ArrowCounterClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs tooltip tooltip-left text-base-content/25 hover:bg-error/10 hover:text-error"
        data-tip="Excluir"
        onClick={onDelete}
        type="button"
      >
        <TrashIcon className="h-3.5 w-3.5" weight="bold" />
      </button>
    </>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────

function TaskCard({
  task,
  onStart,
  onComplete,
  onCancel,
  onReopen,
  onDelete,
}: {
  task: TaskData;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const priority = PRIORITY_CONFIG[task.priority];
  const StatusIcon = STATUS_CONFIG[task.status].icon;
  const isDone = task.status === "completed" || task.status === "cancelled";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-base-300/60 bg-base-100 hover:border-base-300 hover:shadow-md">
      <div className={`h-1 shrink-0 ${priority.stripe}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header: status + title */}
        <div className="flex items-start gap-2.5">
          <div className="relative mt-0.5">
            <StatusIcon
              className={`h-5 w-5 shrink-0 ${STATUS_ICON_STYLE[task.status]}`}
              weight={task.status === "completed" ? "fill" : "bold"}
            />
            {task.status === "in_progress" && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-info" />
            )}
          </div>

          <span
            className={`min-w-0 flex-1 font-medium text-sm leading-snug ${
              isDone
                ? "text-base-content/35 line-through decoration-base-content/15"
                : "text-base-content"
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Description */}
        {task.description && (
          <p
            className={`line-clamp-2 text-xs leading-relaxed ${
              isDone ? "text-base-content/25" : "text-base-content/50"
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Meta: badges + date */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-md px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${PRIORITY_BADGE_STYLE[task.priority]}`}
          >
            {priority.label}
          </span>

          {task.isOverdue && (
            <span className="flex items-center gap-0.5 rounded-md bg-error/10 px-1.5 py-0.5 font-semibold text-[10px] text-error uppercase tracking-wider">
              <WarningCircleIcon className="h-3 w-3" weight="bold" />
              Atrasada
            </span>
          )}

          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                task.isOverdue
                  ? "font-medium text-error/70"
                  : "text-base-content/35"
              }`}
            >
              <CalendarBlankIcon className="h-3 w-3" />
              {formatRelativeDate(task.dueDate)}
            </span>
          )}
        </div>

        {task.cancellationReason && (
          <span className="text-[11px] text-base-content/30 italic">
            "{task.cancellationReason}"
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5 border-base-200/60 border-t px-3 py-1.5 sm:opacity-0 sm:group-hover:opacity-100">
        <TaskCardActions
          onCancel={onCancel}
          onComplete={onComplete}
          onDelete={onDelete}
          onReopen={onReopen}
          onStart={onStart}
          task={task}
        />
      </div>
    </div>
  );
}

// ─── Create Task Modal ──────────────────────────────────────────────

function CreateTaskModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      formRef.current?.reset();
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const description = (form.get("description") as string) || null;
    const priority = (form.get("priority") as TaskPriority) ?? "medium";
    const dueDateStr = form.get("dueDate") as string;
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    taskCollection.insert(
      createTask({ title, description, priority, dueDate })
    );
    onClose();
  }

  return (
    <dialog className="modal" onClose={onClose} ref={ref}>
      <div className="modal-box max-w-md border border-base-300/60 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Nova tarefa</h3>
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-base-content"
              type="submit"
            >
              <XIcon className="h-4 w-4" weight="bold" />
            </button>
          </form>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
              Título
            </legend>
            <input
              autoFocus
              className="input w-full"
              maxLength={200}
              minLength={1}
              name="title"
              placeholder="O que precisa ser feito?"
              required
              type="text"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
              Descrição
            </legend>
            <textarea
              className="textarea w-full"
              name="description"
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
            />
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                Prioridade
              </legend>
              <select
                className="select w-full"
                defaultValue="medium"
                name="priority"
              >
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                Data limite
              </legend>
              <input className="input w-full" name="dueDate" type="date" />
            </fieldset>
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              Criar tarefa
            </button>
          </div>
        </form>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button type="submit">fechar</button>
      </form>
    </dialog>
  );
}

// ─── Cancel Task Modal ──────────────────────────────────────────────

function CancelTaskModal({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (taskId && !dialog.open) {
      formRef.current?.reset();
      dialog.showModal();
    } else if (!taskId && dialog.open) {
      dialog.close();
    }
  }, [taskId]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (!taskId) {
      return;
    }
    const form = new FormData(e.currentTarget);
    const reason = form.get("reason") as string;
    taskCollection.update(taskId, (draft) =>
      cancelTaskTransition(draft, reason)
    );
    onClose();
  }

  return (
    <dialog className="modal" onClose={onClose} ref={ref}>
      <div className="modal-box max-w-md border border-base-300/60 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Cancelar tarefa</h3>
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-base-content"
              type="submit"
            >
              <XIcon className="h-4 w-4" weight="bold" />
            </button>
          </form>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
              Motivo do cancelamento
            </legend>
            <textarea
              autoFocus
              className="textarea w-full"
              minLength={1}
              name="reason"
              placeholder="Por que esta tarefa está sendo cancelada?"
              required
              rows={3}
            />
          </fieldset>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose} type="button">
              Voltar
            </button>
            <button className="btn btn-error" type="submit">
              Confirmar cancelamento
            </button>
          </div>
        </form>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button type="submit">fechar</button>
      </form>
    </dialog>
  );
}

// ─── Delete Task Modal ──────────────────────────────────────────────

function DeleteTaskModal({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (taskId && !dialog.open) {
      dialog.showModal();
    } else if (!taskId && dialog.open) {
      dialog.close();
    }
  }, [taskId]);

  function handleConfirm() {
    if (!taskId) {
      return;
    }
    taskCollection.delete(taskId);
    onClose();
  }

  return (
    <dialog className="modal" onClose={onClose} ref={ref}>
      <div className="modal-box max-w-sm border border-base-300/60 shadow-2xl">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <TrashIcon className="h-6 w-6 text-error" weight="bold" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg tracking-tight">Excluir tarefa</h3>
            <p className="text-base-content/50 text-sm">
              Essa ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="modal-action justify-center">
          <form method="dialog">
            <button className="btn btn-ghost" type="submit">
              Cancelar
            </button>
          </form>
          <button
            className="btn btn-error"
            onClick={handleConfirm}
            type="button"
          >
            Excluir
          </button>
        </div>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button type="submit">fechar</button>
      </form>
    </dialog>
  );
}

// ─── Empty State ────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
        <CheckSquareOffsetIcon
          className="h-8 w-8 text-base-content/20"
          weight="light"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-base-content/40 text-sm">
          {hasFilter
            ? "Nenhuma tarefa com este filtro"
            : "Nenhuma tarefa criada"}
        </p>
        {!hasFilter && (
          <p className="text-base-content/25 text-xs">
            Crie sua primeira tarefa para começar a organizar seu trabalho
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export function TaskPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: tasks } = useLiveQuery((q) => q.from({ task: taskCollection }));

  const filtered = useMemo(
    () =>
      tasks.filter((t) => statusFilter === "all" || t.status === statusFilter),
    [tasks, statusFilter]
  );

  const summary = useMemo(() => summarizeTasks(tasks), [tasks]);

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-base-100">
      <div className="px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 font-bold text-3xl text-base-content tracking-tight">
              <span className="text-primary">Tarefas</span>
            </h1>
            <p className="text-base-content/40 text-sm">
              {tasks.length === 0
                ? "Organize suas atividades"
                : `${tasks.length} tarefa${tasks.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm gap-1.5 shadow-primary/20 shadow-sm"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            <PlusIcon className="h-4 w-4" weight="bold" />
            Nova tarefa
          </button>
        </div>

        {/* Stats + Progress */}
        {tasks.length > 0 && (
          <div className="mb-8 flex flex-col gap-3">
            <StatsRow summary={summary} />
            <ProgressBar summary={summary} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-3 border-base-200 border-b">
          <FunnelSimpleIcon
            className="mb-2 h-3.5 w-3.5 shrink-0 text-base-content/25"
            weight="bold"
          />
          <div className="-mb-px flex gap-0.5" role="tablist">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.value === "all"
                  ? tasks.length
                  : (summary.counts[tab.value] ?? 0);
              const isActive = statusFilter === tab.value;
              return (
                <button
                  className={`relative px-3 pt-1 pb-2.5 font-medium text-xs ${
                    isActive
                      ? "text-primary"
                      : "text-base-content/40 hover:text-base-content/60"
                  }`}
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-1 tabular-nums ${isActive ? "text-primary/60" : "text-base-content/25"}`}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        {filtered.length === 0 ? (
          <EmptyState hasFilter={statusFilter !== "all"} />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                onCancel={() => setCancelTarget(task.id)}
                onComplete={() =>
                  taskCollection.update(task.id, completeTaskTransition)
                }
                onDelete={() => setDeleteTarget(task.id)}
                onReopen={() =>
                  taskCollection.update(task.id, reopenTaskTransition)
                }
                onStart={() =>
                  taskCollection.update(task.id, startTaskTransition)
                }
                task={task}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        onClose={() => setShowCreateModal(false)}
        open={showCreateModal}
      />

      <CancelTaskModal
        onClose={() => setCancelTarget(null)}
        taskId={cancelTarget}
      />

      <DeleteTaskModal
        onClose={() => setDeleteTarget(null)}
        taskId={deleteTarget}
      />
    </div>
  );
}
