// NowPlaying.tsx

import type { Track } from "../../interfaces/SpotifyInterfaces";
import "./NowPlaying.css";
interface Props {
  track: Track | null;
}

export default function NowPlaying({ track }: Props) {
  if (!track) {
    return (
      <section className="now-playing empty">
        <p>No track is currently playing.</p>
      </section>
    );
  }

  return (
    <section className="now-playing">
      <div className="now-playing-image">
        <img
          src={track.album.images[0]?.url}
          alt={`Album art for ${track.album.name}`}
        />

        <svg
          className="now-playing-border"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect x="2" y="2" width="96" height="96" rx="6" ry="6" />
        </svg>
      </div>

      <div className="now-playing-info">
        <h3 className="now-playing-title">{track.name}</h3>
        <p className="now-playing-artist">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
      </div>
    </section>
  );
}
