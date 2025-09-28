import axios from "axios";
import pkceChallenge from "pkce-challenge";

export default defineBackground(() => {
  const SPOTIFY_CLIENT_ID = "ff183ce9221e4d469b4a395609168226";
  const SPOTIFY_SCOPES = "user-library-modify";
  const REDIRECT_URI = browser.identity.getRedirectURL();

  const exchangeCodeForToken = async (code: string, verifier: string) => {
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expirationTime = Date.now() + expires_in * 1000;

      await browser.storage.local.set({
        spotify_access_token: access_token,
        spotify_refresh_token: refresh_token,
        spotify_token_expires: expirationTime,
      });

      return access_token;
    } catch (error) {
      throw new Error("Could not exchange authorization code for a token.");
    }
  };

  const authenticate = async (): Promise<string> => {
    const { code_verifier, code_challenge } = await pkceChallenge(128);

    await browser.storage.session.set({ code_verifier });

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("scope", SPOTIFY_SCOPES);
    authUrl.searchParams.append("code_challenge_method", "S256");
    authUrl.searchParams.append("code_challenge", code_challenge);

    return new Promise((resolve, reject) => {
      browser.identity.launchWebAuthFlow(
        {
          interactive: true,
          url: authUrl.toString(),
        },
        async (redirectUrl) => {
          if (browser.runtime.lastError || !redirectUrl) {
            return reject("Authentication failed or was cancelled.");
          }

          const url = new URL(redirectUrl);
          const code = url.searchParams.get("code");

          if (code) {
            const { code_verifier } = await browser.storage.session.get(
              "code_verifier"
            );
            const accessToken = await exchangeCodeForToken(code, code_verifier);
            resolve(accessToken);
          } else {
            const error = url.searchParams.get("error");
            if (error) {
              reject(`Spotify error: ${error}`);
            } else {
              reject("Could not get authorization code from Spotify.");
            }
          }
        }
      );
    });
  };

  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: SPOTIFY_CLIENT_ID,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const {
        access_token,
        expires_in,
        refresh_token: new_refresh_token,
      } = response.data;
      const expirationTime = Date.now() + expires_in * 1000;

      await browser.storage.local.set({
        spotify_access_token: access_token,
        spotify_refresh_token: new_refresh_token || refreshToken,
        spotify_token_expires: expirationTime,
      });

      return access_token;
    } catch (error) {
      return authenticate();
    }
  };

  const getAccessToken = async (): Promise<string> => {
    const data = await browser.storage.local.get([
      "spotify_access_token",
      "spotify_refresh_token",
      "spotify_token_expires",
    ]);

    if (
      data.spotify_access_token &&
      data.spotify_token_expires &&
      Date.now() < data.spotify_token_expires
    ) {
      return data.spotify_access_token;
    }

    if (data.spotify_refresh_token) {
      return refreshAccessToken(data.spotify_refresh_token);
    }
    return authenticate();
  };

  const searchForTrack = async (
    token: string,
    artist: string,
    originalSong: string
  ) => {
    const simplifiedSong = originalSong.replace(/\s*\(.*?\)/g, "").trim();

    const queriesToTry = [
      `track:${originalSong} artist:${artist}`,
      `track:${simplifiedSong} artist:${artist}`,
      `${simplifiedSong} ${artist}`,
    ];

    for (const query of queriesToTry) {
      const searchParams = new URLSearchParams({
        q: query,
        type: "track",
        limit: "1",
      });

      try {
        const response = await axios.get(
          `https://api.spotify.com/v1/search?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data?.tracks?.items?.length > 0) {
          const trackId = response.data.tracks.items[0].id;
          return trackId;
        }
      } catch (error) {}
    }
    return null;
  };

  const saveTrackToLibrary = async (token: string, trackId: string) => {
    const url = `https://api.spotify.com/v1/me/tracks?ids=${trackId}`;
    try {
      await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      throw error;
    }
  };

  //https://github.com/wxt-dev/examples/blob/main/examples/basic-messaging/entrypoints/background.ts only really works if i follow this template otherwise response just undefined in content script
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
