import type { Metadata, Viewport } from "next";
import "./globals.css";
import LocationCollector from "./location-collector";

export const metadata: Metadata = {
  title: "A question for you 💌",
  description: "Someone has a very important question for you…",
  openGraph: {
    title: "A question for you 💌",
    description: "Someone has a very important question for you…",
  },
};

// viewport-fit=cover lets the page use the full phone screen (notch-safe via CSS env())
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LocationCollector />
        {children}
      </body>
    </html>
  );
}
