import axios from "axios";

export const api = {
  searchForTrack: async (
    token: string,
    artist: string,
    originalSong: string
  ) => {
    const simplifiedSong = originalSong.replace(/\s*\(.*?\)/g, "").trim(); // simple song name w/ no parenthesis (e.g. '(radio mix)') for fallback search

    const queries = [
      `track:${originalSong} artist:${artist}`,
      `track:${simplifiedSong} artist:${artist}`,
      `${simplifiedSong} ${artist}`,
    ];

    for (const query of queries) {
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
  },

  saveTrackToLibrary: async (token: string, trackId: string) => {
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
  },
};
