import type { Metadata } from "next";

const TITLE = "Client Reviews and Experiences | Diving Sanatan";
const DESCRIPTION = "Read what clients say about their healing, meditation and energy alignment sessions with Diving Sanatan practitioners.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://divingsanatan.online/reviews" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "https://divingsanatan.online/reviews", siteName: "Diving Sanatan" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
