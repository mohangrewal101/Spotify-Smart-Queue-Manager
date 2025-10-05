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

//TODO: Move these to a secure location
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

console.log("Spotify env check:", {
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET ? "✅ loaded" : "❌ missing",
  redirect: process.env.SPOTIFY_REDIRECT_URI
});

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
      "user-read-playback-state user-modify-playback-state user-read-currently-playing";
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

// -------------------- IPC HANDLERS --------------------

// Start Spotify login process
ipcMain.handle("spotify-login", async () => {
  shell.openExternal("http://localhost:8888/login");
});

// Get the user's current playback queue
ipcMain.handle("spotify-get-queue", async () => {
  if (!accessToken) return null;

  const res = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return await res.json();
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

// -------------------------------------------------------

app.whenReady().then(() => {
  createWindow();
  setupAuthServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
