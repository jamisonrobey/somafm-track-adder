import "./content.css";

export default defineContentScript({
  matches: ["*://*.somafm.com/player/*"],
  main() {
    trySetup();

    const observer = new MutationObserver(() => {
      trySetup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

const trySetup = () => {
  const listBody = setupPlayer();
  if (listBody) hookListBody(listBody);
};

const setupPlayer = () => {
  // old player is on station list if two of these classes in dom; station track list is the second
  const players = document.querySelectorAll<HTMLDivElement>(
    ".now-playing.ng-isolate-scope"
  );
  if (players.length < 2) return null;

  const playerBody = players[1];
  if (playerBody.dataset.extension_dirty === "true") return null;

  const listBody = playerBody.querySelector<HTMLDivElement>(".list-body");
  if (!listBody) return null;

  playerBody.dataset.extension_dirty = "true";
  return listBody;
};

const hookListBody = (listBody: HTMLDivElement) => {
  addButtons(listBody);

  const rowObserver = new MutationObserver(() => addButtons(listBody));
  rowObserver.observe(listBody, { childList: true });
};

const addButtons = (listBody: HTMLDivElement) => {
  for (const row of listBody.children) {
    const buttonContainer = row.querySelector<HTMLDivElement>(".pull-right");

    if (!buttonContainer) continue;

    if (buttonContainer.querySelector("[data-extension-dirty]")) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon";
    btn.title = "Add to Spotify";
    btn.dataset.extensionDirty = "true";

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
