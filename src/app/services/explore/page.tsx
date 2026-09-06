import ExploreServicesClient from "@/app/explore-services/ExploreServicesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore All Healing Services | Diving Sanatan",
  description: "Browse all holistic healing, chakra balancing, aura scanning, and reiki programs offered by Diving Sanatan.",
};

export default function ServicesExplorePage() {
  return <ExploreServicesClient />;
}
