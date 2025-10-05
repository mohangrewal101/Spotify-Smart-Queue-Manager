import { useState, useEffect, useRef } from "react";
import type { Playback } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";

export const usePlayback = (fetchQueue: () => Promise<void>) => {
  const [currentPlayback, setCurrentPlayback] = useState<Playback | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const updatePendingRefAndState = (newSet: Set<string>) => {
    pendingRef.current = newSet;
  };

  const togglePending = (trackId: string) => {
    const newSet = new Set(pendingRef.current);
    if (newSet.has(trackId)) newSet.delete(trackId);
    else newSet.add(trackId);
    updatePendingRefAndState(newSet);
  };

  const updatePlayback = async () => {
    try {
      const playback = await SpotifyService.getPlayback() as Playback;
      setCurrentPlayback(playback);
      const id = playback?.item?.id ?? playback?.item?.uri ?? null;
      setCurrentlyPlayingId(id);
    } catch (err) {
      console.error("Failed to get playback:", err);
    }
  };

  useEffect(() => {
    updatePlayback();
    const interval = setInterval(updatePlayback, 500); // polling every 0.5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentlyPlayingId || !pendingRef.current.has(currentlyPlayingId)) return;

    let mounted = true;
    const trySkip = async (attempt = 1) => {
      try {
        await SpotifyService.skipToNext();
        const newSet = new Set(pendingRef.current);
        newSet.delete(currentlyPlayingId);
        if (mounted) updatePendingRefAndState(newSet);
        await fetchQueue();
      } catch{
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 500));
          return trySkip(attempt + 1);
        }
      }
    };
    trySkip();
    return () => { mounted = false; };
  }, [currentlyPlayingId, fetchQueue]);

  return { currentPlayback, currentlyPlayingId, pendingRef, togglePending };
};
