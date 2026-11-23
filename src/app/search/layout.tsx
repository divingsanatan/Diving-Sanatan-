import type { Metadata } from "next";

// Internal search results are endless variations of one page. Kept out of search results.
export const metadata: Metadata = {
  title: { absolute: "Search | Diving Sanatan" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
