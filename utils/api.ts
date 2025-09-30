import axios from "axios";

export const api = {
  searchForTrack: async (
    token: string,
    artist: string,
    originalSong: string
  ) => {
    const searchParams = new URLSearchParams({
      q: `track:"${originalSong}" artist:"${artist}"`,
      type: "track",
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
        for (const track of response.data.tracks.items) {
          if (api.isArtistMatching(track, artist)) {
            return track.id;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  },

  isArtistMatching: (
    track: { artists: { name: string }[] },
    searchArtist: string
  ) => {
    const normalize = (str: string) => str.toLowerCase().trim();
    const searchArtistNorm = normalize(searchArtist);

    return track.artists.some(
      (artist) => normalize(artist.name) === searchArtistNorm
    );
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
