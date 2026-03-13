import { CaretDownIcon, SignOutIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { sessionOptions } from "../config";
import { useSignOut } from "../hooks/useSignOut";

export const UserMenu = () => {
  const { data: session } = useQuery(sessionOptions);
  const { mutate: signOut, isPending } = useSignOut();

  const user = session?.user;
  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = () => {
    (document.activeElement as HTMLElement)?.blur();
    signOut();
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        className="btn btn-ghost h-10 min-h-10 gap-2 px-2"
        tabIndex={0}
        type="button"
      >
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full bg-primary/10 text-primary">
            <span className="font-semibold text-xs">{initials}</span>
          </div>
        </div>
        <span className="hidden font-medium text-sm sm:block">
          {user.username ?? user.name}
        </span>
        <CaretDownIcon className="h-3 w-3 opacity-40" weight="bold" />
      </button>

      <div className="dropdown-content z-50 mt-1 w-56 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg">
        <div className="border-base-300 border-b px-4 py-3">
          <p className="font-semibold text-base-content text-sm">{user.name}</p>
          {user.username && (
            <p className="text-base-content/50 text-xs">@{user.username}</p>
          )}
          <p className="mt-0.5 text-base-content/40 text-xs">{user.email}</p>
        </div>

        <div className="p-2">
          <button
            className="btn btn-soft btn-error btn-sm btn-block justify-start"
            disabled={isPending}
            onClick={handleSignOut}
            type="button"
          >
            {isPending ? (
              <span className="loading loading-ring loading-xs" />
            ) : (
              <SignOutIcon className="h-4 w-4" weight="bold" />
            )}
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
