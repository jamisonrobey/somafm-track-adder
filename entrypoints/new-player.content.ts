import "./content.css";

/* note: new player is svelte and for some reason it recreates the elements many times in DOM.
    - i add dirty checks here but can't really stop it from re-running on these cases
    - so timeout on the icon might end prematurely as result
      - everything still adds in background script, just weird UI response
    - it's also mainly just doing this on first load / navigate and seems to stabilize after 
*/

export default defineContentScript({
  matches: ["*://*.somafm.com/player24/*"],
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
  if (songList) {
    setupSongList(songList);
  }
};

const getSongList = () => {
  const songHistoryTable = document.querySelector<HTMLTableElement>(
    "table[class*='songHistory']"
  );

  if (!songHistoryTable || songHistoryTable.dataset.extensionDirty === "true")
    return null;

  songHistoryTable.dataset.extensionDirty = "true";

  return songHistoryTable;
};

const setupSongList = (songList: HTMLTableElement) => {
  addButtons(songList);
  const listObserver = new MutationObserver(() => addButtons(songList));
  listObserver.observe(songList, { childList: true });
};

const addButtons = (songList: HTMLTableElement) => {
  const rows = songList.querySelectorAll<HTMLTableRowElement>(
    "tr[class*='songHistoryLine']"
  );

  for (const row of rows) {
    if (row.dataset.extensionDirty === "true") continue;
    row.dataset.extensionDirty = "true";

    const artist = row.querySelector(".songHistoryLine__artist")?.innerHTML;
    const song = row.querySelector(".songHistoryLine__trackName")?.innerHTML;

    if (!artist || !song) {
      continue;
    }

    const buttonContainer =
      row.querySelector<HTMLDivElement>(".songActionTray");

    const btn = createAddSongButton(artist, song);

    buttonContainer?.insertBefore(btn, buttonContainer.firstChild);
  }
};
