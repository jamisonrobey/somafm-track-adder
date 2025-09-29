import axios from "axios";
import pkceChallenge from "pkce-challenge";

const SPOTIFY_CLIENT_ID = "ff183ce9221e4d469b4a395609168226";
const SPOTIFY_SCOPES = "user-library-modify";
const REDIRECT_URI = browser.identity.getRedirectURL();

// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
export const auth = {
  exchangeCodeForToken: async (code: string, verifier: string) => {
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
  },

  authenticate: async (): Promise<string> => {
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
            const accessToken = await auth.exchangeCodeForToken(
              code,
              code_verifier
            );
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
  },

  getAccessToken: async (): Promise<string> => {
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
      return auth.refreshAccessToken(data.spotify_refresh_token);
    }
    return auth.authenticate();
  },

  refreshAccessToken: async (refreshToken: string): Promise<string> => {
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
      return auth.authenticate();
    }
  },
};
