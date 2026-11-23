import type { Metadata } from "next";

// Personal booking steps. Not for search results.
export const metadata: Metadata = {
  title: { absolute: "Book a session | Diving Sanatan" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
