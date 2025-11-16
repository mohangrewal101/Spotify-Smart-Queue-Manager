import { useState } from "react";
import "./styles/theme.css";
import SearchBar from "./components/SearchBar/SearchBar";
import Queue from "./components/Queue/Queue";
import { useQueue } from "./hooks/UseQueue";
import { usePlayback } from "./hooks/UsePlayback";
import { SpotifyService } from "./components/Spotify/SpotifyService";
import type { Track } from "./interfaces/SpotifyInterfaces";

function App() {
  const [loggedIn, setLoggedIn] = useState(false); 
  const [, setHiddenPlaylistId] = useState<string | null>(null);
  const { queue, fetchQueue, addTrack } = useQueue();
  const { currentlyPlayingId, togglePending, pendingRef } =
    usePlayback(fetchQueue);

  const login = async () => {
    await SpotifyService.login();
    setLoggedIn(true);

    const userId = await window.electron.invoke("spotify-get-user-id") as string; 
    const playlistId = await SpotifyService.createHiddenPlaylist(userId) as string;
    setHiddenPlaylistId(playlistId);
    await window.electron.invoke("spotify-set-hidden-playlist-id", playlistId);

    const sourceTracks = await window.electron.invoke(
      "spotify-get-current-source-tracks"
    ) as Track[];
    console.log("Source tracks:", sourceTracks);
    const trackUris = sourceTracks.map(t => t.uri);

    if (trackUris.length > 0) {
      console.log("Track URIs to add to hidden playlist:", trackUris);
      await SpotifyService.addTracksToPlaylist(playlistId, trackUris);
      await SpotifyService.queuePlaylist(playlistId);
      await fetchQueue(); 
    }
  };

  const handleReorderTrack = async (oldIndex: number, newIndex: number) => {
  console.log("Reordering track", oldIndex, "→", newIndex);

  const playlistId = await window.electron.invoke("spotify-get-hidden-playlist-id") as string;
  if (!playlistId) {
    console.error("No hidden playlist ID found.");
    return;
  }
  
  await SpotifyService.moveTrack(playlistId, oldIndex, newIndex);

  // Refresh queue UI
  await fetchQueue();
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
            <header>
              <h2>Your Queue</h2>
            </header>
            <button onClick={fetchQueue}>Refresh Spotify Queue</button>
            <Queue
              queue={queue}
              currentlyPlayingId={currentlyPlayingId ?? undefined}
              pendingRemoval={pendingRef.current}
              onTogglePending={togglePending}
              onReorderTrack={handleReorderTrack}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default App;
