import { DownloadTask, Song, LyricLine } from './types';
import { MOCK_SONGS } from './constants';

// Default to local server, but will fall back to mocks if unreachable
const SERVER_URL = 'https://compared-achievements-plans-subaru.trycloudflare.com/';

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "3:45";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to construct full URL for assets
const getAssetUrl = (path: string | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  return `${SERVER_URL}/music/${path}`;
};

// Helper to parse and clean lyrics
const parseLyrics = (raw: any): LyricLine[] | undefined => {
    if (!raw) return undefined;
    const lines = Array.isArray(raw) ? raw : String(raw).split('\n');
    
    const parsed: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/;

    lines.forEach((line: string) => {
        const match = line.match(timeRegex);
        if (match) {
            const min = parseInt(match[1]);
            const sec = parseInt(match[2]);
            const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
            const text = match[4].trim();
            if (text) {
                parsed.push({
                    time: min * 60 + sec + ms,
                    text: text
                });
            }
        }
    });

    return parsed.length > 0 ? parsed : undefined;
};

export const api = {
  // Fetch all necessary data to build the library
  getLibrary: async (): Promise<{ songs: Song[], albumOrders: Record<string, string[]> }> => {
    try {
      // Create a timeout for the fetch to ensure we fall back quickly if server is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const [
        metadataRes,
        customMetadataRes,
        customCoversRes,
        animatedCoversRes,
        albumOrdersRes,
        lyricsRegistryRes
      ] = await Promise.all([
        fetch(`${SERVER_URL}/api/all-metadata`, { signal: controller.signal }).catch(() => null),
        fetch(`${SERVER_URL}/music/custom_metadata.json`, { signal: controller.signal }).catch(() => null),
        fetch(`${SERVER_URL}/music/custom_covers.json`, { signal: controller.signal }).catch(() => null),
        fetch(`${SERVER_URL}/music/animated_covers.json`, { signal: controller.signal }).catch(() => null),
        fetch(`${SERVER_URL}/music/album_orders.json`, { signal: controller.signal }).catch(() => null),
        fetch(`${SERVER_URL}/music/lyrics_registry.json`, { signal: controller.signal }).catch(() => null)
      ]);
      
      clearTimeout(timeoutId);

      if (!metadataRes || !metadataRes.ok) {
          throw new Error("Server unreachable");
      }

      const metadataList = metadataRes?.ok ? await metadataRes.json() : [];
      const customMetadata = customMetadataRes?.ok ? await customMetadataRes.json() : {};
      const customCovers = customCoversRes?.ok ? await customCoversRes.json() : {};
      const animatedCovers = animatedCoversRes?.ok ? await animatedCoversRes.json() : {};
      const albumOrders = albumOrdersRes?.ok ? await albumOrdersRes.json() : {};
      const lyricsRegistry = lyricsRegistryRes?.ok ? await lyricsRegistryRes.json() : {};

      // 1. Start with the registry (downloaded songs)
      let allSongs: Song[] = Array.isArray(metadataList) ? metadataList.map((item: any) => ({
        id: item.filename,
        filename: item.filename,
        title: item.title,
        artist: item.artist,
        album: item.album,
        duration: formatDuration(item.duration),
        durationSec: item.duration,
        fileUrl: `${SERVER_URL}/music/${encodeURIComponent(item.filename)}`,
        cover: undefined, 
        lyrics: parseLyrics(lyricsRegistry[item.filename])
      })) : [];

      // 2. Identify songs mentioned in custom_metadata (manual overrides)
      const metadataKeys = Object.keys(customMetadata);
      
      metadataKeys.forEach(filename => {
        const existingIndex = allSongs.findIndex(s => s.filename === filename);
        const meta = customMetadata[filename];
        const lyrics = parseLyrics(lyricsRegistry[filename]);
        
        const title = meta.title || filename.replace('.mp3', '');
        const artist = meta.artist || 'Unknown Artist';
        const album = meta.album || 'Unknown Album';

        const songData: Song = {
          id: filename,
          filename: filename,
          title,
          artist,
          album,
          durationSec: 220, 
          duration: "3:40",
          fileUrl: `${SERVER_URL}/music/${encodeURIComponent(filename)}`,
          cover: undefined, 
          lyrics: lyrics
        };

        if (existingIndex > -1) {
          allSongs[existingIndex] = { 
              ...allSongs[existingIndex], 
              ...songData,
              durationSec: allSongs[existingIndex].durationSec || songData.durationSec,
              duration: allSongs[existingIndex].duration || songData.duration,
          };
        } else {
          allSongs.push(songData);
        }
      });

      // 3. Apply Custom Covers and Animated Covers
      allSongs = allSongs.map(song => {
        const trackKey = `track:${song.filename}`;
        const albumKey = `album:${song.artist}|${song.album}`;

        const customCoverPath = customCovers[trackKey] || customCovers[albumKey];
        if (customCoverPath) {
            song.cover = getAssetUrl(customCoverPath);
        }

        const animatedCoverPath = animatedCovers[trackKey] || animatedCovers[albumKey];
        if (animatedCoverPath) {
            song.animatedCover = getAssetUrl(animatedCoverPath);
        }

        return song;
      });

      return { songs: allSongs, albumOrders };

    } catch (e) {
      console.warn('Failed to load library from server (Mock Mode Activated):', e);
      // Fallback to MOCK data for the "Mock Up" experience
      return { 
          songs: MOCK_SONGS, 
          albumOrders: {
              'SOS': ['s1'],
              'Midnights': ['s2'],
              'Harry\'s House': ['s3']
          } 
      };
    }
  },

  // Fetch detailed metadata including base64 image
  getSongMetadata: async (filename: string): Promise<{ cover?: string, title?: string, artist?: string }> => {
    try {
        const res = await fetch(`${SERVER_URL}/api/metadata/${encodeURIComponent(filename)}`);
        if (!res.ok) throw new Error('Failed to fetch metadata');
        const data = await res.json();
        
        let coverUrl = undefined;
        if (data.cover) {
            coverUrl = `data:image/jpeg;base64,${data.cover}`;
        }

        return { 
            cover: coverUrl, 
            title: data.title,
            artist: data.artist
        };
    } catch (e) {
      return {};
    }
  },

  startDownload: async (url: string): Promise<string> => {
    try {
        const res = await fetch(`${SERVER_URL}/api/items`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
        });
        
        if (!res.ok) throw new Error('Download request failed');
        const data = await res.json();
        return data.taskId; 
    } catch (e) {
        console.warn("Server unavailable. Simulating download.");
        return `mock-task-${Date.now()}`;
    }
  },

  getTaskStatus: async (taskId: string): Promise<DownloadTask> => {
    try {
        if (taskId.startsWith('mock-task')) {
             return {
                id: taskId,
                url: 'http://youtube.com/mock',
                status: 'done',
                progress: 100,
                title: 'Mock Download Complete'
            };
        }

        const res = await fetch(`${SERVER_URL}/api/download-status/${taskId}`);
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        return {
            id: taskId,
            url: data.url,
            status: data.status,
            progress: data.progress || 0,
            title: 'Downloading...'
        };
    } catch (e) {
        return {
            id: taskId,
            url: '',
            status: 'error',
            progress: 0,
            error: 'Connection failed'
        };
    }
  },

  uploadFile: async (file: File): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${SERVER_URL}/upload`, {
        method: "POST",
        body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
    } catch (e) {
        console.warn("Upload simulated (server offline)");
    }
  },

  updateMetadata: async (filename: string, metadata: { title?: string, artist?: string, album?: string }): Promise<void> => {
      try {
        const res = await fetch(`${SERVER_URL}/api/custom-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, ...metadata })
        });
        if (!res.ok) throw new Error('Failed to update metadata');
      } catch (e) {
        console.warn("Metadata update simulated (server offline)");
        // Don't throw, just let UI proceed
      }
  },

  uploadLyrics: async (filename: string, file: File): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${SERVER_URL}/upload-lyrics?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: formData
        });
        if (!res.ok) throw new Error('Lyrics upload failed');
    } catch (e) {
        console.warn("Lyrics upload simulated");
    }
  },

  // --- COVERS & ARTWORK ---

  saveCustomCover: async (
      key: string, 
      source: File | string, 
      type: 'static' | 'animated'
  ): Promise<void> => {
      try {
        let filename = '';

        if (source instanceof File) {
            const formData = new FormData();
            formData.append('file', source);
            const uploadRes = await fetch(`${SERVER_URL}/api/covers/upload`, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Cover upload failed');
            const data = await uploadRes.json();
            filename = data.filename;
        } else {
            const downloadRes = await fetch(`${SERVER_URL}/api/covers/save-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: source })
            });
            if (!downloadRes.ok) throw new Error('Cover download failed');
            const data = await downloadRes.json();
            filename = data.filename;
        }

        const updateRes = await fetch(`${SERVER_URL}/api/covers/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, type, value: filename })
        });
        if (!updateRes.ok) throw new Error('Cover registry update failed');
      } catch (e) {
          console.warn("Cover save simulated (server offline)");
      }
  },

  searchTracks: async (term: string): Promise<any[]> => {
      if (!term) return [];
      try {
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=8`);
          const data = await res.json();
          return data.results || [];
      } catch (e) {
          console.error("Search failed", e);
          return [];
      }
  }
};