import ServicesClient from "./ServicesClient";
import ServicesIndex from "@/components/services/ServicesIndex";
import { getPublishedServices } from "@/lib/siteServer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Holistic Healing Services & Energy Programs",
  description: "Explore our professional spiritual healing services: Chakra Balancing, Aura scanning, Reiki Energy restoration, Sound Healing, and guided meditation programs. Book a consultation.",
  keywords: [
    "Chakra healing therapy",
    "aura cleansing",
    "distance healing treatment",
    "urja upchaar",
    "non-touch therapy",
    "nazar",
    "urja tantra",
    "holistic therapy",
    "energy medicine",
    "natural healing",
    "inner engineers",
    "chakra healing services",
    "aura scanning",
    "reiki healing",
    "sound healing"
  ],
  openGraph: {
    title: "Holistic Healing Services & Energy Programs | Diving Sanatan",
    description: "Explore and book our expert-led services: Chakra Balancing, Aura scanning, Reiki, Sound Healing, and personalized spiritual guidance.",
    url: "https://divingsanatan.online/services",
    type: "website",
  },
  alternates: { canonical: "https://divingsanatan.online/services" },
};

// The service list is also built on the server, so every service page is linked in the HTML.
export const revalidate = 300;

export default async function Page() {
  const services = await getPublishedServices();
  return <ServicesClient after={<ServicesIndex services={services} />} />;
}
