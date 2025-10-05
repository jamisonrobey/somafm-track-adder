import axios from "axios";

export const searchForTrack = async (
  token: string,
  artist: string,
  song: string
) => {
  const strictQuery = `track:"${song}" artist:"${artist}"`;

  let potentialMatches = await searchApi(token, strictQuery);

  if (potentialMatches) {
    const trackId = findBestMatch(potentialMatches, artist, song);
    if (trackId) {
      return trackId;
    }
  }

  const broadQuery = `${artist} ${song}`;
  potentialMatches = await searchApi(token, broadQuery);

  if (potentialMatches && potentialMatches.length > 0) {
    const trackId = findBestMatch(potentialMatches, artist, song);
    if (trackId) {
      return trackId;
    }
  }

  return null;
};

// https://developer.spotify.com/documentation/web-api/reference/search
//      we are destructing necessary fields from {tracks : items[]}
type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  popularity: number;
};

const searchApi = async (token: string, query: string) => {
  try {
    const searchParams = new URLSearchParams({ q: query, type: "track" });
    const response = await axios.get(
      `https://api.spotify.com/v1/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);
    console.log(response.data?.tracks.items);
    return (response.data?.tracks.items as SpotifyTrack[]) || null;
  } catch (err) {
    console.error("Error executing Spotify search:", err);
    return null;
  }
};

const artistValidator =
  (requiredArtists: string[], normalize: (str: string) => string) =>
  (track: SpotifyTrack) => {
    const spotifyArtists = track.artists.map((artist) =>
      normalize(artist.name)
    );
    return requiredArtists.every((reqArtist) =>
      spotifyArtists.some((spotifyArtist) => spotifyArtist.includes(reqArtist))
    );
  };

const songValidator =
  (requiredSongWords: string[], normalize: (str: string) => string) =>
  (track: SpotifyTrack) => {
    const spotifySongWords = normalize(track.name).split(/\s+/).filter(Boolean);
    return requiredSongWords.every((reqWord) =>
      spotifySongWords.includes(reqWord)
    );
  };

export const findBestMatch = (
  tracks: SpotifyTrack[],
  searchArtist: string,
  searchSong: string
): string | null => {
  const normalize = (str: string): string => {
    return (
      str
        // https://stackoverflow.com/a/37511463
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        // a lot of artist on somafm have 'the' prefix but not on spotify for whatever reason
        .replace(/^the\s+/, "")
        .replace(/[^a-z0-9\s]/g, "")
    );
  };

  const validators = [
    artistValidator(
      searchArtist.split(/\s+and\s+|\s+&\s+/i).map(normalize),
      normalize
    ),
    songValidator(
      normalize(searchSong).split(/\s+/).filter(Boolean),
      normalize
    ),
  ];

  const matchedTracks = [];

  for (const track of tracks) {
    if (validators.every((validator) => validator(track))) {
      matchedTracks.push(track);
    }
  }

  if (matchedTracks.length === 0) {
    return null;
  }

  // take most popular which seems to be reliable
  if (matchedTracks.length > 1) {
    matchedTracks.sort((a, b) => b.popularity - a.popularity);
  }

  return matchedTracks[0].id;
};

export const saveTrackToLibrary = async (token: string, trackId: string) => {
  const url = `https://api.spotify.com/v1/me/tracks?ids=${trackId}`;
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
};
