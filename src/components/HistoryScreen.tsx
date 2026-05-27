import React from 'react';
import { Track } from '../types';
import { PlaySquare, Calendar, Sparkles, FolderHeart, NotebookTabs } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryScreenProps {
  history: Track[];
  themeStyle: any;
  onPlayTrack: (track: Track) => void;
  onBuildPlaylist: () => void;
}

export default function HistoryScreen({
  history,
  themeStyle,
  onPlayTrack,
  onBuildPlaylist
}: HistoryScreenProps) {
  const accentColor = themeStyle.accentColor;
  const textColor = themeStyle.textColor;

  return (
    <div className="w-full max-w-[480px] mx-auto p-1.5 select-none font-sans">
      <div 
        className={`w-full ${themeStyle.surface} border-4 ${themeStyle.border} p-4 relative overflow-hidden`}
        style={{ 
          boxShadow: '4px 4px 0px #0F0A00',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-12 h-12 opacity-10 pointer-events-none" 
             style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent)` }} />

        {/* Header Grid */}
        <div className="flex items-center justify-between border-b border-[#D4A017]/35 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <NotebookTabs className="w-4 h-4" style={{ color: accentColor }} />
            <h2 className="font-press-start text-[11px] text-[#FFF8E7] uppercase tracking-wider">
              FLIGHT LOGS // HISTORIC
            </h2>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-black/40 border border-dashed border-[#D4A017]/40 text-[#D4A017]">
            TOTAL: {history.length} ITEMS
          </span>
        </div>

        {/* Smart playlist generator block */}
        {history.length > 0 && (
          <div 
            className="mb-5 p-3 border-2 bg-black/50 text-center relative overflow-hidden"
            style={{ borderColor: accentColor }}
          >
            <h3 className="font-press-start text-[7.5px] uppercase mb-2 flex items-center justify-center gap-1.5" style={{ color: themeStyle.glow }}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              SMART PLAYLIST SYNTHESIS
            </h3>
            <p className="text-[11px] font-sans text-stone-400 mb-3 leading-snug">
              Bumblebee will leverage recent flight logs to synthesize an energetic 10-track playlist recommendations deck.
            </p>
            <button
              onClick={onBuildPlaylist}
              className="w-full py-2 border cursor-pointer font-press-start text-[8px] uppercase tracking-wider transition-all hover:bg-stone-800"
              style={{ 
                backgroundColor: accentColor, 
                borderColor: accentColor,
                color: '#0F0A00' 
              }}
              id="btn-history-build-playlist"
            >
              ★ COMPILE RECOMMENDED DECK ★
            </button>
          </div>
        )}

        {/* History Items list */}
        <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-800 bg-black/20 p-4">
              <Calendar className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <p className="font-press-start text-[7px] text-stone-500 uppercase tracking-wide">
                Flight logs are blank.
              </p>
              <p className="font-sans text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                Play some songs to register high-fidelity activity lines in your hardware memory bank!
              </p>
            </div>
          ) : (
            history.map((track, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                key={`${track.id}-${index}`}
                className="flex items-center gap-3 p-1.5 border bg-black/60 hover:bg-black/90 hover:translate-x-1 transition-all group"
                style={{ 
                  borderColor: `${accentColor}25`,
                  imageRendering: 'pixelated'
                }}
                id={`history-item-${track.id}`}
              >
                {/* Visual Number Bullet */}
                <div className="font-press-start text-[8.5px] text-stone-500 w-6 text-center text-mono shrink-0">
                  #{(index + 1).toString().padStart(2, '0')}
                </div>

                {/* Cover thumbnail */}
                <img 
                  src={track.thumbnail} 
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover border border-stone-800 shrink-0"
                />

                {/* Info details */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-press-start text-[7.5px] text-[#FFF8E7] truncate uppercase tracking-widest">
                    {track.title}
                  </h4>
                  <p className="text-[10.5px] font-sans text-stone-400 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>

                {/* Instant Play */}
                <button
                  onClick={() => onPlayTrack(track)}
                  className="p-1.5 bg-[#1C1408]/30 border text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F0A00] transition-colors shrink-0 cursor-pointer"
                  style={{ borderColor: `${accentColor}35` }}
                  title="Play Track Now"
                  id={`btn-history-play-now-${index}`}
                >
                  <PlaySquare className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
