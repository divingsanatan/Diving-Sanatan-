import type { Metadata } from "next";

// Comparison pages currently have no data behind them (the comparison_pages table does not exist), so they would be empty pages.
export const metadata: Metadata = {
  title: { absolute: "Comparisons | Diving Sanatan" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
