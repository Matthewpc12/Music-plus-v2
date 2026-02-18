import React from 'react';
import { Play, Shuffle, Clock, MoreHorizontal, ArrowLeft, ChevronRight, Music } from 'lucide-react';
import { Song } from '../types';

interface ArtistDetailViewProps {
  artistName: string;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onBack: () => void;
  onSelectAlbum: (albumName: string) => void;
  disableGifs: boolean;
}

const ArtistDetailView: React.FC<ArtistDetailViewProps> = ({ 
    artistName, 
    songs, 
    onPlaySong, 
    onBack, 
    onSelectAlbum,
    disableGifs 
}) => {
  // Filter songs by artist
  const artistSongs = songs.filter(s => s.artist === artistName);
  
  // Get unique albums
  const albums = Array.from(new Set(artistSongs.map(s => s.album)));
  
  // Get representative image (from first song with cover)
  const heroSong = artistSongs.find(s => s.animatedCover || s.cover);
  const heroImage = (!disableGifs && heroSong?.animatedCover) ? heroSong.animatedCover : heroSong?.cover;

  return (
    <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
       {/* Hero / Header */}
       <div className="relative h-64 md:h-80 w-full overflow-hidden">
          {heroImage && (
              <>
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </>
          )}
          
          <div className="absolute top-6 left-8 z-10">
             <button 
                onClick={onBack}
                className="flex items-center gap-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium transition-all"
             >
                <ArrowLeft size={14} />
                Artists
             </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black to-transparent">
             <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">{artistName}</h1>
          </div>
       </div>

       <div className="p-8 space-y-10">
           
           {/* Actions */}
           <div className="flex items-center gap-4">
                <button 
                    onClick={() => artistSongs.length > 0 && onPlaySong(artistSongs[0])}
                    className="flex items-center gap-2 bg-apple-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-transform hover:scale-105 shadow-lg"
                >
                    <Play size={18} fill="currentColor" />
                    Play
                </button>
                <button 
                    onClick={() => {
                        const random = artistSongs[Math.floor(Math.random() * artistSongs.length)];
                        if(random) onPlaySong(random);
                    }}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-apple-red px-6 py-3 rounded-lg font-bold text-sm transition-colors"
                >
                    <Shuffle size={18} />
                    Shuffle
                </button>
           </div>

           {/* Top Songs */}
           <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 Top Songs
                 <ChevronRight size={20} className="text-zinc-600" />
              </h2>
              <div className="grid grid-cols-1 gap-1">
                 {artistSongs.slice(0, 5).map((song, idx) => (
                    <div 
                        key={song.id}
                        className="group flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        onDoubleClick={() => onPlaySong(song)}
                    >
                        <div className="w-8 text-center text-zinc-500 font-medium group-hover:text-white">
                            <span className="group-hover:hidden">{idx + 1}</span>
                            <button onClick={() => onPlaySong(song)} className="hidden group-hover:block mx-auto text-zinc-300 hover:text-white">
                                <Play size={14} fill="currentColor"/>
                            </button>
                        </div>
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <img src={(!disableGifs && song.animatedCover) ? song.animatedCover : song.cover || 'https://picsum.photos/400/400'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{song.title}</div>
                            <div className="text-xs text-zinc-500 truncate">{song.album}</div>
                        </div>
                        <div className="text-xs text-zinc-500 font-tabular-nums pr-4">
                            {song.duration}
                        </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* Albums */}
           <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 Albums
                 <ChevronRight size={20} className="text-zinc-600" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {albums.map(album => {
                     // Find cover for this album
                     const albumSong = artistSongs.find(s => s.album === album);
                     const cover = (!disableGifs && albumSong?.animatedCover) ? albumSong.animatedCover : albumSong?.cover;
                     
                     return (
                         <div key={album} className="group cursor-pointer" onClick={() => onSelectAlbum(album)}>
                            <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-zinc-900 shadow-lg transition-transform hover:scale-[1.02]">
                                {cover ? (
                                    <img src={cover} alt={album} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <Music size={48} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-medium text-sm truncate leading-tight group-hover:underline">{album}</h3>
                                <p className="text-zinc-500 text-xs mt-1 truncate">2024 • Album</p>
                            </div>
                         </div>
                     );
                 })}
              </div>
           </section>
       </div>
    </div>
  );
};

export default ArtistDetailView;