import AboutClient from "./AboutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Sanctuary & Spiritual Healers",
  description: "Diving Sanatan bridges ancient energy medicine and Indian beliefs with modern wellness standards. Meet our certified gurus, life coaches, and inner engineers.",
  keywords: [
    "Diving sanatan",
    "guru",
    "life coach",
    "inner engineers",
    "Indian belief",
    "way of life",
    "natural healing",
    "holistic healing",
    "energy medicine",
    "hopeful life"
  ],
  openGraph: {
    title: "Our Sanctuary & Healers | About Diving Sanatan",
    description: "Learn about the mission, values, and master healers at Diving Sanatan. Bridging ancient wisdom with modern holistic wellness.",
    url: "https://divingsanatan.com/about",
    type: "website",
  }
};

export default function Page() {
  return <AboutClient />;
}
