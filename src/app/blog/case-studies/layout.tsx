import type { Metadata } from "next";

// The case studies on this page are written into the code. Until they are confirmed as real, consented client
// results, they are kept out of search: made-up or unverifiable results, especially about health, can lead to
// penalties from search engines. Remove the robots line below once they are confirmed.
export const metadata: Metadata = {
  title: { absolute: "Client Case Studies | Diving Sanatan" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
