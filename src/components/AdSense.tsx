"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  adLayout?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSense({
  adClient = "ca-pub-4820128927673407",
  adSlot = "7373192129",
  adFormat = "auto",
  adLayout,
  fullWidthResponsive = true,
  style = { display: "block" },
  className = ""
}: AdSenseProps) {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    if (adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current = true;
    } catch (err) {
      console.error("AdSense execution error:", err);
    }
  }, []);

  return (
    <div className={`adsense-wrapper my-6 w-full max-w-4xl mx-auto overflow-hidden text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        {...(adLayout ? { "data-ad-layout": adLayout } : {})}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
