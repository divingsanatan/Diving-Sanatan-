import PillarListingClient from "./PillarListingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pillar Guides & Holistic Healing Paths | Diving Sanatan",
  description: "Explore our in-depth pillar guides covering chakra clearing, aura balancing, mindfulness meditation, and spiritual growth. Complete with detailed sub-articles.",
  keywords: [
    "holistic healing guides",
    "energy healing pillars",
    "mindfulness meditation tutorials",
    "chakra clearing guides",
    "spiritual growth paths",
    "divingsanatan pillars"
  ],
  openGraph: {
    title: "Pillar Guides & Holistic Healing Paths | Diving Sanatan",
    description: "Explore our in-depth pillar guides covering chakra clearing, aura balancing, mindfulness meditation, and spiritual growth.",
    url: "https://divingsanatan.com/blog/pillar",
    type: "website"
  }
};

export default function Page() {
  return <PillarListingClient />;
}
