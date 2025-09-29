import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
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
  },
});
