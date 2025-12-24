export const SpotifyService = {
  login: async () => {
    return new Promise<void>((resolve) => {
      const listener = (...args: unknown[]) => {
        const token = args[0] as string;
        console.log("Spotify auth token received:", token);
        resolve();
        window.electron.removeAllListeners("spotify-auth-success");
      };

      window.electron.on("spotify-auth-success", listener);
      window.electron.invoke("spotify-login");
    });
  },

  getPlayback: () => window.electron.invoke("spotify-get-playback"),

  getQueue: () => window.electron.invoke("spotify-get-queue"),
  addToQueue: (uri: string) =>
    window.electron.invoke("spotify-add-to-queue", uri),


  playTrack: (uri: string) =>
    window.electron.invoke("spotify-play-track", uri),
  searchTracks: async (query: string) => {
    try {
      const res = await window.electron.invoke("spotify-search", query);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error("Spotify search failed:", err);
      return [];
    }
  },

  play: () => window.electron.invoke("spotify-resume-playback"),
  pause: () => window.electron.invoke("spotify-pause"),
  skipToNext: () => window.electron.invoke("spotify-skip-to-next"),
  skipToPrevious: () => window.electron.invoke("spotify-skip-to-previous"),
};
