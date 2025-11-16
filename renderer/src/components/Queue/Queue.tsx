// Queue.tsx
import React, { useRef, useState } from "react";
import type { Track } from "../../interfaces/SpotifyInterfaces";
import "./Queue.css";


interface Props {
  queue: Track[];
  currentlyPlayingId?: string;
  pendingRemoval: Set<string>;
  onTogglePending: (trackId: string) => void;
  onReorderTrack?: (fromIndex: number, toIndex: number) => void;
}

export default function Queue({
  queue,
  currentlyPlayingId,
  pendingRemoval,
  onTogglePending,
  onReorderTrack,
}: Props) {
  const dragItemIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!queue.length) {
    return (
      <section className="queue-container">
        <p className="queue-empty">Your queue is empty</p>
      </section>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragItemIndex.current;
    setDragOverIndex(null);
    dragItemIndex.current = null;

    if (fromIndex === null || fromIndex === toIndex) return;

    if (typeof onReorderTrack === "function") {
      onReorderTrack(fromIndex, toIndex);
    }
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragItemIndex.current = null;
  };

  return (
    <section className="queue-container" aria-label="Current Queue">
      <h2 className="queue-title">Up Next</h2>
      <ul className="queue-list">
        {queue.map((track, index) => {
          const isPlaying = track.id === currentlyPlayingId;
          const isPending = pendingRemoval.has(track.id);
          const isDragOver = dragOverIndex === index;
          return (
            <li
              key={`${track.id}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`queue-item ${isPlaying ? "playing" : ""} ${
                isPending ? "pending-remove" : ""
              } ${isDragOver ? "drag-over" : ""}`}
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
                aria-label={`${isPending ? "Add back" : "Remove"} ${
                  track.name
                } from queue`}
                onClick={() => onTogglePending(track.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
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
