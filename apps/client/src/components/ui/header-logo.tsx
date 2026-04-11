import icon1 from "@assets/icon-1.svg";
import logo1 from "@assets/logo-1.svg";

export function HeaderLogo({ iconOnly = false }: { iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <img alt="Alpha" className="h-7" height={420} src={icon1} width={390} />
    );
  }

  return (
    <img
      alt="Alpha Template"
      className="h-7"
      height={420}
      src={logo1}
      width={1398}
    />
  );
}
