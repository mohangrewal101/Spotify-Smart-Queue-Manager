import { useState } from "react";
import "./styles/theme.css";
import SearchBar from "./components/SearchBar/SearchBar";
import Queue from "./components/Queue/Queue";
import { useQueue } from "./hooks/UseQueue";
import { usePlayback } from "./hooks/UsePlayback";
import { SpotifyService } from "./components/Spotify/SpotifyService";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const { queue, fetchQueue, addTrack } = useQueue();
  const { currentlyPlayingId, togglePending, pendingRef } = usePlayback(fetchQueue);

  const login = async () => {
    await SpotifyService.login();
    setLoggedIn(true);
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
          <SearchBar onAdd={addTrack} />
          <section aria-label="Smart Queue" style={{ marginTop: "1rem" }}>
            <header><h2>Your Queue</h2></header>
            <button onClick={fetchQueue}>Refresh Spotify Queue</button>
            <Queue
              queue={queue}
              currentlyPlayingId={currentlyPlayingId ?? undefined}
              pendingRemoval={pendingRef.current}
              onTogglePending={togglePending}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default App;
