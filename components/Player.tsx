import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Mic2, List } from 'lucide-react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
  onTimeUpdate: (time: number) => void;
  seekTime: number | null; // Receive seek command
  disableGifs: boolean;
}

// Silent MP3 frame to keep audio session active
const SILENT_MP3 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAATEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//OEAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAA==";

const Player: React.FC<PlayerProps> = ({ 
  currentSong, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrev,
  onToggleLyrics,
  isLyricsOpen,
  onTimeUpdate,
  seekTime,
  disableGifs
}) => {
  const [volume, setVolume] = useState(75);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const heartbeatRef = useRef<HTMLAudioElement>(null);

  // Handle external seek requests
  useEffect(() => {
    if (seekTime !== null && audioRef.current) {
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
        if (duration) setProgress((seekTime / duration) * 100);
    }
  }, [seekTime, duration]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Playback prevented:", error);
          });
        }
        // Also play heartbeat
        if (heartbeatRef.current && heartbeatRef.current.paused) {
            heartbeatRef.current.play().catch(() => {});
        }
      } else {
        audioRef.current.pause();
        // Pause heartbeat when music pauses
        if (heartbeatRef.current) {
            heartbeatRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Set heartbeat volume to 0 programmatically
  useEffect(() => {
    if (heartbeatRef.current) {
      heartbeatRef.current.volume = 0;
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      if (!isNaN(dur)) {
        setCurrentTime(current);
        setDuration(dur);
        setProgress((current / dur) * 100);
        onTimeUpdate(current); // Broadcast time up
      }
    }
  };

  const handleLoadedMetadata = () => {
     if (audioRef.current) {
         setDuration(audioRef.current.duration);
         if (isPlaying) {
             audioRef.current.play().catch(e => console.log(e));
         }
     }
  };

  const handleEnded = () => {
    onNext();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (audioRef.current && duration) {
       const newTime = (val / 100) * duration;
       audioRef.current.currentTime = newTime;
       setCurrentTime(newTime);
       setProgress(val);
       onTimeUpdate(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingTime = duration - currentTime;

  if (!currentSong) return null;

  const coverUrl = (!disableGifs && currentSong.animatedCover) ? currentSong.animatedCover : (currentSong.cover || 'https://picsum.photos/400/400');

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-[88px] flex items-center px-4 md:px-6 z-50 select-none transition-all duration-500 ${
      isLyricsOpen 
        ? 'bg-transparent text-white' 
        : 'bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800'
    }`}>
      <audio 
        ref={audioRef}
        src={currentSong.fileUrl}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      {/* Heartbeat Audio: Keeps AudioContext active */}
      <audio 
        ref={heartbeatRef}
        src={SILENT_MP3}
        loop
        autoPlay={isPlaying}
      />

      <div className={`flex items-center w-1/3 min-w-[200px] transition-opacity duration-500 ${isLyricsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="relative group cursor-pointer" onClick={onToggleLyrics}>
          <img 
            src={coverUrl} 
            alt="Cover" 
            className="w-12 h-12 rounded-[4px] shadow-lg border border-zinc-800 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-[4px]">
             <span className="text-white text-xs">Expand</span>
          </div>
        </div>
        <div className="ml-4 flex flex-col justify-center overflow-hidden">
          <div className="text-sm font-medium text-white truncate cursor-default hover:underline">
            {currentSong.title}
          </div>
          <div className="text-xs text-zinc-400 truncate cursor-pointer hover:text-white hover:underline">
            {currentSong.artist}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-1/3">
        <div className="flex items-center gap-6 mb-1">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Shuffle size={18} />
          </button>
          <button className="text-zinc-200 hover:text-white transition-colors" onClick={onPrev}>
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            className="text-white hover:scale-105 transition-transform" 
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" />}
          </button>
          <button className="text-zinc-200 hover:text-white transition-colors" onClick={onNext}>
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Repeat size={18} />
          </button>
        </div>
        
        <div className="w-full max-w-md flex items-center gap-2 group">
          <span className="text-[10px] font-medium text-zinc-500 w-8 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 h-1 bg-zinc-600 rounded-full relative cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-zinc-800 rounded-full"></div>
            <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-colors ${isLyricsOpen ? 'bg-white/80' : 'bg-zinc-400 group-hover:bg-apple-red'}`}
                style={{ width: `${progress}%` }}
            ></div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 w-8 tabular-nums">
            -{formatTime(remainingTime)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end w-1/3 gap-4">
        <button 
          className={`transition-colors ${isLyricsOpen ? 'text-apple-red bg-zinc-800/50 rounded p-1' : 'text-zinc-400 hover:text-white'}`}
          onClick={onToggleLyrics}
        >
          <Mic2 size={18} fill={isLyricsOpen ? "currentColor" : "none"}/>
        </button>
        <div className="flex items-center gap-2 w-24">
          <Volume2 size={18} className="text-zinc-400" />
          <div className="flex-1 h-1 bg-zinc-600 rounded-full relative group">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full ${isLyricsOpen ? 'bg-white/80' : 'bg-zinc-400 group-hover:bg-white'}`}
              style={{ width: `${volume}%` }}
            ></div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;