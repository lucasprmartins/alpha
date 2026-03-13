import { SignInForm } from "@app/auth/client/components/SignInForm";
import { SignUpForm } from "@app/auth/client/components/SignUpForm";
import icon1 from "@assets/icon-1.svg";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

const SESSION_EXPIRED_REASON = "session-expired";

type AuthMode = "sign-in" | "sign-up";

export function LoginPage({ reason }: { reason?: string }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-4">
        {reason === SESSION_EXPIRED_REASON && (
          <div className="alert alert-warning">
            <WarningCircleIcon className="h-5 w-5 shrink-0" />
            <span>Sua sessão expirou. Faça login novamente.</span>
          </div>
        )}
        <Link
          className="text-base-content/40 transition-colors hover:text-base-content"
          to="/"
        >
          <img
            alt="Beta"
            className="h-12 w-12"
            height={420}
            src={icon1}
            width={390}
          />
        </Link>
        {mode === "sign-in" ? (
          <SignInForm onSwitchForm={() => setMode("sign-up")} />
        ) : (
          <SignUpForm onSwitchForm={() => setMode("sign-in")} />
        )}
      </div>
    </div>
  );
}
