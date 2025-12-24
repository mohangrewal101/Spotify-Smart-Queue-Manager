/* useNowPlaying.tsx */

import { useState, useEffect } from "react";
import type { Track } from "../interfaces/SpotifyInterfaces";

export const useNowPlaying = (
  queue: Track[],
  currentlyPlayingId: string | null,
  currentPlaybackTrack?: Track
) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!currentlyPlayingId) {
      setCurrentTrack(null);
      return;
    }

    const track =
      currentPlaybackTrack ??
      queue.find((t) => t.id === currentlyPlayingId) ??
      null;

    setCurrentTrack(track);
  }, [currentlyPlayingId, queue, currentPlaybackTrack]);

  return currentTrack;
};
