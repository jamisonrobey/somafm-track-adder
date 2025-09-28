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
        btn.className = "spotify-btn btn btn-link btn-lg";
        btn.textContent = "S";

        btn.addEventListener("click", async () => {
          btn.textContent = "...";
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
            console.log("response: ", response);
            if (response?.ok) {
              btn.textContent = "✓";
            } else {
              btn.textContent = "✗";
            }
          } catch (err) {
            btn.textContent = "✗";
          }
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
