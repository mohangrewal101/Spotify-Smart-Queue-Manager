import { useState } from "react";
import "./styles/theme.css";
import SearchBar from "./components/SearchBar/SearchBar";
import NowPlaying from "./components/Playback/NowPlaying";
import Queue from "./components/Queue/Queue";
import { useNowPlaying } from "./hooks/UseNowPlaying";
import { useQueue } from "./hooks/UseQueue";
import { usePlayback } from "./hooks/UsePlayback";
import PlaybackControls from "./components/Playback/PlaybackControls";
import { SpotifyService } from "./components/Spotify/SpotifyService";
import type { Track } from "./interfaces/SpotifyInterfaces";

function App() {
  const handleReorderTrack = async (oldIndex: number, newIndex: number) => {
    reorderTrack(oldIndex, newIndex);
  };

  const handleTrackEnded = async () => {
    if (trackSkipped.valueOf()) {
      setTrackSkipped(false);
    } else {
      console.log("TRACK ENDED");
      if (!currentTrack) return;
      await enforceNextTrack();
      popNextTrack(currentTrack);
    }
  };

  const handleNext = async () => {
    setTrackSkipped(true);

    if (!currentTrack) return;
    await enforceNextTrack(true);
    popNextTrack(currentTrack);
  };

  const handlePrevious = async () => {
    setTrackSkipped(true);
    const prevTrack = getPreviousTrack();

    if (!prevTrack || !currentTrack) return;

    popPreviousTrack(currentTrack);
    await enforcePreviousTrack(prevTrack);
  };

  const [trackSkipped, setTrackSkipped] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const {
    queue,
    fetchQueue,
    addTrack,
    reorderTrack,
    popNextTrack,
    popPreviousTrack,
    getPreviousTrack,
  } = useQueue();
  const {
    currentPlayback,
    currentlyPlayingId,
    togglePending,
    play,
    pause,
    pendingRemoval,
    enforceNextTrack,
    enforcePreviousTrack,
  } = usePlayback(queue, handleTrackEnded);
  const currentTrack = useNowPlaying(
    queue,
    currentlyPlayingId,
    currentPlayback?.item ?? undefined
  );
  const login = async () => {
    await SpotifyService.login();
    setLoggedIn(true);

    const sourceTracks = (await window.electron.invoke(
      "spotify-get-current-source-tracks"
    )) as Track[];
    console.log("Source tracks:", sourceTracks);

    await fetchQueue();
  };

  return (
    <>
      <main style={{ padding: "20px" }}>
        <header>
          <h1>Smart Playback Manager</h1>
        </header>

        {!loggedIn ? (
          <button onClick={login}>Login with Spotify</button>
        ) : (
          <>
            <SearchBar onAdd={addTrack} />
            <section aria-label="Smart Queue" style={{ marginTop: "1rem" }}>
              <section aria-label="Playback">
                <h2>Now Playing</h2>
                <NowPlaying track={currentTrack} />
              </section>
              <section aria-label="Queue" style={{ marginTop: "1rem" }}>
                <h2>Your Queue</h2>
                <Queue
                  queue={queue}
                  currentlyPlayingId={currentlyPlayingId ?? undefined}
                  pendingRemoval={pendingRemoval}
                  onTogglePending={togglePending}
                  onReorderTrack={handleReorderTrack}
                />
              </section>
            </section>
          </>
        )}
      </main>
      {loggedIn && (
        <footer className="playback-footer">
          <PlaybackControls
            isPlaying={currentPlayback?.is_playing ?? false}
            onPlayPause={() => (currentPlayback?.is_playing ? pause() : play())}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </footer>
      )}
    </>
  );
}

export default App;
