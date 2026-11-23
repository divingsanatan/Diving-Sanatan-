import ExploreServicesClient from "./ExploreServicesClient";
import ServicesIndex from "@/components/services/ServicesIndex";
import { getPublishedServices } from "@/lib/siteServer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Explore All Spiritual & Energy Services | Diving Sanatan" },
  description: "Browse our complete catalog of holistic healing services, chakra alignment sessions, aura scanning, reiki restoration, sound therapy, and transformative spiritual programs.",
  keywords: [
    "Explore healing services",
    "All spiritual services",
    "Chakra balancing",
    "Aura scanning",
    "Reiki healing catalog",
    "Sound therapy sessions",
    "Full moon healing",
    "Holistic energy programs",
    "Diving Sanatan services"
  ],
  openGraph: {
    title: "Explore All Spiritual & Energy Services | Diving Sanatan",
    description: "Discover and book expert-led healing services: Chakra Balancing, Aura Scanning, Reiki Energy restoration, Sound Healing, and Guided Spiritual Programs.",
    url: "https://divingsanatan.online/explore-services",
    type: "website",
  },
  alternates: { canonical: "https://divingsanatan.online/explore-services" },
};

export const revalidate = 300;

export default async function ExploreServicesPage() {
  const services = await getPublishedServices();
  return <ExploreServicesClient after={<ServicesIndex services={services} />} />;
}
