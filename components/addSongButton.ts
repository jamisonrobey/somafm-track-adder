export const createAddSongButton = (artist: string, song: string) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon";
  btn.title = "Add to Spotify";

  const btnIcon = document.createElement("img");
  btnIcon.width = 18;
  btnIcon.height = 18;
  btnIcon.src = getIcon("spotify");
  btn.appendChild(btnIcon);

  btn.addEventListener("click", async () => {
    btnIcon.src = getIcon("loading");
    btnIcon.classList.add("animate-spin");
    btn.title = "Loading";

    try {
      const response = await browser.runtime.sendMessage({
        type: "addToSpotify",
        data: { artist, song },
      });

      if (response?.ok) {
        btnIcon.src = getIcon("checkmark");
        btnIcon.classList.remove("animate-spin");
        btn.title = "Added track to library";
      } else {
        btnIcon.src = getIcon("X");
        btnIcon.classList.remove("animate-spin");
        btn.title = `Error: ${response?.error || "Failed to add track"}`;
      }
    } catch (err) {
      btnIcon.src = getIcon("X");
      btnIcon.classList.remove("animate-spin");
      btn.title = `Error: ${err?.toString() || "Unknown error"}`;
    }

    setTimeout(() => {
      btnIcon.src = getIcon("spotify");
      btn.title = "Add to Spotify";
    }, 5000);
  });

  return btn;
};

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
