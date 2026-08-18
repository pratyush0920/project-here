import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Here",
    short_name: "Here",
    description: "A quiet private space for two people.",
    start_url: "/app/today",
    display: "standalone",
    background_color: "#F7F4EE",
    theme_color: "#F7F4EE",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
