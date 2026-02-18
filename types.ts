export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Song {
  id: string; // We'll use filename as ID if not provided
  filename: string;
  title: string;
  artist: string;
  album: string;
  cover?: string; // Static cover (Metadata or Custom)
  animatedCover?: string; // GIF/Video cover from animated_covers.json
  duration: string; // Display string like "3:45"
  durationSec: number;
  lyrics?: LyricLine[];
  fileUrl: string; 
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
}

export type View = 'home' | 'browse' | 'radio' | 'library' | 'lyrics' | 'settings' | 'album' | 'recently_added' | 'artists' | 'albums' | 'songs' | 'artist_detail';

export type DownloadStatus = 'pending' | 'processing' | 'downloading' | 'converting' | 'done' | 'error' | 'started';

export interface DownloadTask {
  id: string;
  url: string;
  status: DownloadStatus;
  progress: number; // 0-100
  title?: string;
  error?: string;
}