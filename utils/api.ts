import axios from "axios";
import Fuse, { IFuseOptions } from "fuse.js";

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
    return (response.data?.tracks.items as SpotifyTrack[]) || null;
  } catch (err) {
    console.error("Error executing Spotify search:", err);
    return null;
  }
};

export const findBestMatch = (
  tracks: SpotifyTrack[],
  searchArtist: string,
  searchSong: string
): string | null => {
  const normalize = (str: string): string => {
    return (
      str
        .toLowerCase()
        .trim()
        // https://stackoverflow.com/a/37511463
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
    );
  };

  const searchableTracks = tracks.map((track) => ({
    ...track,
    normalizedArtists: track.artists.map((a) =>
      normalize(a.name)
        // a lot of artist on somaFM have 'the' prefix and not on spotify for whatever reason
        .replace(/^the\s+/, "")
    ),
    normalizedSong: normalize(track.name),
  }));

  const options: IFuseOptions<(typeof searchableTracks)[0]> = {
    // pareto principle ah
    keys: [
      { name: "normalizedArtists", weight: 0.8 },
      { name: "normalizedSong", weight: 0.2 },
    ],
    includeScore: true,
    threshold: 0.35,
    minMatchCharLength: 3,
    ignoreLocation: true,
  };

  const fuse = new Fuse(searchableTracks, options);

  const results = fuse.search({
    normalizedArtists: normalize(searchArtist).replace(/^the\s+/, ""),
    normalizedSong: normalize(searchSong),
  });

  /* these logs are extremely useful for debugging / tuning search and I don't want to write them out anymore so just leave in and only used in dev */
  if (results.length === 0) {
    if (import.meta.env.DEV) {
      console.log(
        `No fuzzy match found for "${searchArtist} - ${searchSong}".`
      );
      console.log("\tAPI returned:");
      for (const track of tracks) {
        console.log(`\t\t- ${track.artists[0].name} - ${track.name}`);
      }
    }
    return null;
  }

  if (import.meta.env.DEV) {
    console.log(`Fuzzy match found for "${searchArtist} - ${searchSong}":`);
    console.log(
      `\t- Best Match: '${results[0].item.artists[0].name}' - ${
        results[0].item.name
      } | Score: ${results[0].score?.toFixed(4)}`
    );

    console.log("For given tracks:");

    for (const track of tracks) {
      console.log(`\t- ${track.artists[0].name} - ${track.name}`);
    }
  }

  return results[0].item.id;
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
