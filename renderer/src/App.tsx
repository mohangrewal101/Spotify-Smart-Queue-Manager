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
  const [loggedIn, setLoggedIn] = useState(false);
  const { queue, fetchQueue, addTrack, reorderTrack } = useQueue();
  const {
    currentPlayback,
    currentlyPlayingId,
    togglePending,
    play,
    pause,
    next,
    previous,
    pendingRemoval,
  } = usePlayback();
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

  const handleReorderTrack = async (oldIndex: number, newIndex: number) => {
    console.log("Reordering track", oldIndex, "→", newIndex);
    reorderTrack(oldIndex, newIndex);

    // TODO: Try to see if Spotify can move tracks during playback!
    //await SpotifyService.moveTrack(playlistId, oldIndex, newIndex);
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
            onNext={next}
            onPrevious={previous}
          />
        </footer>
      )}
    </>
  );
}

export default App;
