import { LockIcon, UserIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { SignInFormProps } from "../contracts";
import { useSignIn } from "../hooks/useSignIn";

export const SignInForm = ({ onSwitchForm }: SignInFormProps) => {
  const { mutateAsync: signIn, isPending } = useSignIn();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const result = await signIn({
      identifier: formData.get("identifier") as string,
      password: formData.get("password") as string,
    });

    if (!result.success) {
      setError(result.error?.message ?? "Erro ao fazer login.");
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
        <legend className="fieldset-legend text-sm">Faça o seu login</legend>

        <label className="fieldset-label" htmlFor="sign-in-identifier">
          Usuário ou e-mail
        </label>
        <label className="input validator w-full">
          <UserIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-in-identifier"
            name="identifier"
            placeholder="Digite seu usuário ou e-mail..."
            required
            type="text"
          />
        </label>
        <p className="validator-hint hidden">
          Usuário ou e-mail é obrigatório.
        </p>

        <label className="fieldset-label" htmlFor="sign-in-password">
          Senha
        </label>
        <label className="input validator w-full">
          <LockIcon className="h-4 w-4 opacity-50" />
          <input
            disabled={isPending}
            id="sign-in-password"
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
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>

        <div className="divider">Não possui conta?</div>

        <button
          className="btn btn-ghost btn-block"
          onClick={onSwitchForm}
          type="button"
        >
          Cadastre-se
        </button>
      </fieldset>
    </form>
  );
};
