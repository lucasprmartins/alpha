import { auth } from "@app/auth/client";
import { Avatar } from "@app/auth/client/components/Avatar";
import { RoleBadge } from "@app/auth/client/components/RoleBadge";
import { sessionOptions } from "@app/auth/client/config";
import { ROLE_META, ROLES } from "@app/auth/client/contracts";
import {
  ArrowsClockwiseIcon,
  AtIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  EnvelopeIcon,
  LockIcon,
  PlusIcon,
  ProhibitIcon,
  UserIcon,
  UsersIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  getUserRole,
  isUserBanned,
  type UserData,
  type UserRole,
} from "@/features/Admin/contracts";
import { USERS_QUERY_KEY, usersListOptions } from "@/features/Admin/queries";
import { generateStrongPassword } from "@/utils/password";
import { useCopyToClipboard } from "@/utils/useCopyToClipboard";

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

interface BanUserModalHandle {
  open: (user: UserData) => void;
}

function BanUserModal({ ref }: { ref: React.Ref<BanUserModalHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
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
      dialogRef.current?.close();
    },
  });

  useImperativeHandle(ref, () => ({
    open(u: UserData) {
      setUser(u);
      formRef.current?.reset();
      banMutation.reset();
      dialogRef.current?.showModal();
    },
  }));

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
    <dialog className="modal" onClose={() => setUser(null)} ref={dialogRef}>
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
            <form method="dialog">
              <button className="btn btn-ghost" type="submit">
                Voltar
              </button>
            </form>
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

interface UnbanConfirmModalHandle {
  open: (user: UserData) => void;
}

function UnbanConfirmModal({
  ref,
}: {
  ref: React.Ref<UnbanConfirmModalHandle>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
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
      dialogRef.current?.close();
    },
  });

  useImperativeHandle(ref, () => ({
    open(u: UserData) {
      setUser(u);
      unbanMutation.reset();
      dialogRef.current?.showModal();
    },
  }));

  function handleConfirm() {
    if (!user) {
      return;
    }
    unbanMutation.mutate(user.id);
  }

  return (
    <dialog className="modal" onClose={() => setUser(null)} ref={dialogRef}>
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

// ─── Password Field ─────────────────────────────────────────────────

function PasswordField({
  value,
  onChange,
  onRegenerate,
  onCopy,
  copied,
}: {
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <label className="input validator w-full gap-1">
      <LockIcon className="h-4 w-4 opacity-50" />
      <input
        autoComplete="new-password"
        className="grow font-mono"
        minLength={8}
        name="password"
        onChange={(e) => onChange(e.target.value)}
        required
        type="text"
        value={value}
      />
      <button
        aria-label="Gerar nova senha"
        className="btn btn-square btn-ghost btn-xs"
        onClick={onRegenerate}
        type="button"
      >
        <ArrowsClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
      </button>
      <button
        aria-label="Copiar senha"
        className="btn btn-square btn-ghost btn-xs"
        onClick={onCopy}
        type="button"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-success" weight="bold" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" weight="bold" />
        )}
      </button>
    </label>
  );
}

// ─── Create User Success ────────────────────────────────────────────

function CreateUserSuccess({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <CheckCircleIcon className="h-8 w-8 text-success" weight="fill" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-lg tracking-tight">Usuário criado</h3>
        <p className="text-base-content/50 text-sm">{email}</p>
      </div>
      <div className="flex w-full items-center gap-2 rounded-lg bg-base-200 p-3">
        <code className="flex-1 truncate text-left font-mono text-sm">
          {password}
        </code>
        <button
          aria-label="Copiar senha"
          className="btn btn-square btn-ghost btn-sm"
          onClick={() => copy(password)}
          type="button"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-success" weight="bold" />
          ) : (
            <CopyIcon className="h-4 w-4" weight="bold" />
          )}
        </button>
      </div>
      <p className="rounded-lg bg-warning/10 p-2 text-warning text-xs">
        Copie a senha agora. Ela não será exibida novamente.
      </p>
      <button
        className="btn btn-primary btn-block"
        onClick={onClose}
        type="button"
      >
        Fechar
      </button>
    </div>
  );
}

// ─── Create User Modal ──────────────────────────────────────────────

interface CreateUserModalHandle {
  open: () => void;
}

