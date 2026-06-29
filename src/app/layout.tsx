import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Diving Sanatan | Healing, Meditation & Energy Alignment",
    template: "%s | Diving Sanatan"
  },
  description: "Realign your mind, body, and spirit. Explore our healing blog, book energy alignment sessions, and learn mindfulness meditation practices with certified practitioners.",
  keywords: [
    "Diving sanatan",
    "hopeful life",
    "life coach",
    "guru",
    "life",
    "nazar",
    "urja tantra",
    "soul",
    "chakras",
    "urja upchaar",
    "divya",
    "Indian belief",
    "way of life",
    "natural healing",
    "holistic healing",
    "non-touch therapy",
    "inner engineers",
    "Holistic therapy",
    "Energy medicine",
    "Chakra healing therapy",
    "aura cleansing",
    "distance healing treatment",
    "Healing sanctuary",
    "Energy alignment",
    "Mindfulness meditation"
  ],
  authors: [{ name: "Diving Sanatan Team" }],
  openGraph: {
    title: "Diving Sanatan | Healing, Meditation & Energy Alignment",
    description: "Realign your mind, body, and spirit. Explore our healing blog, book energy alignment sessions, and learn mindfulness meditation practices.",
    type: "website",
    siteName: "Diving Sanatan",
  },
  metadataBase: new URL("https://divingsanatan.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        {/* Modern Ambient Luxury Golden-Teal Aura Background */}
        <div className="glow-bg">
          <div className="glow-orb-1"></div>
          <div className="glow-orb-2"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
