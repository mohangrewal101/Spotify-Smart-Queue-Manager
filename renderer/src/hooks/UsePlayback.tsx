import { useState, useEffect, useRef } from "react";
import type { Playback } from "../interfaces/SpotifyInterfaces";
import { SpotifyService } from "../components/Spotify/SpotifyService";
import type { Track } from "../interfaces/SpotifyInterfaces";

export const usePlayback = (queue: Track[], onTrackEnded: () => void) => {
  const [currentPlayback, setCurrentPlayback] = useState<Playback | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );
  const [pending, setPending] = useState<Set<string>>(new Set());

  const pendingRef = useRef<Set<string>>(new Set());
  const transitionRef = useRef<boolean>(false);

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
      setCurrentlyPlayingId((prevId) => (prevId !== id ? id : prevId));
    } catch (err) {
      console.error("Failed to get playback:", err);
    }
  };

  const enforceNextTrack = async (forceNext = false) => {
    if (!queue.length) return;
    try {
      const spotifyQueue = (await SpotifyService.getQueue()) as {
        queue: Track[];
      };
      const spotifyNext = spotifyQueue?.queue?.[0];
      const localNext = queue[0];

      if (!spotifyNext || spotifyNext.id !== localNext.id || forceNext) {
        console.log("Enforcing smart queue next:", localNext.name);
        await SpotifyService.playTrack(localNext.uri);
      }
    } finally {
      setTimeout(() => {
        transitionRef.current = false;
      }, 400);
    }
  };

  const enforcePreviousTrack = async (track: Track) => {
    try {
      console.log("Enforcing previous track:", track.name);
      await SpotifyService.playTrack(track.uri);
    } finally {
      setTimeout(() => {
        transitionRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    updatePlayback();
    const interval = setInterval(updatePlayback, 500); // polling every 0.5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentPlayback?.item || !currentPlayback.is_playing) return;

      const duration = currentPlayback.item.duration_ms;
      const progress = currentPlayback.progress_ms ?? 0;

      const remaining = duration - progress;

      // Fire slightly before end
      const NEAR_END_MS = 1000;

      if (remaining <= NEAR_END_MS && !transitionRef.current) {
        console.log("Track has ended according to progress check");
        transitionRef.current = true;
        onTrackEnded();
      }
    }, 500); 

    return () => clearInterval(interval);
  }, [currentPlayback, onTrackEnded]);

  return {
    currentPlayback,
    currentlyPlayingId,
    pendingRemoval: pending,
    togglePending,
    play: () => SpotifyService.play(),
    pause: () => SpotifyService.pause(),
    previous: () => SpotifyService.skipToPrevious(),
    enforceNextTrack,
    enforcePreviousTrack,
    isTransitioning: () => transitionRef.current,
    setTransitionRef: (value: boolean) => (transitionRef.current = value),
  };
};
