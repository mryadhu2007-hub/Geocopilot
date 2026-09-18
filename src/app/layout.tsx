import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoCopilot — Human-AI Geospatial Workspace",
  description:
    "A modular, human-in-the-loop workspace integrating MapLibre geospatial visualization, AI workflow planning, and PostGIS analysis.",
  keywords: ["GeoCopilot", "GIS", "MapLibre", "React Flow", "Supabase", "PostGIS", "AI Copilot"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
