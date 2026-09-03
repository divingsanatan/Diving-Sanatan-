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
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const isPushedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isPushedRef.current) return;

    const pushAd = () => {
      if (isPushedRef.current) return true;

      const insElement = insRef.current;
      if (!insElement) return false;

      // Check if already filled by Google AdSense
      if (insElement.getAttribute("data-adsbygoogle-status")) {
        isPushedRef.current = true;
        return true;
      }

      // Check if width is strictly > 0
      const width = insElement.offsetWidth || insElement.getBoundingClientRect().width;
      if (width > 0) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushedRef.current = true;
          return true;
        } catch (err) {
          console.error("AdSense execution error:", err);
        }
      }
      return false;
    };

    // Attempt push immediately if element already has non-zero width
    if (pushAd()) return;

    // If width is 0 at initial render, wait until element has positive width via ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && insRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (pushAd() && resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
      });
      resizeObserver.observe(insRef.current);
    }

    // Fallback timer check in case ResizeObserver doesn't fire immediately
    const timer = setTimeout(() => {
      if (!isPushedRef.current) {
        pushAd();
      }
    }, 500);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`adsense-wrapper my-6 w-full max-w-4xl mx-auto overflow-hidden text-center ${className}`}
      style={{ minHeight: "90px", width: "100%" }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "90px", ...style }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        {...(adLayout ? { "data-ad-layout": adLayout } : {})}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}

