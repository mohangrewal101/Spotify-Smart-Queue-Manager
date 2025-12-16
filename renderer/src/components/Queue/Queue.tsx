// Queue.tsx
import type { Track } from "../../interfaces/SpotifyInterfaces";
import "./Queue.css";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { SortableItem } from "./SortableItem";

interface Props {
  currentTrack: Track | null;
  queue: Track[];
  currentlyPlayingId?: string;
  pendingRemoval: Set<string>;
  onTogglePending: (trackId: string) => void;
  onReorderTrack?: (fromIndex: number, toIndex: number) => void;
}

export default function Queue({
  currentTrack,
  queue,
  currentlyPlayingId,
  pendingRemoval,
  onTogglePending,
  onReorderTrack,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queue.findIndex((t) => t.id === active.id);
    const newIndex = queue.findIndex((t) => t.id === over.id);

    if (onReorderTrack) {
      onReorderTrack(oldIndex, newIndex);
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queue.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="queue-list">
            {queue.map((track) => {
              const isPlaying = track.id === currentlyPlayingId;
              const isPending = pendingRemoval.has(track.id);
              return (
                <SortableItem id={track.id} key={track.id}>
                  <div
                    className={`queue-item ${isPlaying ? "playing" : ""} ${
                      isPending ? "pending-remove" : ""
                    }`}
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
                      data-no-dnd="true"
                    >
                      {isPending ? "Add Back" : "Remove"}
                    </button>
                  </div>
                </SortableItem>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
