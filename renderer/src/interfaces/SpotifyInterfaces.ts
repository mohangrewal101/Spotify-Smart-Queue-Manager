export interface AlbumImage {
  url: string;
  height: number;
  width: number;
}

export interface Album {
  id: string;
  name: string;
  images: AlbumImage[];
}

export interface Artist {
  name: string;
}

export interface Track {
  duration_ms: number;
  album: Album;
  id: string;
  name: string;
  artists: Artist[];
  uri: string;
}

export interface Playback {
  item?: Track | null;
  is_playing: boolean;
  progress_ms?: number;
}
