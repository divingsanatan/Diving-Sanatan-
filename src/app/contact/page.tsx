import ContactClient from "./ContactClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Our Spiritual Healers & Guides",
  description: "Connect with Diving Sanatan Sanctuary in Bhopal. Inquire about custom retreat bookings, personal life coaching, nazar clearing, or remote chakra energy alignments.",
  keywords: [
    "Contact Diving Sanatan",
    "life coach support",
    "spiritual guru inquiry",
    "Bhopal wellness center",
    "nazar removal query",
    "urja upchaar consultation",
    "distance healing request"
  ],
  openGraph: {
    title: "Contact Our Healers & Guides | Diving Sanatan",
    description: "Get in touch with the practitioners at Diving Sanatan. Contact us for healing retreats, personal consultation times, and program inquiries.",
    url: "https://divingsanatan.com/contact",
    type: "website",
  }
};

export default function Page() {
  return <ContactClient />;
}
