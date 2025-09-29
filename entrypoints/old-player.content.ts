import "./content.css";

export default defineContentScript({
  matches: ["*://*.somafm.com/player/*"],
  main(ctx) {
    const setupPlayer = () => {
      const players = document.querySelectorAll<HTMLDivElement>(
        ".now-playing.ng-isolate-scope"
      );
      if (players.length < 2) return null;

      const playerBody = players[1];
      if (playerBody.dataset.spotifyInit === "true") return null;

      const listBody = playerBody.querySelector<HTMLDivElement>(".list-body");
      if (!listBody) return null;

      playerBody.dataset.spotifyInit = "true";
      return listBody;
    };

    const addButtons = (listBody: HTMLDivElement) => {
      for (const row of listBody.children) {
        const buttonContainer =
          row.querySelector<HTMLDivElement>(".pull-right");

        if (!buttonContainer) continue;
        if (buttonContainer.querySelector(".spotify-btn")) continue;

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

          const cols = row.children;
          const artist = (cols[1].textContent || "").trim();
          const song = (cols[2].textContent || "").trim();

          try {
            const response = await browser.runtime.sendMessage({
              type: "addToSpotify",
              data: {
                artist,
                song,
              },
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

        buttonContainer.insertBefore(btn, buttonContainer.firstChild);
      }
    };

    const hookListBody = (listBody: HTMLDivElement) => {
      addButtons(listBody);

      const rowObserver = new MutationObserver(() => addButtons(listBody));
      rowObserver.observe(listBody, { childList: true });
    };

    const observer = new MutationObserver(() => {
      const listBody = setupPlayer();
      if (listBody) hookListBody(listBody);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const listBody = setupPlayer();
    if (listBody) hookListBody(listBody);
  },
});

// https://wxt.dev/guide/essentials/assets.html#inside-content-scripts
const getIcon = (type: "spotify" | "loading" | "checkmark" | "X") => {
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
