export default defineBackground(() => {
  //https://github.com/wxt-dev/examples/blob/main/examples/basic-messaging/entrypoints/background.ts
  // only really works if i follow this template otherwise response just undefined in content script
  browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "addToSpotify") {
      const { artist, song } = message.data;
      (async () => {
        try {
          const token = await getAccessToken();
          const trackId = await searchForTrack(token, artist, song);

          if (!trackId) {
            sendResponse({ ok: false, error: "Not found" });
            return;
          }

          await saveTrackToLibrary(token, trackId);
          sendResponse({ ok: true });
        } catch (error) {
          console.error(error);
          sendResponse({ ok: false, error: error?.toString() });
        }
      })();

      return true;
    }
  });
});
