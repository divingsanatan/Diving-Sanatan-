import { redirect } from "next/navigation";

// Pillar Guides moved to Topic Guides.
export default function AdminPillarRedirect() {
  redirect("/admin/topics");
}
