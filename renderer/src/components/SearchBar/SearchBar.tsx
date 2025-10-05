import { useState, useEffect } from "react";
import type { Track } from "../../interfaces/SpotifyInterfaces";
import "../../styles/theme.css";
import "./SearchBar.css";
import { SpotifyService } from "../Spotify/SpotifyService";

interface Props {
  onAdd: (track: Track) => void;
}

export default function SearchBar({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  // Live search as user types
  useEffect(() => {
    if (!query) return setResults([]);
    const timeout = setTimeout(async () => {
      const response = await SpotifyService.searchTracks(query) as Track[];
      setResults(response);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleAdd = (track: Track) => {
    setAddingTrackId(track.id);
    setTimeout(() => {
      onAdd(track);
      setResults([]); // clear results
      setQuery(""); // reset input
      setAddingTrackId(null);
    }, 500); // duration matches CSS animation
  };

  return (
    <section className="search-container" aria-label="Spotify Song Search">
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="song-search" className="search-label">
          Search for a song
        </label>
        <input
          id="song-search"
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a song name..."
          aria-autocomplete="list"
          aria-controls="search-results-list"
        />
      </form>

      {results.length > 0 && (
        <ul
          id="search-results-list"
          className="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((track) => (
            <li
              key={track.id}
              className="search-result-item"
              role="option"
              tabIndex={0}
              onClick={() => handleAdd(track)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd(track);
              }}
            >
              <figure className="track-image-wrapper">
                <img
                  className="track-image"
                  src={track.album.images[0]?.url}
                  alt={`Album art for ${track.album.name}`}
                />
              </figure>
              <div className="track-info">
                <h3 className="track-name">{track.name}</h3>
                <p className="track-artist">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <button
                className={`add-button ${
                  addingTrackId === track.id ? "added" : ""
                }`}
                type="button"
                aria-label={`Add ${track.name} to Smart Queue`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd(track);
                }}
              >
                <img
                  className="queue-icon-img"
                  src="/svg/add-to-queue.svg"
                  alt={
                    addingTrackId === track.id
                      ? "Added to queue"
                      : "Add to queue"
                  }
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
