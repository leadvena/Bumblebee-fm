import React, { useState, useEffect } from 'react';
import { Track, Playlist } from '../types';
import { searchYouTube } from '../utils/youtubeApi';
import { 
  Search, 
  Loader, 
  PlusSquare, 
  PlaySquare, 
  FolderPlus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Music, 
  Mic, 
  Sliders, 
  Sparkles, 
  ListMusic, 
  Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchScreenProps {
  themeStyle: any;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  statusText: string;
  isListening?: boolean;
  onToggleListening?: () => void;
  
  // Lifted state props
  query: string;
  setQuery: (q: string) => void;
  results: Track[];
  setResults: (r: Track[]) => void;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
}

export default function SearchScreen({
  themeStyle,
  onPlayTrack,
  onAddToQueue,
  statusText,
  isListening = false,
  onToggleListening,
  query,
  setQuery,
  results,
  setResults,
  isLoading,
  setIsLoading
}: SearchScreenProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // Track state of expanded playlist selector drawer for each song
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [newPlaylistNames, setNewPlaylistNames] = useState<{ [trackId: string]: string }>({});
  const [successStates, setSuccessStates] = useState<{ [key: string]: boolean }>({});

  const accentColor = themeStyle.accentColor;
  const textColor = themeStyle.textColor;
  const glowShadow = { boxShadow: `0 0 12px ${accentColor}30` };

  // 1. Initialise and load dynamic registries from localStorage
  useEffect(() => {
    try {
      // Recent searches
      const storedSearches = localStorage.getItem('bumblebee_recent_searches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      } else {
        const starters = ["Lofi chiptune", "8bit retro gaming", "Synthwave lounge", "Arcade hits"];
        setRecentSearches(starters);
        localStorage.setItem('bumblebee_recent_searches', JSON.stringify(starters));
      }

      // Playlists
      const storedPlaylists = localStorage.getItem('bumblebee_saved_playlists');
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      } else {
        const defaults: Playlist[] = [
          {
            id: 'p-starter-lofi',
            name: 'AMBER NECTAR LOFI',
            tracks: [
              {
                id: 'A7_tXscfU00',
                title: 'Lofi Chiptune Radio - Cozy Retro Chill Beats',
                artist: 'Bumblebee Chill Station',
                thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=60'
              }
            ]
          }
        ];
        setPlaylists(defaults);
        localStorage.setItem('bumblebee_saved_playlists', JSON.stringify(defaults));
      }
    } catch (e) {
      console.warn("Storage access failed from SearchScreen", e);
    }
  }, []);

  // Sync spoken text directly if user uses voice interface
  useEffect(() => {
    if (statusText && statusText !== 'Standby' && statusText !== 'Listening...' && statusText.startsWith('"')) {
      const parsedQuery = statusText.replace(/"/g, '');
      if (parsedQuery.trim()) {
        setQuery(parsedQuery);
        triggerSearch(parsedQuery);
      }
    }
  }, [statusText]);

  const triggerSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    try {
      setIsLoading(true);
      setQuery(targetQuery);
      console.log(`Bumblebee Network: Fetching YouTube metadata for query "${targetQuery}"`);
      const tracks = await searchYouTube(targetQuery);
      setResults(tracks);

      // Save recent query
      const filtered = recentSearches.filter(q => q.toLowerCase() !== targetQuery.toLowerCase());
      const newRecent = [targetQuery, ...filtered].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('bumblebee_recent_searches', JSON.stringify(newRecent));
    } catch (err) {
      console.error("YouTube search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerSearch(query);
    }
  };

  // Add search item to an existing playlist
  const handleAddToPlaylist = (playlistId: string, track: Track) => {
    const originalPlaylists = [...playlists];
    const targetPlaylist = originalPlaylists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    // Check duplicate
    const exists = targetPlaylist.tracks.some(t => t.id === track.id);
    let updatedTracks = [...targetPlaylist.tracks];
    if (!exists) {
      updatedTracks.push(track);
    }

    const updatedPlaylists = originalPlaylists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: updatedTracks };
      }
      return p;
    });

    setPlaylists(updatedPlaylists);
    localStorage.setItem('bumblebee_saved_playlists', JSON.stringify(updatedPlaylists));

    // Success animation state
    const stateKey = `${track.id}-${playlistId}`;
    setSuccessStates(prev => ({ ...prev, [stateKey]: true }));
    setTimeout(() => {
      setSuccessStates(prev => ({ ...prev, [stateKey]: false }));
    }, 2000);

    // Speak announcement if speaker engine exists
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Added ${track.title.substring(0, 20)} to cartridge ${targetPlaylist.name}`);
        utterance.pitch = 1.35;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  };

  // Create new playlist on the fly and add this track
  const handleCreateAndAdd = (track: Track) => {
    const listName = newPlaylistNames[track.id]?.trim();
    if (!listName) return;

    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      name: listName.toUpperCase(),
      tracks: [track]
    };

    const updatedPlaylists = [newPlaylist, ...playlists];
    setPlaylists(updatedPlaylists);
    localStorage.setItem('bumblebee_saved_playlists', JSON.stringify(updatedPlaylists));

    // Clear form state
    setNewPlaylistNames(prev => ({ ...prev, [track.id]: '' }));

    // Success animation state
    const stateKey = `${track.id}-new`;
    setSuccessStates(prev => ({ ...prev, [stateKey]: true }));
    setTimeout(() => {
      setSuccessStates(prev => ({ ...prev, [stateKey]: false }));
    }, 2000);

    // Sound effect speak
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Created cartridge ${listName} with ${track.title.substring(0, 15)}`);
        utterance.pitch = 1.4;
        utterance.rate = 1.15;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  };

  const togglePlaylistDrawer = (trackId: string) => {
    setExpandedTrackId(prev => (prev === trackId ? null : trackId));
  };

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
        <div className="absolute top-0 right-0 w-12 h-12 opacity-15 pointer-events-none" 
             style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent)` }} />

        {/* Title Header with responsive visual accents */}
        <div className="flex items-center justify-between border-b border-[#D4A017]/35 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4" style={{ color: accentColor }} />
            <h2 className="font-press-start text-[11px] text-[#FFF8E7] uppercase tracking-wider">
              WAVE SCANNER TRANSCEIVER
            </h2>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-black/40 border border-dashed border-[#D4A017]/40 text-[#D4A017]">
            FREQ: 2.4GHZ
          </span>
        </div>

        {/* Search Input Box Area */}
        <div className="flex gap-2 relative mb-4">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 w-4 h-4 pointer-events-none" style={{ color: `${accentColor}70` }} />
            <input
              type="text"
              placeholder="Search songs, custom lo-fi, 8-bit remixes..."
              className="w-full bg-[#080502]/95 border-2 text-[#FFF8E7] pl-9 pr-12 py-2.5 text-[12px] font-sans rounded-none outline-none placeholder-[#A89060]/50 transition-all focus:border-[#FFD166] uppercase"
              style={{ borderColor: accentColor }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              id="input-music-search-field"
            />
            
            {/* Embedded voice mic hotkey for search */}
            {onToggleListening && (
              <button
                type="button"
                onClick={onToggleListening}
                className={`absolute right-2.5 p-1 transition-all active:scale-90 cursor-pointer ${
                  isListening ? 'text-pink-500 animate-pulse' : 'text-[#A89060] hover:text-white'
                }`}
                title="Tap to speak your search"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => triggerSearch(query)}
            disabled={isLoading}
            className="px-4 bg-[#C87941] border-2 text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center font-bold"
            style={{ 
              borderColor: accentColor,
              boxShadow: '2px 2px 0px #0F0A00' 
            }}
            id="btn-music-search-execute"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-press-start text-[8px]">SCAN</span>
            )}
          </button>
        </div>

        {/* Popular Tags Capsules */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span className="font-press-start text-[6.5px] text-[#A89060] tracking-wide uppercase">
              POPULAR NEST PATTERNS
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((tag, idx) => (
              <button
                key={`${tag}-${idx}`}
                onClick={() => triggerSearch(tag)}
                className="bg-[#0F0A00] border hover:bg-[#1C1408] text-[#F5E6C8] hover:text-[#FFF8E7] px-2.5 py-1 text-[10.5px] font-sans rounded-none transition-all cursor-pointer flex items-center gap-1 hover:translate-y-[-1px]"
                style={{ borderColor: `${accentColor}40` }}
                id={`btn-search-pill-${idx}`}
              >
                <span className="text-[8px]" style={{ color: accentColor }}>#</span>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stream Card Container */}
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Loader className="w-9 h-9 animate-spin mb-3" style={{ color: accentColor }} />
              <p className="font-press-start text-[7px] text-[#D4A017] uppercase tracking-widest animate-pulse">
                SCANNING ELECTROMAGNETIC BEE HIVES...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-[#A89060]/30 bg-black/40 p-4">
              <span className="text-[32px] block mb-2 opacity-40">📻</span>
              <p className="font-press-start text-[8px] text-[#A89060] leading-normal uppercase">
                Ready to stream sweet nectar tracks
              </p>
              <p className="font-sans text-[11px] text-[#A89060]/60 mt-1 max-w-xs mx-auto">
                Type search parameters or speak to compile beautiful chiptunes and user custom cassettes!
              </p>
            </div>
          ) : (
            results.map((track) => {
              const isDrawerOpen = expandedTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className="p-1 border bg-[#050301]/90 transition-all duration-300 relative"
                  style={{ borderColor: isDrawerOpen ? accentColor : `${accentColor}30` }}
                  id={`search-item-${track.id}`}
                >
                  <div className="flex items-center gap-2.5 p-1.5">
                    {/* Thumbnail box */}
                    <div className="relative w-12 h-12 border border-[#A89060]/30 shrink-0 overflow-hidden group">
                      <img 
                        src={track.thumbnail} 
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Music className="w-4 h-4" style={{ color: accentColor }} />
                      </div>
                    </div>

                    {/* Meta texts */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="font-press-start text-[7.5px] text-[#FFF8E7] truncate uppercase tracking-widest" title={track.title}>
                        {track.title}
                      </h4>
                      <p className="text-[11px] font-sans text-[#A89060] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    {/* Controller Action buttons */}
                    <div className="flex gap-1.5 shrink-0">
                      {/* Play Immediately */}
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="p-1.5 bg-[#C87941] text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00] border border-[#0F0A00] transition-all cursor-pointer active:scale-95"
                        title="Play immediately"
                        id={`btn-search-p-play-${track.id}`}
                      >
                        <PlaySquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Add directly to queue */}
                      <button
                        onClick={() => onAddToQueue(track)}
                        className="p-1.5 bg-[#1C1408] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F0A00] border border-[#D4A017]/35 transition-all cursor-pointer active:scale-95"
                        title="Add to play queue"
                        id={`btn-search-p-queue-${track.id}`}
                      >
                        <PlusSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown toggle for Playlist addition */}
                      <button
                        onClick={() => togglePlaylistDrawer(track.id)}
                        className={`p-1.5 border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                          isDrawerOpen 
                            ? 'bg-[#FAFAFA] text-black border-white' 
                            : 'bg-black/80 text-[#FFF8E7] hover:bg-black/40'
                        }`}
                        style={{ borderColor: isDrawerOpen ? '#FAFAFA' : `${accentColor}30` }}
                        title="Add/Manage Playlists"
                        id={`btn-search-p-playlist-toggle-${track.id}`}
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        {isDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Playlist Insertion Drawer (Highly modular visual block) */}
                  <AnimatePresence>
                    {isDrawerOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#D4A017]/25 bg-black/60 overflow-hidden"
                      >
                        <div className="p-2.5 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-press-start text-[6px] text-[#A89060] tracking-wider uppercase">
                              ■ ADD TO TAPE CARTRIDGE
                            </span>
                            <span className="font-mono text-[8px] text-[#D4A017]">{playlists.length} CARTRIDGES DETECTED</span>
                          </div>

                          {/* Horizontal list of existing playlists or empty fallback */}
                          <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto py-1">
                            {playlists.length === 0 ? (
                              <p className="text-[10px] font-sans text-stone-500 italic">No custom playlists exist yet. Build one below!</p>
                            ) : (
                              playlists.map((pl) => {
                                const hasJustAdded = successStates[`${track.id}-${pl.id}`];
                                return (
                                  <button
                                    key={pl.id}
                                    onClick={() => handleAddToPlaylist(pl.id, track)}
                                    className={`px-2 py-1 text-[10.5px] font-sans border flex items-center gap-1 transition-all cursor-pointer ${
                                      hasJustAdded 
                                        ? 'bg-green-700/80 text-white border-green-500' 
                                        : 'bg-black/90 text-stone-300 hover:text-white border-stone-800 hover:border-yellow-600'
                                    }`}
                                  >
                                    {hasJustAdded ? (
                                      <Check className="w-3 h-3 text-white spin-once" />
                                    ) : (
                                      <ListMusic className="w-3 h-3" style={{ color: accentColor }} />
                                    )}
                                    {pl.name}
                                  </button>
                                );
                              })
                            )}
                          </div>

                          {/* Quick single-line new playlist creation form */}
                          <div className="border-t border-[#D4A017]/10 pt-2 mt-1">
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder="OR SAVE TO NEW TAPE CARTRIDGE..."
                                className="flex-1 bg-[#120B05] border border-[#D4A017]/40 text-[#FFF8E7] px-2 py-1 text-[9px] font-press-start placeholder-stone-600 outline-none focus:border-[#FFD166] uppercase"
                                value={newPlaylistNames[track.id] || ''}
                                onChange={(e) => setNewPlaylistNames(prev => ({ ...prev, [track.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCreateAndAdd(track);
                                  }
                                }}
                                id={`input-playlist-create-inline-${track.id}`}
                              />
                              <button
                                onClick={() => handleCreateAndAdd(track)}
                                className="p-1 px-2.5 bg-yellow-600 hover:bg-yellow-500 border border-black text-[#F5E6C8] hover:text-[#FFF8E7] transition-all cursor-pointer"
                                title="Create cartridge and save track"
                              >
                                {successStates[`${track.id}-new`] ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
