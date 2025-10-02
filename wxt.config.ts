import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "SomaFM Spotify Track Adder",
    version: "1.0.0",
    description:
      "Add tracks from SomaFM channel's recently played song list to your Spotify library with a single click.",
    permissions: ["identity", "storage"],
    web_accessible_resources: [
      {
        matches: ["<all_urls>"],
        resources: [
          "spotify-icon.svg",
          "loading-icon.svg",
          "checkmark.svg",
          "X.svg",
        ],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: "somafm-track-adder@jamisonrobey.com",
      },
    },
  },
});
