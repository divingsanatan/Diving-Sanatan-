import ServicesClient from "./ServicesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Holistic Healing Services & Energy Programs",
  description: "Explore our professional spiritual healing services: Chakra Balancing, Aura scanning, Reiki Energy restoration, Sound Healing, and guided meditation programs. Book a consultation.",
  keywords: [
    "chakra healing services",
    "aura scanning",
    "reiki healing",
    "sound healing",
    "meditation programs",
    "spiritual counseling",
    "energy balancing",
    "holistic wellness"
  ],
  openGraph: {
    title: "Holistic Healing Services & Energy Programs | Diving Sanatan",
    description: "Explore and book our expert-led services: Chakra Balancing, Aura scanning, Reiki, Sound Healing, and personalized spiritual guidance.",
    url: "https://divingsanatan.com/services",
    type: "website",
  }
};

export default function Page() {
  return <ServicesClient />;
}
