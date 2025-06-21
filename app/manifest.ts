import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grabbit - Smart Shopping Reminders",
    short_name: "Grabbit",
    description: "Don't forget the lettuce. Voice-activated shopping reminders with location-based alerts.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8B5CF6",
    orientation: "portrait",
    categories: ["shopping", "productivity", "lifestyle"],
    icons: [
      {
        src: "/images/grabbit-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/images/grabbit-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  }
}
