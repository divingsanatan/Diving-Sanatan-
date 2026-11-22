import { permanentRedirect } from "next/navigation";

// The old Pillar Blog list is replaced by the topic guides on /blog.
export default function PillarRedirect() {
  permanentRedirect("/blog");
}
