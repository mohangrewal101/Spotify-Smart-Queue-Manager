# 🎵 Smart Queue Manager

Smart Queue Manager is a lightweight desktop widget that enables full control of your Spotify queue without disrupting your workflow. Designed as a productivity-focused helper app, it allows users to search, add, reorder, and manage songs directly from a minimal interface — eliminating the need to constantly switch back to the Spotify desktop client.

This project was built to solve real usability gaps in Spotify’s queue management while showcasing desktop application development, API integration, and thoughtful system design.

---

## ❔ How It Works

- Launch the Smart Queue Manager widget using a global keyboard shortcut

- View your current Spotify queue and playback state

- Search for songs and add them directly to the queue

- Reorder queue items using drag-and-drop

- Manage your music without opening or navigating the Spotify desktop app

- Spotify only needs to be opened when switching playlists or playback contexts — everything else happens inside the widget.

## 🚀 Features

- 🎧 **Spotify Queue Interaction**
  Fetches real-time playback and queue data using the Spotify Web API
  
- 🛠️ **Custom Queue Management**
  Implements manual queue removal and reordering, overcoming Spotify Web API limitations
  
- 🖱️ **Drag-and-Drop Reordering**
  Intuitive drag-and-drop interface for rearranging songs in the queue

- 🔍 **Search & Add Songs Instantly**
  Search for tracks and add them to the queue without navigating Spotify’s desktop UI

- ⌨️ **Productivity-First Widget Design**
  Lightweight, non-intrusive widget-style UI
  
- 🔄 **Real-Time State Synchronization**
  Uses Electron IPC to synchronize state between backend and frontend

---

## 🛠️ Tech Stack

**Desktop Application:**
- Electron
- JavaScript
- Node.js
- HTML / CSS

**APIs & Architecture:**
- Spotify Web API
- REST APIs
- Inter-Process Communication (IPC)

**UI / UX:**
- Custom drag-and-drop interactions
- Optimized scrolling
- Keyboard-first interaction model
- Widget-style, minimal UI design

---

## 🧠 Key Engineering Challenges

**Spotify API limitations**
- Designed and implemented custom queue manipulation logic to support removal and reordering, features not natively available through the Spotify Web API.

**State synchronization**
- Engineered IPC-based communication between Electron main and renderer processes to maintain accurate real-time queue state.

**Non-intrusive UX design**
- Architected the application as a helper widget accessible via global shortcuts to minimize workflow disruption and reduce context switching.

---

## 💻 Running Locally

**Clone the repository:**

```bash
git clone https://github.com/mohangrewal101/Smart-Queue-Manager.git
cd Smart-Queue-Manager
```

**Install dependencies:**
```bash
npm install
```

**Run the application:**
```bash
npm start
```

**Ensure you have a valid Spotify Developer account and API credentials configured before running the app.**

---

## 📅 Planned Features

### Short-Term

- 🎨 UI polish and animations
- 🔊 Add a volume slider
- 🛠️ Additional queue management options (auto scroll for song names)

### Long-Term

- 👤 User preferences and customization
- 🎼 Playlist-level management (including recommending songs and adding songs to playlists)
- 🧩 Plugin-style extensions for additional music platforms (Apple music etc)

---

## 📎 Project Purpose

This project demonstrates:

- Desktop application development with Electron
- Real-world API integration and constraint handling
- System design and IPC-based architecture
- User-focused productivity tooling
- UI/UX engineering for minimal, efficient workflows

Smart Queue Manager was built to solve a personal productivity problem while showcasing practical engineering skills applicable to real-world software development.

## 📬 Contact

Made by Mohan Grewal

GitHub: https://github.com/mohangrewal101

LinkedIn: https://www.linkedin.com/in/mohan-grewal-18605a211/
