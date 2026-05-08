import { getInitials } from "../utils";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "w-9",
  md: "w-12",
  lg: "w-20",
};

const TEXT_SIZE: Record<AvatarSize, string> = {
  sm: "text-xs",
  md: "text-base",
  lg: "text-2xl",
};

const IMG_SIZE: Record<AvatarSize, number> = {
  sm: 36,
  md: 48,
  lg: 80,
};

export function Avatar({
  name,
  image,
  size = "sm",
  ring = false,
}: {
  name: string;
  image?: string | null;
  size?: AvatarSize;
  ring?: boolean;
}) {
  if (image) {
    const px = IMG_SIZE[size];
    return (
      <img
        alt={name}
        className={`${SIZE_CLASS[size]} aspect-square rounded-full object-cover`}
        height={px}
        src={image}
        width={px}
      />
    );
  }

  const ringClass = ring
    ? "ring-1 ring-base-300/60 ring-offset-2 ring-offset-base-100"
    : "";

  return (
    <div className="avatar avatar-placeholder">
      <div
        className={`${SIZE_CLASS[size]} rounded-full bg-primary/10 text-primary ${ringClass}`}
      >
        <span className={`font-semibold ${TEXT_SIZE[size]}`}>
          {getInitials(name)}
        </span>
      </div>
    </div>
  );
}
