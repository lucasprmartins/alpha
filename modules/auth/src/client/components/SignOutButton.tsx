import { SignOutIcon } from "@phosphor-icons/react";
import type { SignOutButtonProps } from "../contracts";
import { useSignOut } from "../hooks/useSignOut";

export const SignOutButton = ({ disabled, ...props }: SignOutButtonProps) => {
  const { mutate: signOut, isPending } = useSignOut();

  return (
    <button
      className="btn btn-ghost btn-circle"
      disabled={disabled || isPending}
      onClick={() => signOut()}
      {...props}
    >
      {isPending ? (
        <span className="loading loading-ring loading-xs" />
      ) : (
        <SignOutIcon className="h-5 w-5" />
      )}
    </button>
  );
};
