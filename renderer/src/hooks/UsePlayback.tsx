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
  const previousTrackIdRef = useRef<string | null>(null);
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

  useEffect(() => {
    const prev = previousTrackIdRef.current;
    const curr = currentlyPlayingId;

    if (prev && curr && prev !== curr && !transitionRef.current) {
      console.log("Track ended:", prev);
      onTrackEnded();
    }

    previousTrackIdRef.current = curr;
  }, [currentlyPlayingId, onTrackEnded]);

  const enforceNextTrack = async (forceNext = false) => {
    if (!queue.length) return;

    transitionRef.current = true;

    const spotifyQueue = (await SpotifyService.getQueue()) as {
      queue: Track[];
    };
    const spotifyNext = spotifyQueue?.queue?.[0];
    const localNext = queue[0];

    console.log("Local queue first song: " + localNext.name);
    console.log("Spotify queue first song: " + spotifyNext.name);

    if (!spotifyNext || spotifyNext.id !== localNext.id || forceNext) {
      console.log("Enforcing smart queue next:", localNext.name);
      await SpotifyService.playTrack(localNext.uri);
    }

    transitionRef.current = false;
  };

  const enforcePreviousTrack = async (track: Track) => {
    transitionRef.current = true;

    try {
      console.log("Enforcing previous track:", track.name);
      await SpotifyService.playTrack(track.uri);
    } finally {
      setTimeout(() => {
        transitionRef.current = false;
      }, 400);
    }
  };

  useEffect(() => {
    updatePlayback();
    const interval = setInterval(updatePlayback, 500); // polling every 0.5s
    return () => clearInterval(interval);
  }, []);

  return {
    currentPlayback,
    currentlyPlayingId,
    pendingRemoval: pending,
    togglePending,
    play: () => SpotifyService.play(),
    pause: () => SpotifyService.pause(),
    previous: () => SpotifyService.skipToPrevious(),
    enforceNextTrack,
    enforcePreviousTrack
  };
};
