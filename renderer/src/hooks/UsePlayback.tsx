import { useState, useEffect, useRef } from "react";
import type { Playback } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";

export const usePlayback = () => {
  const [currentPlayback, setCurrentPlayback] = useState<Playback | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );
  const [pending, setPending] = useState<Set<string>>(new Set());

  const pendingRef = useRef<Set<string>>(new Set());

  const togglePending = (trackId: string) => {
    setPending((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);

      pendingRef.current = newSet; 

      return newSet;
    });
  };

  const updatePlayback = async () => {
    try {
      const playback = (await SpotifyService.getPlayback()) as Playback;
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
    if (!currentlyPlayingId || !pendingRef.current.has(currentlyPlayingId))
      return;

    let mounted = true;
    const trySkip = async (attempt = 1) => {
      try {
        await SpotifyService.skipToNext();
        const newSet = new Set(pendingRef.current);
        newSet.delete(currentlyPlayingId);
        if (mounted) {
          pendingRef.current = newSet;
          setPending(newSet);
        }
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500));
          return trySkip(attempt + 1);
        }
      }
    };
    trySkip();
    return () => {
      mounted = false;
    };
  }, [currentlyPlayingId]);

  return {
    currentPlayback,
    currentlyPlayingId,
    pendingRemoval: pending,
    togglePending,
  };
};
