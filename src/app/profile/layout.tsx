import type { Metadata } from "next";

// Personal page. Not for search results.
export const metadata: Metadata = {
  title: { absolute: "Your profile | Diving Sanatan" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
