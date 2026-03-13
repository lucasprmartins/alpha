import type { Icon } from "@phosphor-icons/react";
import {
  CheckCircleIcon,
  CircleDashedIcon,
  ProhibitIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type StatusFilter = "all" | TaskStatus;

export interface TaskData {
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
  isOverdue: boolean;
  isActive: boolean;
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; badge: string; icon: Icon }
> = {
  pending: {
    label: "Pendente",
    badge: "badge-ghost",
    icon: CircleDashedIcon,
  },
  in_progress: {
    label: "Em progresso",
    badge: "badge-info",
    icon: SpinnerGapIcon,
  },
  completed: {
    label: "Concluída",
    badge: "badge-success",
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: "Cancelada",
    badge: "badge-error",
    icon: ProhibitIcon,
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; stripe: string; badge: string }
> = {
  low: { label: "Baixa", stripe: "bg-base-300", badge: "badge-ghost" },
  medium: { label: "Média", stripe: "bg-info", badge: "badge-info" },
  high: { label: "Alta", stripe: "bg-warning", badge: "badge-warning" },
  urgent: { label: "Urgente", stripe: "bg-error", badge: "badge-error" },
};

export const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "in_progress", label: "Em progresso" },
  { value: "completed", label: "Concluídas" },
  { value: "cancelled", label: "Canceladas" },
];
