import { permanentRedirect } from "next/navigation";

// The topic list now lives on /blog itself.
export default function TopicsIndexRedirect() {
  permanentRedirect("/blog");
}
