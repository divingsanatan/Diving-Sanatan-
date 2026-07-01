import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Healing, Meditation & Energy Alignment Sanctuary | Diving Sanatan",
  description: "Diving Sanatan is a sacred sanctuary for holistic healing, reiki, sound balancing, and mindfulness meditation. Take our interactive somatic energy quiz to start your healing journey.",
  keywords: [
    "Diving sanatan",
    "hopeful life",
    "life coach",
    "guru",
    "nazar",
    "urja tantra",
    "soul",
    "chakras",
    "urja upchaar",
    "divya",
    "Indian belief",
    "way of life",
    "natural healing",
    "holistic healing",
    "non-touch therapy",
    "inner engineers",
    "Holistic therapy",
    "Energy medicine",
    "Chakra healing therapy",
    "aura cleansing",
    "distance healing treatment"
  ],
  openGraph: {
    title: "Diving Sanatan | Healing, Meditation & Energy Alignment",
    description: "Realign your mind, body, and spirit. Take our interactive somatic energy quiz to map your chakras and find healing guidance.",
    url: "https://divingsanatan.com",
    type: "website",
  }
};

export default function Page() {
  return <HomeClient />;
}
