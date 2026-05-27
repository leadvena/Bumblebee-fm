import React from 'react';
import { Track } from '../types';
import { PlaySquare, Calendar, Sparkles, FolderHeart } from 'lucide-react';

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
  return (
    <div className="w-full max-w-[480px] mx-auto p-2 select-none">
      <div 
        className={`w-full ${themeStyle.surface} border-4 ${themeStyle.border} p-4`}
        style={{ boxShadow: '4px 4px 0px #0F0A00' }}
      >
        {/* Header Grid */}
        <h2 className="font-press-start text-[12px] text-[#FFF8E7] border-b-2 border-dashed border-[#A89060] pb-2 mb-4 uppercase tracking-wider">
          ★ FLIGHT LOGS / HISTORY
        </h2>

        {/* Smart playlist generator block */}
        {history.length > 0 && (
          <div className="mb-6 p-3 border-2 border-[#D4A017] bg-[#0F0A00] text-center">
            <h3 className="font-press-start text-[8px] text-[#FFD166] uppercase mb-1.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              SMART PLAYLIST SYNTHESIS
            </h3>
            <p className="text-[11px] font-sans text-[#A89060] mb-3 leading-snug">
              BUMBLEBEE can generate a custom 10-track playlist based on your recent listening pattern.
            </p>
            <button
              onClick={onBuildPlaylist}
              className="w-full py-2 bg-[#C87941] border-2 border-[#D4A017] text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00] font-press-start text-[9px] uppercase transition-colors cursor-pointer"
              style={{ boxShadow: '2px 2px 0px #0F0A00' }}
              id="btn-history-build-playlist"
            >
              ★ BUILD PLAYLIST FROM LOGS ★
            </button>
          </div>
        )}

        {/* History Items list */}
        <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#A89060]/30 bg-[#0F0A00]/40 p-4">
              <Calendar className="w-8 h-8 text-[#A89060]/30 mx-auto mb-2" />
              <p className="font-sans text-[13px] text-[#A89060]">
                Flight logs are completely blank.
              </p>
              <p className="font-sans text-[11px] text-[#A89060]/60 mt-1">
                Play some songs to register logs in your storage capsule!
              </p>
            </div>
          ) : (
            history.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="flex items-center gap-3 p-2 border-2 border-[#D4A017]/40 bg-[#0F0A00] hover:border-[#D4A017] transition-all group"
                id={`history-item-${track.id}`}
              >
                {/* Visual Number Bullet */}
                <div className="font-press-start text-[8px] text-[#A89060] w-6 text-center text-mono shrink-0">
                  #{(index + 1).toString().padStart(2, '0')}
                </div>

                {/* Cover thumbnail */}
                <img 
                  src={track.thumbnail} 
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover border border-[#A89060]/40 shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Info details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-press-start text-[8px] text-[#FFF8E7] truncate uppercase tracking-wide">
                    {track.title}
                  </h4>
                  <p className="text-[11px] font-sans text-[#A89060] truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Instant Play */}
                <button
                  onClick={() => onPlayTrack(track)}
                  className="p-1.5 bg-[#1C1408] border border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F0A00] shrink-0 cursor-pointer"
                  title="Play Track Now"
                  id={`btn-history-play-now-${index}`}
                >
                  <PlaySquare className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
