import { useState } from "react";
import "./styles/theme.css";
import "./styles/app-layout.css";
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
    if (!currentTrack) return;
    setTransitionRef(true);
    await enforceNextTrack();
    popNextTrack(currentTrack);
  };

  const handleNext = async () => {
    if (!currentTrack) return;
    console.log("We are going next!");
    setTransitionRef(true);
    await enforceNextTrack(true);
    popNextTrack(currentTrack);
  };

  const handlePrevious = async () => {
    const prevTrack = getPreviousTrack();

    if (!prevTrack || !currentTrack) return;

    setTransitionRef(true);
    popPreviousTrack(currentTrack);
    await enforcePreviousTrack(prevTrack);
  };

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
    setTransitionRef,
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
    <div id="viewport">
      <div id="smart-queue-helper">
        <button
          className="close-btn"
          onClick={() => SpotifyService.closeApp()}
          aria-label="Close app"
        >
          ✕
        </button>
        <main style={{ padding: "20px" }}>
          <div id="scaled-main-content">
            {!loggedIn ? (
              <button onClick={login}>Login with Spotify</button>
            ) : (
              <>
                <SearchBar onAdd={addTrack} />
                <section aria-label="Smart Queue" style={{ marginTop: "1rem" }}>
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
          </div>
        </main>
        {loggedIn && (
          <footer className="playback-footer">
            <div className="footer-left">
              <NowPlaying track={currentTrack} />
            </div>

            <div className="footer-center">
              <PlaybackControls
                isPlaying={currentPlayback?.is_playing ?? false}
                onPlayPause={() =>
                  currentPlayback?.is_playing ? pause() : play()
                }
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </div>

            <div className="footer-right" />
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
