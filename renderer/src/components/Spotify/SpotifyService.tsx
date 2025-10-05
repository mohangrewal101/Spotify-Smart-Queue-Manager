export const SpotifyService = {
  login: () => window.electron.invoke("spotify-login"),
  getPlayback: () => window.electron.invoke("spotify-get-playback"),
  getQueue: () => window.electron.invoke("spotify-get-queue"),
  addToQueue: (uri: string) => window.electron.invoke("spotify-add-to-queue", uri),
  skipToNext: () => window.electron.invoke("spotify-skip-to-next"),

  searchTracks: async (query: string) => {
    try {
      const res = await window.electron.invoke("spotify-search", query);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error("Spotify search failed:", err);
      return [];
    }
  },
};
