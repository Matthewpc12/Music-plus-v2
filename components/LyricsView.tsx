import React, { useEffect, useRef } from 'react';
import { Song } from '../types';
import { MessageSquareQuote, MoreHorizontal, X } from 'lucide-react';

interface LyricsViewProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ song, isOpen, onClose, isPlaying, currentTime, onSeek }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // Determine active line based on current time
  const getActiveIndex = () => {
    if (!song.lyrics || song.lyrics.length === 0) return -1;
    // Find the last line where time <= currentTime
    for (let i = song.lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= song.lyrics[i].time) {
        return i;
      }
    }
    return -1;
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    if (isOpen && activeLineRef.current && scrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden flex flex-col md:flex-row bg-black">
      {/* Background with Blur - using the album art as source */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-110"
        style={{ backgroundImage: `url(${song.cover})` }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
      
      {/* Top Bar for Mobile / Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-50 md:hidden">
         <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
            <X size={24} />
         </button>
      </div>
      
      {/* Close button Desktop */}
       <button onClick={onClose} className="hidden md:block absolute top-6 left-6 p-2 bg-black/10 hover:bg-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md z-50 transition-colors">
            <X size={24} />
       </button>


      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-6 md:p-16 gap-8 md:gap-16">
        
        {/* Left Side: Art & Info */}
        <div className="hidden md:flex flex-col justify-center w-1/3 max-w-sm h-full">
           <div className="aspect-square w-full rounded-lg shadow-2xl overflow-hidden mb-8 border border-white/10">
              <img src={song.cover} alt={song.album} className="w-full h-full object-cover" />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{song.title}</h1>
              <h2 className="text-xl text-white/80 font-medium">{song.artist}</h2>
              <p className="text-sm text-white/50 mt-1">{song.album} · {song.duration}</p>
           </div>
           
           <div className="mt-8 flex gap-4">
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                 <MoreHorizontal size={20} />
              </button>
           </div>
        </div>

        {/* Right Side: Lyrics */}
        <div 
            ref={scrollRef}
            className="flex-1 h-full overflow-y-auto no-scrollbar mask-gradient relative scroll-smooth"
        >
           {/* Mobile Art Header */}
           <div className="md:hidden flex gap-4 items-center mb-8 mt-10">
              <img src={song.cover} className="w-16 h-16 rounded-md shadow-lg" alt=""/>
              <div>
                  <h1 className="text-lg font-bold text-white">{song.title}</h1>
                  <p className="text-white/60 text-sm">{song.artist}</p>
              </div>
           </div>

           <div className="space-y-8 py-[50vh] max-w-2xl mx-auto md:mx-0">
             {song.lyrics && song.lyrics.length > 0 ? (
               song.lyrics.map((line, index) => {
                  const isActive = index === activeIndex;
                  // Lines slightly ahead or behind could have partial opacity
                  const isNear = Math.abs(index - activeIndex) <= 1;
                  
                  return (
                    <p 
                      key={index} 
                      ref={isActive ? activeLineRef : null}
                      onClick={() => onSeek(line.time)}
                      className={`text-2xl md:text-4xl font-bold transition-all duration-500 cursor-pointer origin-left ${
                        isActive 
                          ? 'text-white scale-100 blur-0 opacity-100' 
                          : 'text-white/40 blur-[1px] scale-95 hover:text-white/70 hover:blur-0'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
               })
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-white/50">
                  <MessageSquareQuote size={48} className="mb-4 opacity-50"/>
                  <p className="text-lg">Lyrics not available.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LyricsView;