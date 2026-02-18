import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import MainContent from './components/MainContent';
import AlbumView from './components/AlbumView';
import LyricsView from './components/LyricsView';
import AddMusicModal from './components/AddMusicModal';
import SettingsView from './components/SettingsView';
import EditSongModal from './components/EditSongModal';
import ArtistDetailView from './components/ArtistDetailView';
import { Song, View, DownloadTask } from './types';
import { api } from './api';
import { getCachedImage, cacheImage } from './utils/db';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [albumTracklists, setAlbumTracklists] = useState<Record<string, string[]>>({});
  
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return sessionStorage.getItem('dev_mode') === 'true';
  });

  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [autoLoadCovers, setAutoLoadCovers] = useState(() => {
    return localStorage.getItem('auto_load_covers') !== 'false'; // Default true
  });

  const [disableGifs, setDisableGifs] = useState(() => {
    return localStorage.getItem('disable_gifs') === 'true';
  });
  
  const [isAddMusicOpen, setIsAddMusicOpen] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);

  const [currentTime, setCurrentTime] = useState(0);
  const [seekRequest, setSeekRequest] = useState<number | null>(null);

  // Queue state for cover fetching
  const [coverQueue, setCoverQueue] = useState<string[]>([]);
  const isProcessingQueue = useRef(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  // --- Background Cover Loader System ---
  
  // Helper to generate a consistent cache key for albums
  const getAlbumCacheKey = (artist: string, album: string, filename: string) => {
      // If album is generic or unknown, do NOT group them. Use filename to make it unique.
      const isGeneric = !album || album === 'Unknown Album' || album === 'Downloads' || artist === 'Unknown Artist';
      if (isGeneric) {
          return `song_art:${filename}`;
      }
      return `album_art:${artist.trim()}|${album.trim()}`;
  };

  // Scans library for missing covers and checks cache/queues fetch
  const scanForCovers = useCallback(async (forceQueue = false) => {
      if (songs.length === 0) return;
      
      let updatedSongs = [...songs];
      let needsUpdate = false;
      const queueToAdd: string[] = [];
      const processedKeys = new Set<string>();

      // Iterate songs to identify albums that need covers
      for (const song of updatedSongs) {
          // If song has a cover (custom or already loaded), skip unless forcing
          if (song.cover && !forceQueue) continue;
          
          // If song is currently being fetched (in queue), skip
          if (coverQueue.includes(song.filename)) continue;

          const cacheKey = getAlbumCacheKey(song.artist, song.album, song.filename);
          
          // If we already processed this album key in this pass, skip checking DB again
          if (processedKeys.has(cacheKey)) continue;
          processedKeys.add(cacheKey);

          // Check IndexedDB
          const cachedCover = await getCachedImage(cacheKey);
          
          if (cachedCover) {
              // Apply cached cover to ALL songs in this album that lack a cover
              // (If it's a generic album, the key is unique to the song, so it only updates one)
              updatedSongs = updatedSongs.map(s => {
                  if ((!s.cover || forceQueue) && getAlbumCacheKey(s.artist, s.album, s.filename) === cacheKey) {
                      return { ...s, cover: cachedCover };
                  }
                  return s;
              });
              needsUpdate = true;
          } else {
              // Not in cache, queue this song as the representative to fetch metadata
              if (autoLoadCovers || forceQueue) {
                  queueToAdd.push(song.filename);
              }
          }
      }

      if (needsUpdate) {
          setSongs(updatedSongs);
          // Also update current song if it was affected
          if (currentSong) {
             const updatedCurrent = updatedSongs.find(s => s.filename === currentSong.filename);
             if (updatedCurrent && updatedCurrent.cover !== currentSong.cover) {
                 setCurrentSong(updatedCurrent);
             }
          }
      }

      if (queueToAdd.length > 0) {
          setCoverQueue(prev => {
              const newQueue = [...prev];
              queueToAdd.forEach(fn => {
                  if (!newQueue.includes(fn)) newQueue.push(fn);
              });
              return newQueue;
          });
      }
  }, [songs, autoLoadCovers, coverQueue, currentSong]);

  // Trigger scan when songs change or settings change
  useEffect(() => {
    scanForCovers();
  }, [songs.length, autoLoadCovers]);

  // 2. Process Queue One-by-One with Enhanced Logic (ID3 + iTunes)
  useEffect(() => {
    const processNext = async () => {
        if (coverQueue.length === 0 || isProcessingQueue.current) return;
        
        isProcessingQueue.current = true;
        const filename = coverQueue[0];

        try {
            const song = songs.find(s => s.filename === filename);
            
            if (!song) {
                setCoverQueue(prev => prev.slice(1));
                isProcessingQueue.current = false;
                return;
            }

            let finalCover: string | undefined = undefined;

            // 1. Try Internal Metadata (ID3) first
            try {
                const meta = await api.getSongMetadata(filename);
                if (meta.cover) {
                    finalCover = meta.cover;
                }
            } catch (e) {
                // ID3 fetch failed or no cover
            }

            // 2. If no ID3 cover, Try iTunes API
            if (!finalCover) {
                const isGeneric = song.artist === 'Unknown Artist' || song.album === 'Unknown Album';
                if (!isGeneric) {
                    try {
                        const iTunesUrl = await api.getArtwork(song.artist, song.album);
                        if (iTunesUrl) {
                            // Fetch and convert to Base64 to store offline in IndexedDB
                            // This ensures we satisfy the requirement "save to local storage"
                            finalCover = await api.fetchImageAsBase64(iTunesUrl);
                        }
                    } catch (err) {
                        console.warn(`iTunes fetch failed for ${song.artist} - ${song.album}`, err);
                    }
                }
            }
            
            if (finalCover) {
                const cacheKey = getAlbumCacheKey(song.artist, song.album, song.filename);
                
                // Save to DB (IndexedDB)
                await cacheImage(cacheKey, finalCover);
                
                // Update Songs State
                setSongs(prev => prev.map(s => {
                    if (getAlbumCacheKey(s.artist, s.album, s.filename) === cacheKey) {
                        return { ...s, cover: finalCover }; // finalCover is string
                    }
                    return s;
                }));

                // Update Current Song State LIVE
                setCurrentSong(prev => {
                    if (prev && getAlbumCacheKey(prev.artist, prev.album, prev.filename) === cacheKey) {
                        return { ...prev, cover: finalCover }; // finalCover is string
                    }
                    return prev;
                });
            }
        } catch (e) {
            console.error(`Failed to load cover for ${filename}`, e);
        } finally {
            // Remove from queue and unlock
            setCoverQueue(prev => prev.slice(1));
            isProcessingQueue.current = false;
        }
    };

    if (coverQueue.length > 0) {
        processNext();
    }
  }, [coverQueue, songs]);


  const loadLibrary = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLibrary();
      setSongs(data.songs);
      setAlbumTracklists(data.albumOrders);
    } catch (e) {
        console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = async (song: Song, playImmediately: boolean) => {
    setCurrentSong(song);
    if (playImmediately) setIsPlaying(true);
    
    // Load on Play: If missing cover, prioritize this song in queue
    if (!song.cover && !song.animatedCover) {
        setCoverQueue(prev => {
            const filtered = prev.filter(f => f !== song.filename);
            return [song.filename, ...filtered];
        });
    }
  };

  const handlePlaySong = (song: Song) => {
    handleSelectSong(song, true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    
    let contextSongs = songs;
    
    if (activeView === 'album' && selectedAlbum) {
        const tracklist = albumTracklists[selectedAlbum];
        if (tracklist) {
            const albumSongs = tracklist.map(fn => songs.find(s => s.filename === fn)).filter(Boolean) as Song[];
            if (albumSongs.length > 0) contextSongs = albumSongs;
        } else {
             const albumSongs = songs.filter(s => s.album === selectedAlbum);
             if (albumSongs.length > 0) contextSongs = albumSongs;
        }
    } else if (activeView === 'artist_detail' && selectedArtist) {
         const artistSongs = songs.filter(s => s.artist === selectedArtist);
         if (artistSongs.length > 0) contextSongs = artistSongs;
    }

    const currentIndex = contextSongs.findIndex(s => s.filename === currentSong.filename);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % contextSongs.length;
    handleSelectSong(contextSongs[nextIndex], true);
  };

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    
    let contextSongs = songs;
    
    if (activeView === 'album' && selectedAlbum) {
        const tracklist = albumTracklists[selectedAlbum];
        if (tracklist) {
            const albumSongs = tracklist.map(fn => songs.find(s => s.filename === fn)).filter(Boolean) as Song[];
            if (albumSongs.length > 0) contextSongs = albumSongs;
        } else {
            const albumSongs = songs.filter(s => s.album === selectedAlbum);
            if (albumSongs.length > 0) contextSongs = albumSongs;
        }
    } else if (activeView === 'artist_detail' && selectedArtist) {
         const artistSongs = songs.filter(s => s.artist === selectedArtist);
         if (artistSongs.length > 0) contextSongs = artistSongs;
    }

    const currentIndex = contextSongs.findIndex(s => s.filename === currentSong.filename);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + contextSongs.length) % contextSongs.length;
    handleSelectSong(contextSongs[prevIndex], true);
  };

  const toggleLyrics = () => {
    setIsLyricsOpen(!isLyricsOpen);
  };

  const handleDownload = async (url: string) => {
    try {
      const taskId = await api.startDownload(url);
      setDownloadTasks(prev => [...prev, {
        id: taskId,
        url,
        status: 'pending',
        progress: 0,
        title: 'Initializing...'
      }]);
      pollTask(taskId);
    } catch (e) {
      console.error("Failed to start download", e);
      alert("Download server error.");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await api.uploadFile(file);
      // Short delay to allow server fs write
      setTimeout(loadLibrary, 500);
    } catch (e) {
      console.error("Upload failed", e);
    }
  };

  const handleLyricUpload = async (filename: string, file: File) => {
    try {
      await api.uploadLyrics(filename, file);
      alert('Lyrics uploaded successfully!');
      loadLibrary();
    } catch (e) {
      console.error("Lyrics upload failed", e);
    }
  };

  const handleSongUpdateComplete = async () => {
      // Refresh library to reflect changes made by the modal
      await loadLibrary(); 
      // Also trigger a re-scan of covers in case a new cover URL was saved
      setTimeout(() => scanForCovers(true), 500);
  };

  const pollTask = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await api.getTaskStatus(taskId);
        setDownloadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status.status, progress: status.progress || 0 } : t));
        if (status.status === 'done' || status.status === 'error') {
          clearInterval(interval);
          if (status.status === 'done') loadLibrary(); 
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 3000);
  };

  const handleDevModeUnlock = (code: string) => {
    if (code === 'Admin123') {
      setIsDeveloperMode(true);
      sessionStorage.setItem('dev_mode', 'true');
      return true;
    }
    return false;
  };

  const handleToggleAutoLoad = (enabled: boolean) => {
    setAutoLoadCovers(enabled);
    localStorage.setItem('auto_load_covers', String(enabled));
  };

  const handleToggleGif = (enabled: boolean) => {
    setDisableGifs(enabled);
    localStorage.setItem('disable_gifs', String(enabled));
  };

  const handleSelectAlbum = (albumName: string) => {
      setSelectedAlbum(albumName);
      setActiveView('album');
  };

  const handleSelectArtist = (artistName: string) => {
      setSelectedArtist(artistName);
      setActiveView('artist_detail');
  };

  const getAlbumSongs = () => {
      if (!selectedAlbum) return [];
      const filenames = albumTracklists[selectedAlbum];
      
      if (filenames) {
          return filenames.map(fn => songs.find(s => s.filename === fn)).filter(Boolean) as Song[];
      }
      return songs.filter(s => s.album === selectedAlbum);
  };

  const handleSeekRequest = (time: number) => {
      setSeekRequest(time);
      setTimeout(() => setSeekRequest(null), 50);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black font-sans relative">
      <Sidebar 
        activeView={activeView} 
        onChangeView={setActiveView}
        onOpenAddMusic={() => setIsAddMusicOpen(true)}
        isDevMode={isDeveloperMode}
        onUnlockDev={handleDevModeUnlock}
      />
      
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        {isLoading && songs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-black">
             <div className="text-zinc-500 animate-pulse font-medium">Syncing library...</div>
          </div>
        ) : activeView === 'settings' ? (
          <SettingsView 
            autoLoadCovers={autoLoadCovers}
            onToggleAutoLoad={handleToggleAutoLoad}
            disableGifs={disableGifs}
            onToggleGifs={handleToggleGif}
            onReloadMetadata={() => scanForCovers(true)}
          />
        ) : activeView === 'album' && selectedAlbum ? (
          <AlbumView 
            albumName={selectedAlbum}
            songs={getAlbumSongs()}
            onPlaySong={handlePlaySong}
            onBack={() => setActiveView('home')}
            onShuffle={() => {
                const albumSongs = getAlbumSongs();
                if (albumSongs.length > 0) {
                    const random = albumSongs[Math.floor(Math.random() * albumSongs.length)];
                    handlePlaySong(random);
                }
            }}
            isDevMode={isDeveloperMode}
            onEditSong={setEditingSong}
            disableGifs={disableGifs}
          />
        ) : activeView === 'artist_detail' && selectedArtist ? (
          <ArtistDetailView 
              artistName={selectedArtist}
              songs={songs}
              onPlaySong={handlePlaySong}
              onBack={() => setActiveView('artists')}
              onSelectAlbum={handleSelectAlbum}
              disableGifs={disableGifs}
          />
        ) : (
          <MainContent 
            view={activeView} 
            onPlaySong={handlePlaySong}
            songs={songs}
            albumTracklists={albumTracklists}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
            disableGifs={disableGifs}
            isDevMode={isDeveloperMode}
            onEditSong={setEditingSong}
          />
        )}
      </main>

      {isDeveloperMode && (
        <AddMusicModal 
          isOpen={isAddMusicOpen}
          onClose={() => setIsAddMusicOpen(false)}
          onDownload={handleDownload}
          onUpload={handleFileUpload}
          onLyricUpload={handleLyricUpload}
          tasks={downloadTasks}
          songs={songs}
        />
      )}

      {editingSong && (
        <EditSongModal 
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSave={handleSongUpdateComplete}
        />
      )}

      {currentSong && (
         <LyricsView 
            song={currentSong} 
            isOpen={isLyricsOpen} 
            onClose={() => setIsLyricsOpen(false)}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onSeek={handleSeekRequest}
         />
      )}

      <Player 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleLyrics={toggleLyrics}
        isLyricsOpen={isLyricsOpen}
        onTimeUpdate={setCurrentTime}
        seekTime={seekRequest}
        disableGifs={disableGifs}
      />
    </div>
  );
};

export default App;