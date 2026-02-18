import React, { useState, useRef } from 'react';
import { X, Youtube, Download, Loader2, CheckCircle2, AlertCircle, Music, Upload, FileText } from 'lucide-react';
import { DownloadTask, Song } from '../types';

interface AddMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (url: string) => void;
  onUpload: (file: File) => void;
  onLyricUpload: (filename: string, file: File) => void;
  tasks: DownloadTask[];
  songs: Song[];
}

const AddMusicModal: React.FC<AddMusicModalProps> = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  onUpload, 
  onLyricUpload,
  tasks, 
  songs 
}) => {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'yt' | 'upload' | 'lyrics'>('yt');
  const [selectedSongFilename, setSelectedSongFilename] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lyricInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onDownload(url);
      setUrl('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = ''; // Reset
    }
  };

  const handleLyricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSongFilename) {
      onLyricUpload(selectedSongFilename, file);
      e.target.value = ''; // Reset
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'error': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Loader2 className="animate-spin text-apple-red" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="text-apple-red" />
            Management
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-black/20">
            <button 
                onClick={() => setActiveTab('yt')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'yt' ? 'text-apple-red border-b-2 border-apple-red' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                YouTube
            </button>
            <button 
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'upload' ? 'text-apple-red border-b-2 border-apple-red' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Local Upload
            </button>
            <button 
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'lyrics' ? 'text-apple-red border-b-2 border-apple-red' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Lyrics
            </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {activeTab === 'yt' && (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">YouTube URL</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste link (Video or Playlist)..." 
                                className="w-full bg-black border border-zinc-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-apple-red focus:ring-1 focus:ring-apple-red placeholder-zinc-600 transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!url.trim()}
                            className="bg-apple-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Fetch
                        </button>
                    </div>
                </div>
            </form>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-apple-red bg-black/40 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                    <Upload className="text-zinc-500 mb-4 group-hover:text-apple-red transition-colors" size={48} />
                    <p className="text-sm font-medium text-zinc-300">Click to upload Audio</p>
                    <p className="text-xs text-zinc-500 mt-2">Supports MP3, WAV, M4A</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="audio/*" 
                        onChange={handleFileChange} 
                    />
                </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Target Song</label>
                    <select 
                        className="w-full bg-black border border-zinc-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-apple-red"
                        value={selectedSongFilename}
                        onChange={(e) => setSelectedSongFilename(e.target.value)}
                    >
                        <option value="">Select a song from library...</option>
                        {songs.map(song => (
                            <option key={song.filename} value={song.filename}>
                                {song.title} - {song.artist}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div 
                    onClick={() => selectedSongFilename && lyricInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${selectedSongFilename ? 'border-zinc-700 hover:border-apple-red cursor-pointer bg-black/40' : 'border-zinc-800 opacity-50 cursor-not-allowed'}`}
                >
                    <FileText className="text-zinc-500 mb-4" size={48} />
                    <p className="text-sm font-medium text-zinc-300">Upload Lyrics File</p>
                    <p className="text-xs text-zinc-500 mt-2">Supports .lrc or .txt</p>
                    <input 
                        type="file" 
                        ref={lyricInputRef} 
                        className="hidden" 
                        accept=".lrc,.txt" 
                        onChange={handleLyricChange} 
                    />
                </div>
            </div>
          )}

          {/* Active Tasks Activity */}
          {tasks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Activity</h3>
              <div className="space-y-2">
                {tasks.slice().reverse().map((task) => (
                  <div key={task.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-sm font-bold text-white truncate">
                        {task.url.length > 30 ? task.url.substring(0, 30) + '...' : task.url}
                      </div>
                      <div className="text-xs text-zinc-400 capitalize flex items-center gap-1.5 mt-1">
                        {task.status}
                      </div>
                    </div>
                    {getStatusIcon(task.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-center">
             <p className="text-[10px] text-zinc-600 font-medium">Changes will be visible after the server processes the files.</p>
        </div>
      </div>
    </div>
  );
};

export default AddMusicModal;