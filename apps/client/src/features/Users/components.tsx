import { auth } from "@app/auth/client";
import { Avatar } from "@app/auth/client/components/Avatar";
import { RoleBadge } from "@app/auth/client/components/RoleBadge";
import { sessionOptions } from "@app/auth/client/config";
import { ROLE_META, ROLES } from "@app/auth/client/contracts";
import {
  CaretDownIcon,
  CheckCircleIcon,
  ProhibitIcon,
  UsersIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getUserRole,
  isUserBanned,
  type UserData,
  type UserRole,
} from "@/features/Users/contracts";
import { USERS_QUERY_KEY, usersListOptions } from "@/features/Users/queries";

// ─── Helpers ────────────────────────────────────────────────────────

function StatusBadge({ banned }: { banned: boolean }) {
  if (banned) {
    return (
      <span className="badge badge-soft badge-error gap-1 font-medium">
        <ProhibitIcon className="h-3 w-3" weight="bold" />
        Inativo
      </span>
    );
  }
  return (
    <span className="badge badge-soft badge-success gap-1 font-medium">
      <CheckCircleIcon className="h-3 w-3" weight="bold" />
      Ativo
    </span>
  );
}

function useStickyValue<T>(value: T | null): T | null {
  const ref = useRef(value);
  if (value) {
    ref.current = value;
  }
  return value ?? ref.current;
}

// ─── Ban Modal ──────────────────────────────────────────────────────

