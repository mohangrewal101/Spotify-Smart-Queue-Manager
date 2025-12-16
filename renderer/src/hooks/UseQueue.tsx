import { useEffect, useState, useRef } from "react";
import type { Track } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";

export const useQueue = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const initalizedRef = useRef(false);

  /**
   * Fetch the queue from Spotify and sync local UI state.
   * Spotify returns (currently_playing + next_tracks)
   */
  const fetchQueue = async () => {
    if (initalizedRef.current) return;
    try {
      const result = (await SpotifyService.getQueue()) as {
        currently_playing?: Track;
        queue: Track[];
      } | null;

      if (!result) return;

      if (result?.currently_playing) {
        setCurrentTrack(result.currently_playing);
      }

      if (result?.queue) {
        setQueue(result.queue);
        initalizedRef.current = true;
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  const addTrack = async (track: Track) => {
    setQueue((prev) => [track, ...prev]);
    try {
      await SpotifyService.addToQueue(track.uri);
    } catch (err) {
      console.error("Failed to add track to Spotify queue:", err);
    }
  };

  const removeTrack = (trackId: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const reorderTrack = (from: number, to: number) => {
    setQueue((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  // For skipping songs flagged for removal:
  const getNextTrack = () => queue[0];

  // TODO: Instead of just doing this we might want to have
  // UI for currently playing track in the queue?
  // Remove from queue after playing:
  const popNextTrack = () => {
    setQueue((prev) => prev.slice(1));
  };

  return {
    currentTrack,
    queue,
    fetchQueue,
    addTrack,
    reorderTrack,
    removeTrack,
    getNextTrack,
    popNextTrack,
    setQueue,
  };
};
