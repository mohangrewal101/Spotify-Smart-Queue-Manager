import { useEffect, useState, useRef } from "react";
import "./styles/theme.css";
import type { Playback, Track } from "./interfaces/SpotifyInterfaces";
import SearchBar from "./components/SearchBar/SearchBar";
import Queue from "./components/Queue/Queue";

function App() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );

  // TODO: Fix the eslint rule instead of disabling it
  // eslint-disable-next-line
  const [currentPlayback, setCurrentPlayback] = useState<Playback | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Set<string>>(new Set());
  const pendingRemovalRef = useRef<Set<string>>(new Set());
  const updatePendingRefAndState = (newSet: Set<string>) => {
    pendingRemovalRef.current = newSet;
    setPendingRemoval(new Set(newSet));
  };

  const updateCurrentlyPlaying = async () => {
    try {
      const playback = (await window.electron.invoke(
        "spotify-get-playback"
      )) as Playback;

      console.log(`Playback response: ${playback}`);

      setCurrentPlayback(playback || null);
      const id = playback?.item?.id ?? playback?.item?.uri ?? null;
      setCurrentlyPlayingId(id);
    } catch (error) {
      console.error("Failed to get playback:", error);
    }
  };

  useEffect(() => {
    const authListener = () => setLoggedIn(true);
    window.electron.on("spotify-auth-success", authListener);

    updateCurrentlyPlaying();
    const interval = setInterval(updateCurrentlyPlaying, 50); // every 0.05s
    return () => {
      window.electron.removeAllListeners("spotify-auth-success");
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!currentlyPlayingId) return;

    const isPending = pendingRemovalRef.current.has(currentlyPlayingId);

    if (!isPending) {
      console.log("Now playing not pending: ", currentlyPlayingId);
      return;
    }

    let mounted = true;
    const trySkip = async (attempt = 1) => {
      console.log(
        `Pending track is now playing -> attempt skip (attempt ${attempt}):`,
        currentlyPlayingId
      );
      try {
        const res = await window.electron.invoke("spotify-skip-to-next");
        console.log("spotify-skip-to-next result:", res);

        // on success, remove from pending set
        const newSet = new Set(pendingRemovalRef.current);
        newSet.delete(currentlyPlayingId);
        if (mounted) updatePendingRefAndState(newSet as Set<string>);

        // TODO: Allow refresh of queue view
        await fetchQueue();
      } catch (err) {
        console.error("Skip failed:", err);
        // retry once after a short wait)
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500));
          return trySkip(attempt + 1);
        }
        // final failure: leave it in pending so it can be retried next time it becomes current
      }
    };

    trySkip();

    return () => {
      mounted = false;
    };
  }, [currentlyPlayingId]); // run every time current track changes

  const fetchQueue = async () => {
    try {
      const result = (await window.electron.invoke("spotify-get-queue")) as { queue: Track[] } | null;
      if (result?.queue) {
        setQueue(result.queue);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  const login = () => window.electron.invoke("spotify-login");

  const handleAddTrack = async (track: Track) => {
    setQueue((prev) => [track, ...prev]);

    // Add to Spotify queue via main process
    try {
      await window.electron.invoke("spotify-add-to-queue", track.uri);
      console.log(`Added ${track.name} to Spotify queue`);
      await fetchQueue(); // Refresh queue from Spotify
    } catch (err) {
      console.error("Failed to add to Spotify queue:", err);
    }
  };

  // Toggle pending removal for a track (mark red or "add back")
  const handleTogglePending = (trackId: string) => {
    const newSet = new Set(pendingRemovalRef.current);
    if (newSet.has(trackId)) newSet.delete(trackId);
    else newSet.add(trackId);
    updatePendingRefAndState(newSet);
    console.log("PendingRemoval now:", Array.from(newSet));
  };

  return (
    <main style={{ padding: "20px" }}>
      <header>
        <h1>🎵 Smart Queue Manager</h1>
      </header>

      {!loggedIn ? (
        <button onClick={login}>Login with Spotify</button>
      ) : (
        <>
          <SearchBar onAdd={handleAddTrack} />

          <section aria-label="Smart Queue" style={{ marginTop: "1rem" }}>
            <header>
              <h2>Your Queue</h2>
            </header>

            <button onClick={fetchQueue}>Refresh Spotify Queue</button>

            <Queue
              queue={queue}
              currentlyPlayingId={currentlyPlayingId ?? undefined}
              pendingRemoval={pendingRemoval}
              onTogglePending={handleTogglePending}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default App;