function BanUserModal({
  user,
  onClose,
}: {
  user: UserData | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const displayUser = useStickyValue(user);
  const queryClient = useQueryClient();

  const banMutation = useMutation({
    mutationFn: async (vars: { userId: string; banReason: string }) => {
      const res = await auth.admin.banUser({
        userId: vars.userId,
        banReason: vars.banReason,
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao banir usuário");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      onClose();
    },
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (user && !dialog.open) {
      formRef.current?.reset();
      banMutation.reset();
      dialog.showModal();
    } else if (!user && dialog.open) {
      dialog.close();
    }
  }, [user, banMutation.reset]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (!user) {
      return;
    }
    const form = new FormData(e.currentTarget);
    const reason = (form.get("reason") as string).trim();
    banMutation.mutate({ userId: user.id, banReason: reason });
  }

  return (
    <dialog className="modal" onClose={onClose} ref={ref}>
      <div className="modal-box max-w-md border border-base-300/60 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Inativar usuário</h3>
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-base-content"
              type="submit"
            >
              <XIcon className="h-4 w-4" weight="bold" />
            </button>
          </form>
        </div>

        {displayUser && (
          <div className="mb-5 flex items-center gap-3 rounded-lg bg-base-200/50 p-3">
            <Avatar image={displayUser.image} name={displayUser.name} />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{displayUser.name}</span>
              <span className="text-base-content/50 text-xs">
                {displayUser.email}
              </span>
            </div>
          </div>
        )}

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
              Motivo da inativação
            </legend>
            <textarea
              autoFocus
              className="textarea w-full"
              minLength={1}
              name="reason"
              placeholder="Por que este usuário está sendo inativado?"
              required
              rows={3}
            />
          </fieldset>

          {banMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-error text-sm">
              <WarningCircleIcon className="h-4 w-4" weight="bold" />
              {banMutation.error.message}
            </div>
          )}

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose} type="button">
              Voltar
            </button>
            <button
              className="btn btn-error"
              disabled={banMutation.isPending}
              type="submit"
            >
              {banMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}
              Confirmar inativação
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

// ─── Unban Confirm ──────────────────────────────────────────────────

function UnbanConfirmModal({
  user,
  onClose,
}: {
  user: UserData | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const displayUser = useStickyValue(user);
  const queryClient = useQueryClient();

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await auth.admin.unbanUser({ userId });
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao desbanir usuário");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      onClose();
    },
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (user && !dialog.open) {
      unbanMutation.reset();
      dialog.showModal();
    } else if (!user && dialog.open) {
      dialog.close();
    }
  }, [user, unbanMutation.reset]);

  function handleConfirm() {
    if (!user) {
      return;
    }
    unbanMutation.mutate(user.id);
  }

  return (
    <dialog className="modal" onClose={onClose} ref={ref}>
      <div className="modal-box max-w-sm border border-base-300/60 shadow-2xl">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircleIcon className="h-6 w-6 text-success" weight="bold" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg tracking-tight">Ativar usuário</h3>
            <p className="text-base-content/50 text-sm">
              {displayUser?.name} poderá acessar a plataforma novamente.
            </p>
          </div>
          {unbanMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-error/10 p-2 text-error text-xs">
              <WarningCircleIcon className="h-4 w-4" weight="bold" />
              {unbanMutation.error.message}
            </div>
          )}
        </div>

        <div className="modal-action justify-center">
          <form method="dialog">
            <button className="btn btn-ghost" type="submit">
              Cancelar
            </button>
          </form>
          <button
            className="btn btn-success"
            disabled={unbanMutation.isPending}
            onClick={handleConfirm}
            type="button"
          >
            {unbanMutation.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Ativar
          </button>
        </div>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button type="submit">fechar</button>
      </form>
    </dialog>
  );
}

// ─── Role Selector ──────────────────────────────────────────────────

function RoleSelector({
  user,
  disabled,
}: {
  user: UserData;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const currentRole = getUserRole(user);

  const setRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const res = await auth.admin.setRole({ userId: user.id, role });
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao alterar papel");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  if (disabled) {
    return <RoleBadge role={currentRole} />;
  }

  const isPending = setRoleMutation.isPending;

  return (
    <RolePopover
      currentRole={currentRole}
      isPending={isPending}
      onSelect={(role) => {
        if (role !== currentRole) {
          setRoleMutation.mutate(role);
        }
      }}
    />
  );
}

// ─── Role Popover (portal) ──────────────────────────────────────────

function RolePopover({
  currentRole,
  isPending,
  onSelect,
}: {
  currentRole: UserRole;
  isPending: boolean;
  onSelect: (role: UserRole) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 160),
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = ROLE_META[currentRole];

  return (
    <>
      <button
        className={`${current.badgeClass} cursor-pointer transition-opacity hover:opacity-80 ${isPending ? "pointer-events-none opacity-60" : ""}`}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        ref={triggerRef}
        type="button"
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <current.icon className="h-3 w-3" weight="bold" />
        )}
        {current.label}
        <CaretDownIcon className="h-3 w-3 opacity-60" weight="bold" />
      </button>
      {open &&
        createPortal(
          <ul
            className="menu fixed z-50 rounded-lg border border-base-300/60 bg-base-100 p-1 shadow-lg"
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          >
            {ROLES.map((role) => {
              const meta = ROLE_META[role];
              const isCurrent = role === currentRole;
              return (
                <li key={role}>
                  <button
                    className={`flex items-center gap-2 ${isCurrent ? "active" : ""}`}
                    onClick={() => {
                      onSelect(role);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <meta.icon
                      className={`h-3.5 w-3.5 ${role === "admin" ? "text-primary" : "text-base-content/60"}`}
                      weight="bold"
                    />
                    <span className="text-xs">{meta.label}</span>
                    {isCurrent && (
                      <CheckCircleIcon
                        className="ml-auto h-3.5 w-3.5 text-success"
                        weight="bold"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}

// ─── Empty / Error ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
        <UsersIcon className="h-8 w-8 text-base-content/20" weight="light" />
      </div>
      <p className="font-medium text-base-content/40 text-sm">
        Nenhum usuário cadastrado
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={`skeleton-${i}`}>
          <td colSpan={6}>
            <div className="skeleton h-10 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Row Action ─────────────────────────────────────────────────────

function RowAction({
  isCurrentUser,
  banned,
  onBan,
  onUnban,
}: {
  isCurrentUser: boolean;
  banned: boolean;
  onBan: () => void;
  onUnban: () => void;
}) {
  if (isCurrentUser) {
    return <span className="text-base-content/30 text-xs">—</span>;
  }
  if (banned) {
    return (
      <button
        className="btn btn-ghost btn-xs gap-1 text-success hover:bg-success/10"
        onClick={onUnban}
        type="button"
      >
        <CheckCircleIcon className="h-3.5 w-3.5" weight="bold" />
        Ativar
      </button>
    );
  }
  return (
    <button
      className="btn btn-ghost btn-xs gap-1 text-error hover:bg-error/10"
      onClick={onBan}
      type="button"
    >
      <ProhibitIcon className="h-3.5 w-3.5" weight="bold" />
      Inativar
    </button>
  );
}

// ─── User Row ───────────────────────────────────────────────────────

function UserRow({
  user,
  isCurrentUser,
  onBan,
  onUnban,
}: {
  user: UserData;
  isCurrentUser: boolean;
  onBan: () => void;
  onUnban: () => void;
}) {
  const banned = isUserBanned(user);

  return (
    <tr className="hover:bg-base-200/40">
      <td>
        <div className="flex items-center gap-3">
          <Avatar image={user.image} name={user.name} />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {user.name}
              {isCurrentUser && (
                <span className="ml-2 font-medium text-base-content/40 text-xs">
                  (você)
                </span>
              )}
            </span>
            {user.banReason && banned && (
              <span className="text-error/70 text-xs italic">
                "{user.banReason}"
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="font-mono text-base-content/60 text-xs">
        @{user.username ?? "—"}
      </td>
      <td className="text-base-content/70 text-sm">{user.email}</td>
      <td>
        <RoleSelector disabled={isCurrentUser} user={user} />
      </td>
      <td>
        <StatusBadge banned={banned} />
      </td>
      <td>
        <RowAction
          banned={banned}
          isCurrentUser={isCurrentUser}
          onBan={onBan}
          onUnban={onUnban}
        />
      </td>
    </tr>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export function UsersPage() {
  const { data: users, isPending } = useQuery(usersListOptions);
  const { data: session } = useQuery(sessionOptions);
  const currentUserId = session?.user.id;

  const [banTarget, setBanTarget] = useState<UserData | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<UserData | null>(null);

  const total = users?.length ?? 0;
  const activeCount = users?.filter((u) => !isUserBanned(u)).length ?? 0;
  const bannedCount = total - activeCount;

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-base-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 font-bold text-3xl text-base-content tracking-tight">
              <span className="text-primary">Usuários</span>
            </h1>
            <p className="text-base-content/40 text-sm">
              {total === 0
                ? "Gerencie quem tem acesso à plataforma"
                : `${total} usuário${total === 1 ? "" : "s"} · ${activeCount} ativo${activeCount === 1 ? "" : "s"}${bannedCount > 0 ? ` · ${bannedCount} banido${bannedCount === 1 ? "" : "s"}` : ""}`}
            </p>
          </div>
        </div>

        {users && users.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300/60">
            <table className="table">
              <thead>
                <tr className="text-base-content/40">
                  <th>Nome</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isPending && <LoadingRows />}
                {users?.map((user) => (
                  <UserRow
                    isCurrentUser={user.id === currentUserId}
                    key={user.id}
                    onBan={() => setBanTarget(user)}
                    onUnban={() => setUnbanTarget(user)}
                    user={user}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BanUserModal onClose={() => setBanTarget(null)} user={banTarget} />
      <UnbanConfirmModal
        onClose={() => setUnbanTarget(null)}
        user={unbanTarget}
      />
    </div>
  );
}
