import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/Profile/components";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfilePage,
});
