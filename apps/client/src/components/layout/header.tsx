import { UserMenu } from "@app/auth/client/components/UserMenu";
import { Link } from "@tanstack/react-router";
import { HeaderLogo } from "@/components/ui/header-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { menuItems, NAV_ACTIVE_CLASS } from "@/routes/-navigation";

export function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-30 h-15 border-base-300 border-b bg-base-100">
        <div className="relative flex h-full items-center px-4">
          <HeaderLogo />

          <ul className="menu menu-horizontal absolute left-1/2 -translate-x-1/2 gap-1 p-0">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link
                  activeProps={{ className: NAV_ACTIVE_CLASS }}
                  className="text-secondary hover:bg-base-content/5! hover:text-base-content"
                  to={item.to}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className="h-4 w-4 shrink-0"
                        weight={isActive ? "fill" : "bold"}
                      />
                      {item.label}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
