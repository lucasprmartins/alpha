import { Avatar } from "@app/auth/client/components/Avatar";
import { RoleBadge } from "@app/auth/client/components/RoleBadge";
import { sessionOptions } from "@app/auth/client/config";
import { toUserRole } from "@app/auth/client/contracts";
import { useChangePassword } from "@app/auth/client/hooks/useChangePassword";
import { useUpdateUser } from "@app/auth/client/hooks/useUpdateUser";
import {
  AtIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  LockIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

// ─── Feedback ───────────────────────────────────────────────────────

interface Feedback {
  kind: "success" | "error";
  message: string;
}

function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  return {
    feedback,
    clear: () => setFeedback(null),
    success: (message: string) => setFeedback({ kind: "success", message }),
    error: (message: string) => setFeedback({ kind: "error", message }),
  };
}

function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) {
    return null;
  }
  const isSuccess = feedback.kind === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
        isSuccess ? "bg-success/10 text-success" : "bg-error/10 text-error"
      }`}
    >
      {isSuccess ? (
        <CheckCircleIcon className="h-4 w-4" weight="bold" />
      ) : (
        <WarningCircleIcon className="h-4 w-4" weight="bold" />
      )}
      {feedback.message}
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────

function ProfileHero({
  name,
  email,
  image,
  role,
}: {
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}) {
  return (
    <div className="mb-8 flex items-center gap-5 rounded-2xl border border-base-300/60 bg-base-100 p-6">
      <Avatar image={image} name={name} ring size="lg" />
      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-2xl text-base-content tracking-tight">
          {name}
        </h2>
        <p className="text-base-content/50 text-sm">{email}</p>
        <div className="mt-1 w-fit">
          <RoleBadge role={toUserRole(role)} />
        </div>
      </div>
    </div>
  );
}

// ─── Personal Info Card ─────────────────────────────────────────────

function PersonalInfoCard({
  initialName,
  initialUsername,
  email,
}: {
  initialName: string;
  initialUsername: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const fb = useFeedback();
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const isDirty = name !== initialName || username !== initialUsername;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fb.clear();
    try {
      const payload: { name?: string; username?: string } = {};
      if (name !== initialName) {
        payload.name = name.trim();
      }
      if (username !== initialUsername) {
        payload.username = username.trim().toLowerCase();
      }
      await updateUser(payload);
      fb.success("Perfil atualizado.");
    } catch (err) {
      fb.error(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  return (
    <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
      <header className="mb-5">
        <h3 className="font-semibold text-base-content text-lg tracking-tight">
          Informações pessoais
        </h3>
        <p className="text-base-content/50 text-xs">
          Atualize seu nome e nome de usuário. O e-mail não pode ser alterado.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
            Nome
          </legend>
          <label className="input validator w-full">
            <UserIcon className="h-4 w-4 opacity-50" />
            <input
              disabled={isPending}
              minLength={1}
              name="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              type="text"
              value={name}
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
              disabled={isPending}
              maxLength={20}
              minLength={3}
              name="username"
              onChange={(e) => setUsername(e.target.value)}
              pattern="[a-zA-Z0-9_]+"
              placeholder="usuario"
              required
              type="text"
              value={username}
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
          <label className="input w-full opacity-60">
            <EnvelopeIcon className="h-4 w-4 opacity-50" />
            <input disabled type="email" value={email} />
          </label>
        </fieldset>

        <FeedbackBanner feedback={fb.feedback} />

        <div className="mt-2 flex justify-end">
          <button
            className="btn btn-primary btn-sm gap-2"
            disabled={!isDirty || isPending}
            type="submit"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Salvar alterações
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Change Password Card ───────────────────────────────────────────

function ChangePasswordCard() {
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const fb = useFeedback();
  const formRef = useRef<HTMLFormElement>(null);
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fb.clear();

    const data = new FormData(e.currentTarget);
    const currentPassword = data.get("currentPassword") as string;
    const newPassword = data.get("newPassword") as string;
    const confirmPassword = data.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      fb.error("A confirmação não confere com a nova senha.");
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });
      formRef.current?.reset();
      fb.success(
        revokeOtherSessions
          ? "Senha alterada. Outras sessões foram encerradas."
          : "Senha alterada."
      );
    } catch (err) {
      fb.error(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  return (
    <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
      <header className="mb-5">
        <h3 className="font-semibold text-base-content text-lg tracking-tight">
          Alterar senha
        </h3>
        <p className="text-base-content/50 text-xs">
          Use uma senha forte que não seja reutilizada em outros serviços.
        </p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <fieldset className="fieldset">
          <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
            Senha atual
          </legend>
          <label className="input validator w-full">
            <LockIcon className="h-4 w-4 opacity-50" />
            <input
              autoComplete="current-password"
              disabled={isPending}
              name="currentPassword"
              placeholder="Sua senha atual"
              required
              type="password"
            />
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
            Nova senha
          </legend>
          <label className="input validator w-full">
            <LockIcon className="h-4 w-4 opacity-50" />
            <input
              autoComplete="new-password"
              disabled={isPending}
              minLength={8}
              name="newPassword"
              placeholder="Mínimo de 8 caracteres"
              required
              type="password"
            />
          </label>
          <p className="validator-hint hidden">
            Senha deve ter no mínimo 8 caracteres.
          </p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend font-semibold text-base-content/40 text-xs uppercase tracking-wider">
            Confirmar nova senha
          </legend>
          <label className="input validator w-full">
            <LockIcon className="h-4 w-4 opacity-50" />
            <input
              autoComplete="new-password"
              disabled={isPending}
              minLength={8}
              name="confirmPassword"
              placeholder="Repita a nova senha"
              required
              type="password"
            />
          </label>
        </fieldset>

        <label className="label cursor-pointer justify-start gap-3">
          <input
            checked={revokeOtherSessions}
            className="checkbox checkbox-sm checkbox-primary"
            disabled={isPending}
            onChange={(e) => setRevokeOtherSessions(e.target.checked)}
            type="checkbox"
          />
          <span className="label-text text-sm">
            Encerrar sessões em outros dispositivos
          </span>
        </label>

        <FeedbackBanner feedback={fb.feedback} />

        <div className="mt-2 flex justify-end">
          <button
            className="btn btn-primary btn-sm gap-2"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Alterar senha
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const { data: session } = useQuery(sessionOptions);
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-base-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="mb-1 font-bold text-3xl text-base-content tracking-tight">
            <span className="text-primary">Perfil</span>
          </h1>
          <p className="text-base-content/40 text-sm">
            Gerencie suas informações pessoais e segurança da conta.
          </p>
        </div>

        <ProfileHero
          email={user.email}
          image={user.image}
          name={user.name}
          role={user.role}
        />

        <div className="flex flex-col gap-6">
          <PersonalInfoCard
            email={user.email}
            initialName={user.name}
            initialUsername={user.username ?? ""}
            key={`${user.id}-${user.name}-${user.username}`}
          />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
