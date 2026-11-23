import ExploreServicesClient from "@/app/explore-services/ExploreServicesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Explore All Healing Services | Diving Sanatan" },
  robots: { index: false, follow: true },
  alternates: { canonical: "https://divingsanatan.online/explore-services" },
  description: "Browse all holistic healing, chakra balancing, aura scanning, and reiki programs offered by Diving Sanatan.",
};

export default function ServicesExplorePage() {
  return <ExploreServicesClient />;
}
