import React from 'react';
import { Play, Shuffle, Clock, MoreHorizontal, ArrowLeft, Edit, Music } from 'lucide-react';
import { Song } from '../types';

interface AlbumViewProps {
  albumName: string;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onBack: () => void;
  onShuffle: () => void;
  isDevMode: boolean;
  onEditSong: (song: Song) => void;
  disableGifs: boolean;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumName, songs, onPlaySong, onBack, onShuffle, isDevMode, onEditSong, disableGifs }) => {
  // Use the first song's cover as the album cover
  // If the cover is loading (undefined in App.tsx but queue is processing), it might show fallback
  // Once loaded, this re-renders
  const firstSong = songs[0];
  const albumCover = (!disableGifs && firstSong?.animatedCover) ? firstSong.animatedCover : firstSong?.cover;

  const artistName = firstSong ? firstSong.artist : 'Unknown Artist';
  const year = '2024'; // Fallback or could be parsed
  const totalDuration = songs.reduce((acc, s) => acc + s.durationSec, 0);
  const formatTotalTime = (sec: number) => {
      const min = Math.floor(sec / 60);
      return `${min} min`;
  };

  return (
    <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
      {/* Header */}
      <div className="p-8 pb-4">
        <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
            <ArrowLeft size={18} />
            Back to Library
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="w-64 h-64 shadow-2xl rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-800 flex items-center justify-center">
                {albumCover ? (
                     <img src={albumCover} alt={albumName} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600">
                        <Music size={64} />
                    </div>
                )}
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold uppercase tracking-widest text-apple-red mb-2">Album</h4>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-none tracking-tight">{albumName}</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                    <span className="text-white hover:underline cursor-pointer">{artistName}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{year}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{songs.length} songs, {formatTotalTime(totalDuration)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-4 flex items-center gap-4 border-b border-zinc-900/50">
         <button 
            onClick={() => firstSong && onPlaySong(firstSong)}
            className="w-14 h-14 bg-apple-red rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg hover:bg-red-600"
         >
            <Play size={28} fill="currentColor" className="ml-1" />
         </button>
         <button 
            onClick={onShuffle}
            className="p-3 text-zinc-400 hover:text-white transition-colors"
            title="Shuffle"
         >
            <Shuffle size={28} />
         </button>
      </div>

      {/* Tracklist */}
      <div className="px-8 py-4">
         <div className="grid grid-cols-[auto_1fr_auto] gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 px-4 border-b border-zinc-900 pb-2">
            <div className="w-8 text-center">#</div>
            <div>Title</div>
            <div className="flex items-center gap-2"><Clock size={14} /></div>
         </div>
         
         <div className="space-y-1">
            {songs.map((song, idx) => (
                <div 
                    key={song.id} 
                    className="group grid grid-cols-[auto_1fr_auto] gap-4 items-center p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-b border-transparent hover:border-zinc-800"
                    onDoubleClick={() => onPlaySong(song)}
                >
                    <div className="w-8 text-center text-zinc-500 font-medium group-hover:text-white">
                        <span className="group-hover:hidden">{idx + 1}</span>
                        <button onClick={() => onPlaySong(song)} className="hidden group-hover:block mx-auto text-zinc-300 hover:text-white">
                            <Play size={14} fill="currentColor"/>
                        </button>
                    </div>
                    <div className="min-w-0">
                        <div className="text-base font-medium text-white truncate">{song.title}</div>
                        <div className="text-sm text-zinc-500 truncate group-hover:text-zinc-400">{song.artist}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isDevMode && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEditSong(song); }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all"
                                title="Edit Metadata"
                            >
                                <Edit size={16} />
                            </button>
                        )}
                        <div className="text-sm font-variant-numeric tabular-nums text-zinc-500 group-hover:text-zinc-300">
                            {song.duration}
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AlbumView;