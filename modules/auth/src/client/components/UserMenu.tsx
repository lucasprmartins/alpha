import {
  ShieldCheckIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { sessionOptions } from "../config";
import { isAdmin } from "../contracts";
import { useSignOut } from "../hooks/useSignOut";
import { Avatar } from "./Avatar";

const blurActive = () => (document.activeElement as HTMLElement)?.blur();

export const UserMenu = () => {
  const { data: session } = useQuery(sessionOptions);
  const { mutate: signOut, isPending } = useSignOut();

  const user = session?.user;
  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    blurActive();
    signOut();
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        aria-label="Menu do usuário"
        className="cursor-pointer transition-opacity hover:opacity-80"
        type="button"
      >
        <Avatar image={user.image} name={user.name} ring size="sm" />
      </button>

      <ul className="dropdown-content menu z-50 mt-2 w-44 rounded-xl border border-base-300/60 bg-base-100 p-1 shadow-lg">
        <li>
          <Link
            className="flex items-center gap-2"
            onClick={blurActive}
            to="/profile"
          >
            <UserCircleIcon className="h-4 w-4" weight="bold" />
            <span className="text-sm">Perfil</span>
          </Link>
        </li>
        {isAdmin(user.role) && (
          <li>
            <Link
              className="flex items-center gap-2"
              onClick={blurActive}
              to="/admin"
            >
              <ShieldCheckIcon className="h-4 w-4" weight="bold" />
              <span className="text-sm">Administração</span>
            </Link>
          </li>
        )}
        <li className="mt-1 border-base-300/60 border-t pt-1">
          <button
            className="flex items-center gap-2 bg-error/10 text-error hover:bg-error/20"
            disabled={isPending}
            onClick={handleSignOut}
            type="button"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <SignOutIcon className="h-4 w-4" weight="bold" />
            )}
            <span className="text-sm">Sair</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
