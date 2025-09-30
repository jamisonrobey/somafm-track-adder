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
  const songList = getSongList();
  if (songList) setupSongList(songList);
};

const getSongList = () => {
  // old player is on station list if two of these classes in dom; station track list is in the second
  const players = document.querySelectorAll<HTMLDivElement>(
    ".now-playing.ng-isolate-scope"
  );
  if (players.length < 2) return null;

  const playerBody = players[1];
  if (playerBody.dataset.extensionDirty === "true") return null;

  const listBody = playerBody.querySelector<HTMLDivElement>(".list-body");
  if (!listBody) return null;

  playerBody.dataset.extensionDirty = "true";
  return listBody;
};

const setupSongList = (songList: HTMLDivElement) => {
  addButtons(songList);

  const listObserver = new MutationObserver(() => addButtons(songList));
  listObserver.observe(songList, { childList: true });
};

const addButtons = (songList: HTMLDivElement) => {
  for (const row of songList.children) {
    const buttonContainer = row.querySelector<HTMLDivElement>(".pull-right");

    if (!buttonContainer || buttonContainer.dataset.extensionDirty === "true")
      continue;

    buttonContainer.dataset.extensionDirty = "true";

    const cols = row.children;
    const artist = (cols[1].textContent || "").trim();
    const song = (cols[2].textContent || "").trim();

    const btn = createAddSongButton(artist, song);

    buttonContainer.insertBefore(btn, buttonContainer.firstChild);
  }
};
