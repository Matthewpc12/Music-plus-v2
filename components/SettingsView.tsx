import React from 'react';
import { Settings, Image, Info, ShieldCheck, Film, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  autoLoadCovers: boolean;
  onToggleAutoLoad: (enabled: boolean) => void;
  disableGifs: boolean;
  onToggleGifs: (enabled: boolean) => void;
  onReloadMetadata: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ autoLoadCovers, onToggleAutoLoad, disableGifs, onToggleGifs, onReloadMetadata }) => {
  return (
    <div className="flex-1 bg-black overflow-y-auto h-full pb-32">
      <div className="px-8 pt-10 pb-6 border-b border-zinc-900">
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your application preferences.</p>
      </div>

      <div className="p-8 max-w-2xl space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 uppercase text-[10px] font-bold tracking-widest px-1">
            <Image size={14} />
            Display & Performance
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="pr-4">
                <div className="text-sm font-medium text-white">Auto-load Album Covers</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Automatically fetch high-quality cover art for every song in your library on startup.
                </div>
              </div>
              <button 
                onClick={() => onToggleAutoLoad(!autoLoadCovers)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  autoLoadCovers ? 'bg-apple-red' : 'bg-zinc-700'
                }`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoLoadCovers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="pr-4">
                <div className="text-sm font-medium text-white">Disable Animated Covers</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Use static album artwork instead of animated GIFs or Videos to save battery and reduce motion.
                </div>
              </div>
              <button 
                onClick={() => onToggleGifs(!disableGifs)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  disableGifs ? 'bg-apple-red' : 'bg-zinc-700'
                }`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    disableGifs ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="pr-4">
                <div className="text-sm font-medium text-white">Reload Album Artwork</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Force the app to re-scan and fetch album covers for all songs in your library.
                </div>
              </div>
              <button 
                onClick={onReloadMetadata}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
              >
                <RefreshCw size={14} />
                Scan Now
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 uppercase text-[10px] font-bold tracking-widest px-1">
            <ShieldCheck size={14} />
            About
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-zinc-300">Server Version</span>
              <span className="text-xs text-zinc-500 font-mono">1.2.4-stable</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-zinc-300">App Version</span>
              <span className="text-xs text-zinc-500 font-mono">2.0.0</span>
            </div>
          </div>
        </section>

        <div className="pt-10 text-center opacity-30">
          <div className="flex justify-center mb-4">
             <Settings size={48} className="text-zinc-500" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
            Designed by Apple in California
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;