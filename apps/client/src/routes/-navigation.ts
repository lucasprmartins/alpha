import type { Icon } from "@phosphor-icons/react";
import {
  CheckSquareOffsetIcon,
  HouseIcon,
  UsersIcon,
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
  { label: "Usuários", icon: UsersIcon, to: "/users" },
];

export function getMenuItems(role?: string | null): MenuItem[] {
  if (role === "admin") {
    return [...baseItems, ...adminItems];
  }
  return baseItems;
}

export const NAV_ACTIVE_CLASS =
  "!bg-primary/20 !text-primary font-bold hover:!bg-primary/10 hover:!text-secondary";
