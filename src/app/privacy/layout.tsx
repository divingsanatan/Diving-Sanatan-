import type { Metadata } from "next";

const TITLE = "Privacy Policy | Diving Sanatan";
const DESCRIPTION = "How Diving Sanatan collects, uses and protects your personal information when you browse, book sessions or shop.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://divingsanatan.online/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
