import React from 'react';
import { Play, Music, Edit, Clock, Calendar, Mic2 } from 'lucide-react';
import { MOCK_PLAYLISTS } from '../constants';
import { Song, View } from '../types';

interface MainContentProps {
  view: View;
  onPlaySong: (song: Song) => void;
  songs: Song[];
  albumTracklists: Record<string, string[]>;
  onSelectAlbum: (albumName: string) => void;
  onSelectArtist: (artistName: string) => void;
  disableGifs: boolean;
  isDevMode?: boolean;
  onEditSong?: (song: Song) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
    view, 
    onPlaySong, 
    songs, 
    albumTracklists, 
    onSelectAlbum,
    onSelectArtist, 
    disableGifs,
    isDevMode,
    onEditSong 
}) => {
  const Greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAlbumCover = (albumName: string) => {
      const song = songs.find(s => s.album === albumName);
      if (!song) return null;
      return (!disableGifs && song.animatedCover) ? song.animatedCover : song.cover;
  };

  const getSongCover = (song: Song) => {
      return (!disableGifs && song.animatedCover) ? song.animatedCover : song.cover;
  };

  const getUniqueAlbums = () => {
      const albums = new Set(songs.map(s => s.album));
      return Array.from(albums).filter(a => a !== 'Unknown Album');
  };

  const getUniqueArtists = () => {
      const artists = new Set(songs.map(s => s.artist));
      return Array.from(artists).filter(a => a !== 'Unknown Artist').sort();
  };

  // --- SUB-VIEWS ---

  const renderSongsList = (songList: Song[], showAddedDate = false) => (
      <div className="px-8 pb-10">
          <div className="flex items-center justify-between mb-6 pt-8">
              <h1 className="text-3xl font-bold text-white">{showAddedDate ? 'Recently Added' : 'Songs'}</h1>
          </div>
          
          <div className="min-w-full text-left text-sm">
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-4 border-b border-zinc-800 pb-2">
                  <div className="text-center">#</div>
                  <div>Title</div>
                  <div>Artist</div>
                  <div>Album</div>
                  <div className="text-right flex justify-end"><Clock size={14} /></div>
              </div>

              <div className="space-y-1">
                  {songList.map((song, idx) => (
                      <div 
                          key={song.id} 
                          className="group grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-4 items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-b border-transparent hover:border-zinc-800"
                          onDoubleClick={() => onPlaySong(song)}
                      >
                          <div className="text-center text-zinc-500 font-medium group-hover:text-white relative">
                              <span className="group-hover:hidden">{idx + 1}</span>
                              <button onClick={() => onPlaySong(song)} className="hidden group-hover:flex items-center justify-center absolute inset-0 text-zinc-300 hover:text-white">
                                  <Play size={14} fill="currentColor"/>
                              </button>
                          </div>
                          
                          <div className="flex items-center gap-3 min-w-0">
                              <img src={getSongCover(song) || 'https://picsum.photos/400/400'} className="w-10 h-10 rounded shadow-sm object-cover" alt="" />
                              <span className="font-medium text-white truncate">{song.title}</span>
                          </div>

                          <div className="text-zinc-400 truncate group-hover:text-white">{song.artist}</div>
                          <div className="text-zinc-400 truncate group-hover:text-white">{song.album}</div>
                          
                          <div className="text-right text-zinc-500 tabular-nums">
                              {song.duration}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderAlbumsGrid = () => {
      const albums = getUniqueAlbums();
      return (
          <div className="px-8 pb-10">
              <div className="flex items-center justify-between mb-6 pt-8">
                  <h1 className="text-3xl font-bold text-white">Albums</h1>
                  <span className="text-zinc-500 text-sm font-medium">{albums.length} Albums</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                  {albums.map((albumName) => {
                      const cover = getAlbumCover(albumName);
                      // Find artist for this album
                      const artist = songs.find(s => s.album === albumName)?.artist || 'Unknown Artist';
                      
                      return (
                        <div key={albumName} className="group cursor-pointer" onClick={() => onSelectAlbum(albumName)}>
                          <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-zinc-900 shadow-lg transition-all duration-300 group-hover:shadow-2xl">
                            {cover ? (
                                <img 
                                  src={cover} 
                                  alt={albumName} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                   <Music size={48} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                               <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:scale-110 hover:bg-apple-red hover:text-white text-white transition-all ml-auto mb-1 shadow-lg">
                                  <Play size={20} fill="currentColor" className="ml-0.5"/>
                               </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-white font-medium text-sm truncate leading-tight group-hover:underline decoration-white/50">{albumName}</h3>
                            <p className="text-zinc-500 text-xs mt-1 truncate group-hover:text-zinc-400">{artist}</p>
                          </div>
                        </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderArtistsGrid = () => {
      const artists = getUniqueArtists();
      return (
          <div className="px-8 pb-10">
               <div className="flex items-center justify-between mb-6 pt-8">
                  <h1 className="text-3xl font-bold text-white">Artists</h1>
                  <span className="text-zinc-500 text-sm font-medium">{artists.length} Artists</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                  {artists.map(artist => {
                      // Get representative image
                      const artistSong = songs.find(s => s.artist === artist && s.cover);
                      const image = artistSong?.cover;

                      return (
                          <div key={artist} className="group cursor-pointer text-center" onClick={() => onSelectArtist(artist)}>
                              <div className="relative aspect-square mb-4 rounded-full overflow-hidden bg-zinc-900 shadow-lg mx-auto w-full max-w-[200px] border border-zinc-800">
                                  {image ? (
                                      <img src={image} alt={artist} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                          <Mic2 size={48} />
                                      </div>
                                  )}
                              </div>
                              <h3 className="text-white font-medium text-base truncate group-hover:text-apple-red transition-colors">{artist}</h3>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  // --- VIEW SWITCHING ---

  if (view === 'songs') {
      return (
        <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
            {renderSongsList(songs)}
        </div>
      );
  }

  if (view === 'recently_added') {
      // Assuming songs are added to the end of the array, reverse them
      const recentSongs = [...songs].reverse();
      return (
        <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
            {renderSongsList(recentSongs, true)}
        </div>
      );
  }

  if (view === 'albums') {
      return (
          <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
              {renderAlbumsGrid()}
          </div>
      );
  }

  if (view === 'artists') {
      return (
          <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
              {renderArtistsGrid()}
          </div>
      );
  }

  // --- DEFAULT HOME VIEW ---

  // Extract albums from song list or use defined tracklists
  const definedAlbums = Object.keys(albumTracklists);
  const otherSongs = songs.filter(s => !definedAlbums.includes(s.album));

  return (
    <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
      {/* Header / Hero */}
      <div className="px-8 pt-10 pb-6 border-b border-zinc-900">
        <h1 className="text-3xl font-bold text-white mb-1">{Greeting()}</h1>
        <p className="text-zinc-400 text-sm">Welcome back to your music collection.</p>
      </div>

      <div className="p-8 space-y-10">
        
        {/* Albums Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Albums</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {definedAlbums.map((albumName) => {
                const cover = getAlbumCover(albumName);
                return (
                  <div key={albumName} className="group cursor-pointer" onClick={() => onSelectAlbum(albumName)}>
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-zinc-900 shadow-lg transition-all duration-300 group-hover:shadow-2xl">
                      {cover ? (
                          <img 
                            src={cover} 
                            alt={albumName} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                      ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
                             <Music size={48} />
                          </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                         <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:scale-110 hover:bg-apple-red hover:text-white text-white transition-all ml-auto mb-1 shadow-lg">
                            <Play size={20} fill="currentColor" className="ml-0.5"/>
                         </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm truncate leading-tight group-hover:underline decoration-white/50">{albumName}</h3>
                      <p className="text-zinc-500 text-xs mt-1 truncate group-hover:text-zinc-400">Album</p>
                    </div>
                  </div>
                );
            })}
          </div>
        </section>

        {/* Playlists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Playlists</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {MOCK_PLAYLISTS.map((playlist) => (
              <div key={playlist.id} className="group cursor-pointer">
                <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-zinc-900 shadow-lg">
                  <img 
                    src={playlist.cover} 
                    alt={playlist.title} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                     <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:scale-110 hover:bg-apple-red hover:text-white text-white transition-all ml-auto mb-1 shadow-lg">
                        <Play size={20} fill="currentColor" className="ml-0.5"/>
                     </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm truncate leading-tight group-hover:underline decoration-white/50">{playlist.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1 truncate">{playlist.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Songs / Other */}
         <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">More Songs</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {otherSongs.length > 0 ? (
               otherSongs.map((song) => {
                  const cover = getSongCover(song);
                  return (
                      <div 
                          key={song.id} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900/60 group cursor-pointer transition-colors"
                          onClick={() => onPlaySong(song)}
                      >
                         <div className="relative w-12 h-12 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                            {cover ? (
                                <img src={cover} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <Music size={20} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                <Play size={16} fill="white" className="text-white"/>
                            </div>
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">{song.title}</div>
                            <div className="text-xs text-zinc-500 truncate">{song.artist}</div>
                         </div>
                         <div className="flex items-center gap-3">
                            {isDevMode && onEditSong && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEditSong(song); }}
                                    className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Edit size={14} />
                                </button>
                            )}
                            <div className="text-xs text-zinc-600 font-medium tabular-nums pr-2">
                                {song.duration}
                            </div>
                         </div>
                      </div>
                  );
               })
             ) : (
                <div className="col-span-full text-center text-zinc-500 py-10">
                   No other songs.
                </div>
             )}
          </div>
        </section>

        <div className="pt-10 text-center pb-10">
            <p className="text-zinc-600 text-xs">Copyright © 2025 Music Clone. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MainContent;