function CreateUserModal({ ref }: { ref: React.Ref<CreateUserModalHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const { copied, copy, reset: resetCopied } = useCopyToClipboard();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      username: string;
      email: string;
      password: string;
      role: UserRole;
    }) => {
      const res = await auth.admin.createUser({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        data: {
          username: input.username,
          displayUsername: input.username,
        },
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Falha ao criar usuário");
      }
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      setCreatedUser({ email: variables.email, password: variables.password });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    },
  });

  useImperativeHandle(ref, () => ({
    open() {
      formRef.current?.reset();
      setPassword(generateStrongPassword());
      resetCopied();
      setError(null);
      setCreatedUser(null);
      createMutation.reset();
      dialogRef.current?.showModal();
    },
  }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const username = (form.get("username") as string).trim().toLowerCase();
    const email = (form.get("email") as string).trim().toLowerCase();
    const roleRaw = form.get("role");
    const role: UserRole = ROLES.includes(roleRaw as UserRole)
      ? (roleRaw as UserRole)
      : "user";
    createMutation.mutate({ name, username, email, password, role });
  }

  function handleRegenerate() {
    setPassword(generateStrongPassword());
    resetCopied();
  }

  const isPending = createMutation.isPending;

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box max-w-md border border-base-300/60 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">
            {createdUser ? "Confirmação" : "Criar usuário"}
          </h3>
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-base-content"
              type="submit"
            >
              <XIcon className="h-4 w-4" weight="bold" />
            </button>
          </form>
        </div>

        {createdUser ? (
          <CreateUserSuccess
            email={createdUser.email}
            onClose={() => dialogRef.current?.close()}
            password={createdUser.password}
          />
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <fieldset className="contents" disabled={isPending}>
              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                  Nome
                </legend>
                <label className="input validator w-full">
                  <UserIcon className="h-4 w-4 opacity-50" />
                  <input
                    autoFocus
                    minLength={1}
                    name="name"
                    placeholder="Nome completo"
                    required
                    type="text"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                  Nome de usuário
                </legend>
                <label className="input validator w-full">
                  <AtIcon className="h-4 w-4 opacity-50" />
                  <input
                    maxLength={20}
                    minLength={3}
                    name="username"
                    pattern="[a-zA-Z0-9_]+"
                    placeholder="usuario"
                    required
                    type="text"
                  />
                </label>
                <p className="validator-hint hidden">
                  3 a 20 caracteres. Apenas letras, números e _.
                </p>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                  E-mail
                </legend>
                <label className="input validator w-full">
                  <EnvelopeIcon className="h-4 w-4 opacity-50" />
                  <input
                    name="email"
                    placeholder="usuario@exemplo.com"
                    required
                    type="email"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                  Papel
                </legend>
                <select
                  className="select w-full"
                  defaultValue="user"
                  name="role"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_META[role].label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
                  Senha
                </legend>
                <PasswordField
                  copied={copied}
                  onChange={setPassword}
                  onCopy={() => copy(password)}
                  onRegenerate={handleRegenerate}
                  value={password}
                />
              </fieldset>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-error text-sm">
                  <WarningCircleIcon className="h-4 w-4" weight="bold" />
                  {error}
                </div>
              )}

              <div className="modal-action">
                <form method="dialog">
                  <button className="btn btn-ghost" type="submit">
                    Cancelar
                  </button>
                </form>
                <button className="btn btn-primary" type="submit">
                  {isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  Criar usuário
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
      <form className="modal-backdrop" method="dialog">
        <button type="submit">fechar</button>
      </form>
    </dialog>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export function AdminPage() {
  const { data: users, isPending } = useQuery(usersListOptions);
  const { data: session } = useQuery(sessionOptions);
  const currentUserId = session?.user.id;

  const banModalRef = useRef<BanUserModalHandle>(null);
  const unbanModalRef = useRef<UnbanConfirmModalHandle>(null);
  const createModalRef = useRef<CreateUserModalHandle>(null);

  const sortedUsers = useMemo(() => {
    if (!users) {
      return;
    }
    return [...users].sort((a, b) => {
      const aRole = getUserRole(a);
      const bRole = getUserRole(b);
      if (aRole !== bRole) {
        return aRole === "admin" ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [users]);

  const total = users?.length ?? 0;
  const activeCount = users?.filter((u) => !isUserBanned(u)).length ?? 0;
  const bannedCount = total - activeCount;

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-base-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-1 font-bold text-3xl text-base-content tracking-tight">
            <span className="text-primary">Administração</span>
          </h1>
          <p className="text-base-content/40 text-sm">
            Painel de configurações e gestão da plataforma.
          </p>
        </div>

        <section>
          <div className="mb-4 flex items-end justify-between border-base-300/60 border-b pb-3">
            <div>
              <h2 className="font-semibold text-base-content text-lg tracking-tight">
                Usuários
              </h2>
              <p className="text-base-content/40 text-xs">
                {total === 0
                  ? "Gerencie quem tem acesso à plataforma"
                  : `${total} usuário${total === 1 ? "" : "s"} · ${activeCount} ativo${activeCount === 1 ? "" : "s"}${bannedCount > 0 ? ` · ${bannedCount} banido${bannedCount === 1 ? "" : "s"}` : ""}`}
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm gap-1.5 shadow-primary/20 shadow-sm"
              onClick={() => createModalRef.current?.open()}
              type="button"
            >
              <PlusIcon className="h-4 w-4" weight="bold" />
              Criar usuário
            </button>
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
                  {sortedUsers?.map((user) => (
                    <UserRow
                      isCurrentUser={user.id === currentUserId}
                      key={user.id}
                      onBan={() => banModalRef.current?.open(user)}
                      onUnban={() => unbanModalRef.current?.open(user)}
                      user={user}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <BanUserModal ref={banModalRef} />
      <UnbanConfirmModal ref={unbanModalRef} />
      <CreateUserModal ref={createModalRef} />
    </div>
  );
}
