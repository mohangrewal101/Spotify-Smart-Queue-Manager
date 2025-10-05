import { useState } from "react";
import type { Track } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";

export const useQueue = () => {
  const [queue, setQueue] = useState<Track[]>([]);

  const fetchQueue = async () => {
    try {
      const result = await SpotifyService.getQueue() as { queue: Track[] } | null;
      if (result?.queue) setQueue(result.queue);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  const addTrack = async (track: Track) => {
    setQueue(prev => [track, ...prev]);
    try {
      await SpotifyService.addToQueue(track.uri);
      await fetchQueue();
    } catch (err) {
      console.error("Failed to add track:", err);
    }
  };

  return { queue, fetchQueue, addTrack, setQueue };
};
