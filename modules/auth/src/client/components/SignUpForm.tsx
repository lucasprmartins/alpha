import {
  EnvelopeIcon,
  LockIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { SignUpFormProps } from "../contracts";
import { useSignUp } from "../hooks/useSignUp";

export const SignUpForm = ({ onSwitchForm }: SignUpFormProps) => {
  const { mutateAsync: signUp, isPending } = useSignUp();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const result = await signUp({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });

    if (!result.success) {
      setError(result.error?.message ?? "Erro ao criar conta.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          className="alert alert-error alert-soft fixed bottom-4 left-1/2 z-50 w-auto max-w-md -translate-x-1/2 shadow-lg"
          role="alert"
        >
          <WarningCircleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <fieldset className="fieldset w-sm rounded-box bg-base-200 p-6">
        <legend className="fieldset-legend text-sm">Crie sua conta</legend>

        <label className="fieldset-label" htmlFor="sign-up-name">
          Nome
        </label>
        <label className="input validator w-full">
          <UserIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-up-name"
            name="name"
            placeholder="Digite seu nome..."
            required
            type="text"
          />
        </label>
        <p className="validator-hint hidden">Nome é obrigatório.</p>

        <label className="fieldset-label" htmlFor="sign-up-username">
          Usuário
        </label>
        <label className="input validator w-full">
          <UserIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-up-username"
            name="username"
            placeholder="Digite seu usuário..."
            required
            type="text"
          />
        </label>
        <p className="validator-hint hidden">Usuário é obrigatório.</p>

        <label className="fieldset-label" htmlFor="sign-up-email">
          E-mail
        </label>
        <label className="input validator w-full">
          <EnvelopeIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-up-email"
            name="email"
            placeholder="exemplo@email.com"
            required
            type="email"
          />
        </label>
        <p className="validator-hint hidden">Formato de e-mail inválido.</p>

        <label className="fieldset-label" htmlFor="sign-up-password">
          Senha
        </label>
        <label className="input validator w-full">
          <LockIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-up-password"
            minLength={8}
            name="password"
            placeholder="Digite sua senha..."
            required
            type="password"
          />
        </label>
        <p className="validator-hint hidden">
          Senha deve ter no mínimo 8 caracteres.
        </p>

        <button
          className="btn btn-primary btn-block mt-4"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <>
              <span className="loading loading-ring loading-xs" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </button>

        <div className="divider">Já possui conta?</div>

        <button
          className="btn btn-ghost btn-block"
          onClick={onSwitchForm}
          type="button"
        >
          Entrar
        </button>
      </fieldset>
    </form>
  );
};
