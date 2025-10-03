// Queue.tsx
import type { Track } from "../../interfaces/SpotifyInterfaces";
import "./Queue.css";

interface Props {
  queue: Track[];
  currentlyPlayingId?: string;
  pendingRemoval: Set<string>;
  onTogglePending: (trackId: string) => void;
}

export default function Queue({
  queue,
  currentlyPlayingId,
  pendingRemoval,
  onTogglePending,
}: Props) {
  if (!queue.length) {
    return (
      <section className="queue-container">
        <p className="queue-empty">Your queue is empty</p>
      </section>
    );
  }

  return (
    <section className="queue-container" aria-label="Current Queue">
      <h2 className="queue-title">Up Next</h2>
      <ul className="queue-list">
        {queue.map((track) => {
          const isPlaying = track.id === currentlyPlayingId;
          const isPending = pendingRemoval.has(track.id);

          return (
            <li
              key={track.id}
              className={`queue-item ${isPlaying ? "playing" : ""} ${
                isPending ? "pending-remove" : ""
              }`}
              style={{ color: isPending ? "red" : "inherit" }}
            >
              <figure className="queue-track-image-wrapper">
                <img
                  className="queue-track-image"
                  src={track.album.images[0]?.url}
                  alt={`Album art for ${track.album.name}`}
                />
              </figure>
              <div className="queue-track-info">
                <h3 className="queue-track-name">{track.name}</h3>
                <p className="queue-track-artist">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <button
                className="queue-remove-button"
                aria-label={`${
                  isPending ? "Add back" : "Remove"
                } ${track.name} from queue`}
                onClick={() => onTogglePending(track.id)}
              >
                {isPending ? "Add Back" : "Remove"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
