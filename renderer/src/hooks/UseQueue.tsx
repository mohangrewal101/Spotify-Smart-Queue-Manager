import { useState } from "react";
import type { Track } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";

export const useQueue = () => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);


  /**
   * Fetch the queue from Spotify and sync local UI state.
   * Spotify returns (currently_playing + next_tracks)
   */
  const fetchQueue = async () => {
    try {
      const result = (await SpotifyService.getQueue()) as {
        currently_playing?: Track;
        queue: Track[];
      } | null;

      if (!result) return;

      if (result?.queue) {
        setQueue(result.queue);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  const addTrack = async (track: Track) => {
    setQueue((prev) => [track, ...prev]);
  };

  const removeTrack = (trackId: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  // TODO: Allow reordering of duplicate tracks separately using instance ID!
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

  // Remove from queue after playing:
  const popNextTrack = (currentTrack: Track) => {
    setHistory((h) => [...h, currentTrack]);
    setQueue((q) => {
      
      if (!q.length) return q;
      return q.slice(1);
    });
  };

  const getPreviousTrack = () =>
    history.length ? history[history.length - 1] : null;

  const popPreviousTrack = (currentTrack: Track) => {
    setHistory((prev) => {
      return prev.slice(0, -1);
    });
    
    // TODO: Allow duplicate track after fixing instance id keys bug.
    setQueue((q) => {
      if (q[0]?.id === currentTrack.id) return q;
      return [currentTrack, ...q];
    });
  };

  return {
    queue,
    history,
    fetchQueue,
    addTrack,
    reorderTrack,
    removeTrack,
    getNextTrack,
    popNextTrack,
    popPreviousTrack,
    getPreviousTrack,
    setQueue,
  };
};
