import BlogListingClient from "./BlogListingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spiritual Healing, Energy & Mindfulness Blog",
  description: "Explore our collection of articles, insights, and wisdom. Learn about chakra balancing, aura energy fields, reiki healing, and somatic mindfulness techniques.",
  keywords: [
    "spiritual healing blog",
    "energy healing articles",
    "mindfulness meditation blog",
    "chakra alignment tips",
    "reiki healing wisdom",
    "somatic wellness articles",
    "divingsanatan blog"
  ],
  openGraph: {
    title: "Spiritual Healing, Energy & Mindfulness Blog | Diving Sanatan",
    description: "Explore wisdom, practices, and real stories to elevate your healing journey. Read our articles on chakras, meditation, and energy medicine.",
    url: "https://divingsanatan.com/blog",
    type: "website",
  }
};

export default function Page() {
  return <BlogListingClient />;
}
