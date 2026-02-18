import React, { useState, useRef } from 'react';
import { X, Save, Search, Music, Check, Loader2, Image as ImageIcon, Film, Upload, Disc, RefreshCw } from 'lucide-react';
import { Song } from '../types';
import { api } from '../api';

interface EditSongModalProps {
  song: Song;
  onClose: () => void;
  onSave: (filename: string, metadata: { title: string; artist: string; album: string }) => void;
}

const EditSongModal: React.FC<EditSongModalProps> = ({ song, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'artwork'>('details');

  // Metadata State
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album);
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Artwork State
  const [previewStatic, setPreviewStatic] = useState<string | null>(song.cover || null);
  const [previewAnimated, setPreviewAnimated] = useState<string | null>(song.animatedCover || null);
  
  // Pending Uploads
  const [pendingStaticFile, setPendingStaticFile] = useState<File | null>(null);
  const [pendingStaticUrl, setPendingStaticUrl] = useState<string | null>(null);
  const [pendingAnimatedFile, setPendingAnimatedFile] = useState<File | null>(null);
  
  const [applyToAlbum, setApplyToAlbum] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const staticInputRef = useRef<HTMLInputElement>(null);
  const animatedInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!title) return;
    setIsSearching(true);
    const term = `${title} ${artist !== 'Unknown Artist' ? artist : ''}`;
    const results = await api.searchTracks(term.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const applyMetadata = (result: any) => {
      setTitle(result.trackName);
      setArtist(result.artistName);
      setAlbum(result.collectionName);
      
      // Auto-select artwork if available
      if (result.artworkUrl100) {
          const highRes = result.artworkUrl100.replace('100x100bb', '1000x1000bb');
          setPreviewStatic(highRes);
          setPendingStaticUrl(highRes);
          setPendingStaticFile(null);
      }
  };

  const handleStaticFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setPendingStaticFile(file);
          setPendingStaticUrl(null);
          setPreviewStatic(URL.createObjectURL(file));
      }
  };

  const handleAnimatedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setPendingAnimatedFile(file);
          setPreviewAnimated(URL.createObjectURL(file));
      }
  };

  const handleSaveAll = async () => {
      setIsSaving(true);
      try {
          // 1. Save Metadata
          await api.updateMetadata(song.filename, { title, artist, album });

          // 2. Save Static Cover if Changed
          if (pendingStaticFile || pendingStaticUrl) {
              const key = applyToAlbum 
                ? `album:${artist.trim()}|${album.trim()}` 
                : `track:${song.filename}`;
              
              await api.saveCustomCover(key, pendingStaticFile || pendingStaticUrl!, 'static');
          }

          // 3. Save Animated Cover if Changed
          if (pendingAnimatedFile) {
              const key = applyToAlbum 
                ? `album:${artist.trim()}|${album.trim()}` 
                : `track:${song.filename}`;
              
              await api.saveCustomCover(key, pendingAnimatedFile, 'animated');
          }

          onSave(song.filename, { title, artist, album });
          onClose();
      } catch (e) {
          console.error("Save failed", e);
          alert("Failed to save changes. Check console.");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/95">
          <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="text-apple-red" size={24} />
                Edit Info
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-mono">{song.filename}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-zinc-800 bg-black/20">
            <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'details' ? 'text-white border-b-2 border-apple-red bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Metadata
            </button>
            <button 
                onClick={() => setActiveTab('artwork')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'artwork' ? 'text-white border-b-2 border-apple-red bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Artwork
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
            {activeTab === 'details' ? (
                <div className="space-y-6">
                    <div className="grid gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-apple-red focus:outline-none focus:ring-1 focus:ring-apple-red"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Artist</label>
                                <input 
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-apple-red focus:outline-none focus:ring-1 focus:ring-apple-red"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Album</label>
                                <input 
                                    type="text"
                                    value={album}
                                    onChange={(e) => setAlbum(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-apple-red focus:outline-none focus:ring-1 focus:ring-apple-red"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Search size={14} className="text-apple-red" />
                                Auto-Match Metadata
                            </h3>
                            <button 
                                onClick={handleSearch}
                                disabled={isSearching || !title}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12} />}
                                Search iTunes
                            </button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                {searchResults.map((result, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => applyMetadata(result)}
                                        className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-0"
                                    >
                                        <img src={result.artworkUrl100} alt="" className="w-10 h-10 rounded bg-zinc-800 object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">{result.trackName}</div>
                                            <div className="text-xs text-zinc-500 truncate">{result.artistName} • {result.collectionName}</div>
                                        </div>
                                        <div className="text-apple-red opacity-0 hover:opacity-100 px-2 text-xs font-bold">Use</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchResults.length === 0 && !isSearching && (
                            <div className="text-center py-6 text-zinc-600 text-xs italic">
                                Search above to find metadata from iTunes...
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Static Cover Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={14} />
                                Static Artwork (JPG/PNG)
                            </label>
                            {previewStatic && (
                                <button onClick={() => setPreviewStatic(null)} className="text-[10px] text-red-500 hover:underline">Clear</button>
                            )}
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-32 h-32 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden border border-zinc-700 relative group">
                                {previewStatic ? (
                                    <img src={previewStatic} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">Preview</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div 
                                    onClick={() => staticInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded-lg p-4 cursor-pointer text-center transition-all h-full flex flex-col items-center justify-center"
                                >
                                    <Upload size={20} className="text-zinc-500 mb-2" />
                                    <span className="text-xs text-zinc-400">Click to upload image</span>
                                </div>
                                <input type="file" ref={staticInputRef} className="hidden" accept="image/*" onChange={handleStaticFileChange} />
                            </div>
                        </div>
                    </div>

                    {/* Animated Cover Section */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Film size={14} />
                                Animated Artwork (GIF/WEBP)
                            </label>
                             {previewAnimated && (
                                <button onClick={() => setPreviewAnimated(null)} className="text-[10px] text-red-500 hover:underline">Clear</button>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="w-32 h-32 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden border border-zinc-700 relative group">
                                {previewAnimated ? (
                                    <img src={previewAnimated} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <Film size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div 
                                    onClick={() => animatedInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded-lg p-4 cursor-pointer text-center transition-all h-32 flex flex-col items-center justify-center"
                                >
                                    <Upload size={20} className="text-zinc-500 mb-2" />
                                    <span className="text-xs text-zinc-400">Upload Animation</span>
                                </div>
                                <input type="file" ref={animatedInputRef} className="hidden" accept="image/gif,image/webp,video/*" onChange={handleAnimatedFileChange} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${applyToAlbum ? 'bg-apple-red border-apple-red' : 'border-zinc-600 bg-transparent'}`}>
                                {applyToAlbum && <Check size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={applyToAlbum} onChange={e => setApplyToAlbum(e.target.checked)} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Apply Artwork to Album</span>
                                <span className="text-xs text-zinc-500">Update cover for all songs in "{album}"</span>
                            </div>
                            <Disc className="ml-auto text-zinc-600" size={20} />
                        </label>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/95 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-apple-red hover:bg-red-600 text-white shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditSongModal;