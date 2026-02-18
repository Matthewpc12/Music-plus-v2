import React, { useState } from 'react';
import { Home, Grid, Radio, Clock, Mic2, Library, Disc, Music, ListMusic, PlusSquare, Search, Download, Lock, Unlock, Settings } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onChangeView: (view: View) => void;
  onOpenAddMusic: () => void;
  isDevMode: boolean;
  onUnlockDev: (code: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, onOpenAddMusic, isDevMode, onUnlockDev }) => {
  const [devCode, setDevCode] = useState('');
  const [showDevInput, setShowDevInput] = useState(false);

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
      isActive ? 'bg-zinc-800 text-apple-red' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    }`;

  const iconSize = 20;

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlockDev(devCode)) {
      setDevCode('');
      setShowDevInput(false);
    } else {
      alert('Incorrect Code');
    }
  };

  return (
    <div className="w-64 bg-black flex-shrink-0 flex flex-col h-full border-r border-zinc-800 pt-8 pb-20 overflow-y-auto hidden md:flex z-20 relative">
      <div className="px-5 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-apple-red focus:ring-1 focus:ring-apple-red placeholder-zinc-500"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-6">
        <div className="space-y-1">
          <div 
            className={navItemClass(activeView === 'home')}
            onClick={() => onChangeView('home')}
          >
            <Home size={iconSize} />
            Home
          </div>
          <div 
            className={navItemClass(activeView === 'browse')}
            onClick={() => onChangeView('browse')}
          >
            <Grid size={iconSize} />
            Browse
          </div>
          <div 
            className={navItemClass(activeView === 'radio')}
            onClick={() => onChangeView('radio')}
          >
            <Radio size={iconSize} />
            Radio
          </div>
        </div>

        {isDevMode && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Management</h3>
            <button 
              onClick={onOpenAddMusic}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-apple-red hover:text-white py-2 rounded-lg text-sm font-medium transition-all"
            >
                <Download size={16} />
                Add & Edit Music
            </button>
          </div>
        )}

        <div>
          <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Library</h3>
          <div className="space-y-1">
            <div 
              className={navItemClass(activeView === 'recently_added')}
              onClick={() => onChangeView('recently_added')}
            >
              <Clock size={iconSize} />
              Recently Added
            </div>
            <div 
              className={navItemClass(activeView === 'artists' || activeView === 'artist_detail')}
              onClick={() => onChangeView('artists')}
            >
              <Mic2 size={iconSize} />
              Artists
            </div>
            <div 
              className={navItemClass(activeView === 'albums')}
              onClick={() => onChangeView('albums')}
            >
              <Disc size={iconSize} />
              Albums
            </div>
            <div 
              className={navItemClass(activeView === 'songs')}
              onClick={() => onChangeView('songs')}
            >
              <Music size={iconSize} />
              Songs
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-900 mt-4 space-y-2">
          <div 
            className={navItemClass(activeView === 'settings')}
            onClick={() => onChangeView('settings')}
          >
            <Settings size={iconSize} />
            Settings
          </div>
          
          {!isDevMode ? (
            <div className="px-3">
              {!showDevInput ? (
                <button 
                  onClick={() => setShowDevInput(true)}
                  className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <Lock size={12} />
                  Developer Access
                </button>
              ) : (
                <form onSubmit={handleDevSubmit} className="flex flex-col gap-2">
                  <input 
                    autoFocus
                    type="password"
                    placeholder="Enter Code"
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-xs px-2 py-1 rounded outline-none text-white placeholder-zinc-700"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-[10px] bg-apple-red text-white px-2 py-1 rounded">Unlock</button>
                    <button type="button" onClick={() => setShowDevInput(false)} className="text-[10px] text-zinc-500">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="px-3 flex items-center gap-2 text-xs text-green-600 font-medium">
              <Unlock size={12} />
              Admin Verified
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;