import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Healing, Meditation & Energy Alignment Sanctuary | Diving Sanatan",
  description: "Diving Sanatan is a sacred sanctuary for holistic healing, reiki, sound balancing, and mindfulness meditation. Take our interactive somatic energy quiz to start your healing journey.",
  keywords: [
    "healing sanctuary",
    "energy alignment",
    "mindfulness meditation",
    "chakra balancing",
    "somatic healing",
    "reiki healing",
    "sound healing",
    "mental clarity",
    "spiritual growth"
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
