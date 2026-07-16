import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import StyledJsxRegistry from "./registry";

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
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Sanatan Dharma",
              "url": "https://divingsanatan.online/",
              "logo": "https://divingsanatan.online/logo.svg"
            })
          }}
        />
      </head>
      <body>
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ECVGN8V7JC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ECVGN8V7JC');
          `}
        </Script>

        {/* Meta Pixel Code */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1487847872301741');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1487847872301741&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {/* Modern Ambient Luxury Golden-Teal Aura Background */}
        <div className="glow-bg">
          <div className="glow-orb-1"></div>
          <div className="glow-orb-2"></div>
        </div>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
