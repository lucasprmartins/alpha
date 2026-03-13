import { MoonIcon, SunIcon } from "@phosphor-icons/react";

const sizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = sizes[size];

  return (
    <label className="swap swap-rotate">
      <input className="theme-controller" type="checkbox" value="dark" />
      <SunIcon className={`swap-off ${iconSize}`} weight="bold" />
      <MoonIcon className={`swap-on ${iconSize}`} weight="bold" />
    </label>
  );
}
