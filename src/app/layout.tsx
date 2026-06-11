import type { Metadata } from "next";
import { Outfit, Cinzel } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "Diving Sanatan | Healing, Meditation & Energy Alignment",
  description: "Realign your mind, body, and spirit. Book high-fidelity Aura Balancing, Crystal Healing, and Chakra Clearing sessions with certified spiritual practitioners.",
  keywords: ["Aura Balancing", "Crystal Healing", "Chakra Clearing", "Spiritual Counseling", "Energy Healing", "Next.js Wellness Portal"],
  authors: [{ name: "Diving Sanatan Team" }],
  openGraph: {
    title: "Diving Sanatan | Healing, Meditation & Energy Alignment",
    description: "Realign your mind, body, and spirit. Book custom guided therapy and aura balance sessions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${cinzel.variable}`} data-theme="dark">
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
