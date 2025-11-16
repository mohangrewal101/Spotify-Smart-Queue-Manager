// main.js

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });


let mainWindow;
let accessToken = null;
let hiddenPlaylistId = null;

//TODO: Move these to a secure location
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

function setupAuthServer() {
  const authApp = express();

  authApp.get("/login", (req, res) => {
    const scope =
      "user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-private playlist-modify-private";
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
      scope
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.redirect(authUrl);
  });

  authApp.get("/callback", async (req, res) => {
    const code = req.query.code || null;

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`,
    });

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;

    console.log("Access Token:", accessToken);

    res.send("<h1>Login successful! You can close this window.</h1>");

    // notify renderer that auth is complete
    mainWindow.webContents.send("spotify-auth-success", accessToken);
  });

  authApp.listen(8888, () => {
    console.log("OAuth server running on http://localhost:8888");
  });
}

// IPC HANDLERS

// Start Spotify login process
ipcMain.handle("spotify-login", async () => {
  shell.openExternal("http://localhost:8888/login");
});

// Get Spotify user ID
ipcMain.handle("spotify-get-user-id", async () => {
  if (!accessToken) return null;
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.id;
});

// Create a hidden playlist
ipcMain.handle("spotify-create-hidden-playlist", async (_event, userId) => {
  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Smart Queue Session",
      public: false,
      description: "Temporary playlist for Smart Queue. Auto-deleted."
    }),
  });
  const data = await res.json();
  return data.id;
});

// Get full playback source (currently playing + queue)
ipcMain.handle("spotify-get-current-source-tracks", async () => {
  if (!accessToken) return [];

  try {
    const playbackRes = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let currentlyPlaying = null;
    if (playbackRes.status === 200) {
      const playbackData = await playbackRes.json();
      currentlyPlaying = playbackData.item ? [playbackData.item] : [];
    }
    const queueRes = await fetch("https://api.spotify.com/v1/me/player/queue", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let queueTracks = [];
    if (queueRes.status === 200) {
      const queueData = await queueRes.json();
      // Spotify returns { queue: [track objects] }
      queueTracks = queueData.queue || [];
    }

    const fullQueue = [...currentlyPlaying, ...queueTracks];
    return fullQueue.map((t) => ({
      id: t.id,
      uri: t.uri,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      album: t.album.name,
      duration_ms: t.duration_ms,
    }));
  } catch (err) {
    console.error("Failed to fetch current source tracks:", err);
    return [];
  }
});


// Add tracks to a playlist
ipcMain.handle("spotify-add-tracks-to-playlist", async (_event, { playlistId, uris }) => {
  const chunkSize = 100;
  for (let i = 0; i < uris.length; i += chunkSize) {
    const chunk = uris.slice(i, i + chunkSize);
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: chunk }),
    });
  }
  return true;
});

// Get the user's current playback queue
ipcMain.handle("spotify-get-queue", async () => {
  if (!accessToken) return null;

  const res = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return await res.json();
});

// Queue an entire playlist
ipcMain.handle("spotify-queue-playlist", async (_event, playlistId) => {
  return fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=spotify:playlist:${playlistId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
});


// Play a list of URIs (SmartQueue)
ipcMain.handle("spotify-play-uris", async (event, uris = []) => {
  if (!accessToken) return { error: "not_authenticated" };
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { error: true, status: res.status, body: errText };
    }
    return { success: true };
  } catch (err) {
    return { error: true, message: err.message || err };
  }
});

// Get current playback info
ipcMain.handle("spotify-get-playback", async () => {
  if (!accessToken) return null;
  const res = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return null;
  return await res.json();
});

// Search for tracks on Spotify
ipcMain.handle("spotify-search", async (_event, query) => {
  if (!accessToken) return null;

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  return data.tracks?.items || [];
});

ipcMain.handle("spotify-move-track", async (_event, { playlistId, rangeStart, insertBefore }) => {
  console.log("Moving track in playlist:", playlistId, rangeStart, insertBefore);
  try {
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const playlistData = await playlistRes.json();
    const snapshotId = playlistData.snapshot_id;

    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range_start: rangeStart,
        insert_before: insertBefore,
        range_length: 1,
        snapshot_id: snapshotId,
      }),
    });

    console.log("Reorder response status:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("Spotify move-track error:", err);
    return false;
  }
});

// Add song to queue
ipcMain.handle("spotify-add-to-queue", async (_event, trackUri) => {
  if (!accessToken) return null;

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(
      trackUri
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Spotify queue error:", error);
    throw new Error(error.error?.message || "Failed to add to queue");
  }

  return true;
});

// Skip to next song
ipcMain.handle("spotify-skip-to-next", async () => {
  if (!accessToken) return null;

  const response = await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Spotify skip error:", error);
    throw new Error(error.error?.message || "Failed to skip track");
  }

  return true;
});

// Store hidden playlist ID
ipcMain.handle("spotify-set-hidden-playlist-id", (_event, id) => {
  hiddenPlaylistId = id;
});

// Get hidden playlist ID
ipcMain.handle("spotify-get-hidden-playlist-id", () => {
  return hiddenPlaylistId;
});


// Delete a playlist
ipcMain.handle("spotify-delete-playlist", async (_event, playlistId) => {
  if (!accessToken || !playlistId) return false;

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return res.ok;
});

const deleteHiddenPlaylist = async () => {
  if (!accessToken || !hiddenPlaylistId) return;
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${hiddenPlaylistId}/followers`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("Hidden playlist deleted:", res.ok);
  } catch (err) {
    console.error("Failed to delete hidden playlist on exit:", err);
  }
};



app.whenReady().then(() => {
  createWindow();
  setupAuthServer();
});


app.on("window-all-closed", async () => {
  await deleteHiddenPlaylist();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async (event) => {
  event.preventDefault(); // wait for async deletion
  await deleteHiddenPlaylist();
  app.exit();
});
