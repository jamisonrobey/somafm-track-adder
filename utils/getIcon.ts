// https://wxt.dev/guide/essentials/assets.html#inside-content-scripts
export const getIcon = (type: "spotify" | "loading" | "checkmark" | "X") => {
  switch (type) {
    case "spotify":
      return browser.runtime.getURL("/spotify-icon.svg");
    case "loading":
      return browser.runtime.getURL("/loading-icon.svg");
    case "checkmark":
      return browser.runtime.getURL("/checkmark.svg");
    case "X":
      return browser.runtime.getURL("/X.svg");
  }
};
