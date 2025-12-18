
import "./PlaybackControls.css";
interface Props {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PlaybackControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}: Props) {
  return (
    <footer className="playback-controls">
      <button
        className="previous-track"
        onClick={onPrevious}
        aria-label="Previous track"
      >
        ⏮
      </button>

      <button
        className="play-pause"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <button className="next-track" onClick={onNext} aria-label="Next track">
        ⏭
      </button>
    </footer>
  );
}
