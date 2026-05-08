import { ROLE_META, type UserRole } from "../contracts";

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={meta.badgeClass}>
      <meta.icon className="h-3 w-3" weight="bold" />
      {meta.label}
    </span>
  );
}
