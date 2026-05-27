import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { searchYouTube } from '../utils/youtubeApi';
import { Search, Loader, PlusSquare, PlaySquare, HelpCircle } from 'lucide-react';

interface SearchScreenProps {
  themeStyle: any;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  statusText: string;
}

export default function SearchScreen({
  themeStyle,
  onPlayTrack,
  onAddToQueue,
  statusText
}: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 1. Initialise recent searches list
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bumblebee_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        // Safe starting tags
        const starters = ["Lofi chiptune", "8bit retro gaming", "Synthwave lounge", "Arcade hits"];
        setRecentSearches(starters);
        localStorage.setItem('bumblebee_recent_searches', JSON.stringify(starters));
      }
    } catch (e) {
      console.warn("recent searches storage access failed", e);
    }
  }, []);

  const triggerSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    try {
      setIsLoading(true);
      setQuery(targetQuery);
      console.log(`Bumblebee: Fetching tracks for "${targetQuery}"...`);
      const tracks = await searchYouTube(targetQuery);
      setResults(tracks);

      // Persist in Recent searches
      const filtered = recentSearches.filter(q => q.toLowerCase() !== targetQuery.toLowerCase());
      const newRecent = [targetQuery, ...filtered].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('bumblebee_recent_searches', JSON.stringify(newRecent));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerSearch(query);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto p-2 select-none">
      <div 
        className={`w-full ${themeStyle.surface} border-4 ${themeStyle.border} p-4`}
        style={{ boxShadow: '4px 4px 0px #0F0A00' }}
      >
        {/* Title */}
        <h2 className="font-press-start text-[12px] text-[#FFF8E7] border-b-2 border-dashed border-[#A89060] pb-2 mb-4 uppercase tracking-wider">
          ★ RADIO SEARCH TRANSCEIVER
        </h2>

        {/* Input Text Row */}
        <div className="flex gap-2 relative mb-4">
          <input
            type="text"
            placeholder="Type song, artist, genre..."
            className="flex-1 bg-[#0F0A00] border-2 border-[#D4A017] text-[#FFF8E7] px-3 py-2 text-[12px] rounded-none outline-none font-sans placeholder-[#A89060]/50 focus:border-[#FFD166]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            id="input-music-search-field"
          />
          <button
            onClick={() => triggerSearch(query)}
            disabled={isLoading}
            className="p-3 bg-[#C87941] border-2 border-[#D4A017] hover:bg-[#D4A017] text-[#FFF8E7] hover:text-[#0F0A00] cursor-pointer disabled:opacity-50"
            style={{ boxShadow: '2px 2px 0px #0F0A00' }}
            id="btn-music-search-execute"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Recent searches pills */}
        <div className="mb-6">
          <span className="font-press-start text-[7px] text-[#A89060] block tracking-wide uppercase mb-2">
            ■ POPULAR NEST SEARCHES
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((tag, idx) => (
              <button
                key={`${tag}-${idx}`}
                onClick={() => triggerSearch(tag)}
                className="bg-[#1C1408] border border-[#D4A017] hover:bg-[#C87941] text-[#F5E6C8] hover:text-[#FFF8E7] px-2 py-1 text-[10px] font-sans rounded-none transition-colors cursor-pointer"
                id={`btn-search-pill-${idx}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Display List */}
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-[#D4A017] mb-2" />
              <p className="font-press-start text-[8px] text-[#D4A017] uppercase tracking-widest animate-pulse">
                SCANNING AUDIO WAVES...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#A89060]/30 bg-[#0F0A00]/50 p-4">
              <Search className="w-8 h-8 text-[#A89060]/30 mx-auto mb-2" />
              <p className="font-sans text-[13px] text-[#A89060]">
                No active scans printed.
              </p>
              <p className="font-sans text-[11px] text-[#A89060]/60 mt-1">
                Enter text or speak commands to fill the board.
              </p>
            </div>
          ) : (
            results.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-2 border-2 border-[#D4A017]/40 bg-[#0F0A00] hover:border-[#D4A017] transition-all group"
                id={`search-item-${track.id}`}
              >
                {/* Thumbnail crop */}
                <img 
                  src={track.thumbnail} 
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 object-cover border border-[#A89060]/40 shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-press-start text-[8px] text-[#FFF8E7] truncate uppercase tracking-wide">
                    {track.title}
                  </h4>
                  <p className="text-[11px] font-sans text-[#A89060] truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Grid controls */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-1.5 bg-[#C87941] text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00] border border-[#0F0A00] active:translate-y-[1px] cursor-pointer"
                    title="Play Immediately"
                    id={`btn-search-p-play-${track.id}`}
                  >
                    <PlaySquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAddToQueue(track)}
                    className="p-1.5 bg-[#1C1408] border border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F0A00] active:translate-y-[1px] cursor-pointer"
                    title="Queue Track"
                    id={`btn-search-p-queue-${track.id}`}
                  >
                    <PlusSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
