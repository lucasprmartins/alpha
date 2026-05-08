import type { Icon } from "@phosphor-icons/react";
import {
  CheckSquareOffsetIcon,
  HouseIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

export interface MenuItem {
  icon: Icon;
  label: string;
  to: string;
}

const baseItems: MenuItem[] = [
  { label: "Dashboard", icon: HouseIcon, to: "/dashboard" },
  { label: "Tarefas", icon: CheckSquareOffsetIcon, to: "/tasks" },
];

const adminItems: MenuItem[] = [
  { label: "Administração", icon: ShieldCheckIcon, to: "/admin" },
];

export function getMenuItems(role?: string | null): MenuItem[] {
  if (role === "admin") {
    return [...baseItems, ...adminItems];
  }
  return baseItems;
}

export const NAV_ACTIVE_CLASS =
  "!bg-primary/20 !text-primary font-bold hover:!bg-primary/10 hover:!text-secondary";
