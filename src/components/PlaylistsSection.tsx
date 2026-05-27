import React, { useState, useEffect } from 'react';
import { Track, Playlist } from '../types';
import { Save, FolderHeart, Trash2, FolderOpen, Loader, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaylistsSectionProps {
  themeStyle: any;
  queue: Track[];
  currentTrack: Track | null;
  onReplaceQueue: (tracks: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
}

export default function PlaylistsSection({
  themeStyle,
  queue,
  currentTrack,
  onReplaceQueue,
  onAddToQueue,
  onPlayTrack
}: PlaylistsSectionProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isLoadingListId, setIsLoadingListId] = useState<string | null>(null);

  const accentColor = themeStyle.accentColor;
  const textColor = themeStyle.textColor;
  const glowColor = themeStyle.glow;

  // 1. Load playlists on mount and on storage updates
  useEffect(() => {
    const handleSyncPlaylists = () => {
      try {
        const stored = localStorage.getItem('bumblebee_saved_playlists');
        if (stored) {
          setPlaylists(JSON.parse(stored));
        } else {
          // Build a starter default chiptune playlist
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
        console.warn("Storage read failed for playlists", e);
      }
    };

    handleSyncPlaylists();

    // Listen for local storage updates to sync search result creations instantly
    window.addEventListener('storage', handleSyncPlaylists);
    // Interval check as fallback for single page transitions
    const interval = setInterval(handleSyncPlaylists, 1500);

    return () => {
      window.removeEventListener('storage', handleSyncPlaylists);
      clearInterval(interval);
    };
  }, []);

  const savePlaylistsToStorage = (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
    try {
      localStorage.setItem('bumblebee_saved_playlists', JSON.stringify(newPlaylists));
    } catch (e) {
      console.warn("Storage save failed for playlists", e);
    }
  };

  // 2. Save current queue as new playlist capsule
  const handleSaveCurrentQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    // Compile active tracks (current track + queue)
    const tracksToSave: Track[] = [];
    if (currentTrack) {
      tracksToSave.push(currentTrack);
    }
    tracksToSave.push(...queue);

    if (tracksToSave.length === 0) {
      alert("No songs are currently selected or playing in your flight queue!");
      return;
    }

    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      name: playlistName.trim().toUpperCase(),
      tracks: tracksToSave
    };

    const updated = [newPlaylist, ...playlists];
    savePlaylistsToStorage(updated);
    setPlaylistName('');
  };

  // 3. Save only the current playing song
  const handleSaveCurrentSongOnly = () => {
    if (!currentTrack) return;
    
    const name = prompt("ENTER PLAYLIST NAME FOR THIS SONG:", `MY FAVOURITES - ${currentTrack.title.substring(0, 10).toUpperCase()}`);
    if (!name || !name.trim()) return;

    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      name: name.trim().toUpperCase(),
      tracks: [currentTrack]
    };

    const updated = [newPlaylist, ...playlists];
    savePlaylistsToStorage(updated);
  };

  // 4. Load playlist capsule
  const handleLoadPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    
    setIsLoadingListId(playlist.id);
    
    setTimeout(() => {
      const [first, ...rest] = playlist.tracks;
      onPlayTrack(first);
      onReplaceQueue(rest);
      setActivePlaylistId(playlist.id);
      setIsLoadingListId(null);
    }, 450);
  };

  // 5. Delete specific playlist
  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Erase this tape cartridge from Bumblebee memory?")) return;
    const updated = playlists.filter(p => p.id !== id);
    savePlaylistsToStorage(updated);
    if (activePlaylistId === id) {
      setActivePlaylistId(null);
    }
  };

  return (
    <div className="w-full mt-6 select-none font-sans">
      <div 
        className={`w-full ${themeStyle.surface} border-2 rounded-none relative overflow-hidden flex flex-col`}
        style={{ borderColor: `${accentColor}40` }}
        id="playlist-capsule-card"
      >
        {/* Card Header title */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-dashed bg-black/50"
             style={{ borderColor: `${accentColor}30` }}>
          <div className="flex items-center gap-1.5 font-press-start text-[7.5px] text-stone-300">
            <FolderHeart className="w-4 h-4 animate-pulse" style={{ color: accentColor }} />
            PLAYLIST CARTRIDGES
          </div>
          <span className="font-mono text-[8px] text-stone-500">TAPE_SYSTEM</span>
        </div>

        {/* Action controls: Save Queue panel */}
        <div className="p-3 bg-black/20 border-b" style={{ borderColor: `${accentColor}15` }}>
          <form onSubmit={handleSaveCurrentQueue} className="flex gap-2">
            <input
              type="text"
              placeholder="ENTER PLAYLIST NAME..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="flex-1 bg-black/90 border text-[#FFF8E7] px-3 py-1.5 text-[9px] font-press-start placeholder-stone-600 outline-none uppercase focus:border-white"
              style={{ borderColor: `${accentColor}60` }}
              id="input-playlist-save-name"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-[#FFF8E7] border cursor-pointer font-press-start text-[7.5px] uppercase tracking-wide shrink-0 transition-all hover:bg-stone-800"
              style={{ 
                backgroundColor: accentColor, 
                borderColor: accentColor,
                color: '#0F0A00'
              }}
              title="Save current queue layout"
              id="btn-save-capsule-queue"
            >
              <Save className="w-3.5 h-3.5 inline mr-1" /> SAVE QUEUE
            </button>
          </form>

          {currentTrack && (
            <div className="mt-2 flex justify-between items-center text-[10.5px] font-mono text-stone-400">
              <span>Or log currently playing track solely:</span>
              <button
                type="button"
                onClick={handleSaveCurrentSongOnly}
                className="hover:underline font-press-start text-[6.5px] tracking-wider"
                style={{ color: accentColor }}
              >
                + SAVE AS SINGLE
              </button>
            </div>
          )}
        </div>

        {/* Saved List capsules */}
        <div className="p-2.5 flex flex-col gap-2 max-h-[220px] overflow-y-auto bg-[#040301]/95">
          <AnimatePresence>
            {playlists.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 border border-dashed border-stone-800 text-stone-500"
              >
                <FolderOpen className="w-6 h-6 mx-auto mb-1 opacity-40" />
                <p className="font-sans text-[11px]">No saved tape cartridges logged.</p>
                <p className="font-sans text-[9.5px] opacity-70 mt-0.5">Define or capture a queue to print memory!</p>
              </motion.div>
            ) : (
              playlists.map((playlist) => {
                const isActive = activePlaylistId === playlist.id;
                const isLoading = isLoadingListId === playlist.id;
                
                return (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleLoadPlaylist(playlist)}
                    className={`flex items-center justify-between p-2 border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-stone-900/60' 
                        : 'bg-black/40 hover:bg-black/80'
                    }`}
                    style={{ borderColor: isActive ? accentColor : `${accentColor}15` }}
                    id={`playlist-item-${playlist.id}`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                        <h4 className="font-press-start text-[8px] text-[#FFF8E7] truncate uppercase tracking-widest leading-none">
                          {playlist.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-mono text-stone-400 mt-1.5">
                        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''} stored inside tape
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadPlaylist(playlist);
                        }}
                        className="px-2 py-1 text-black font-press-start text-[6px] tracking-wide flex items-center gap-1 transition-all"
                        style={{ backgroundColor: accentColor }}
                        title="Load and play list"
                        disabled={isLoading}
                        id={`btn-load-playlist-${playlist.id}`}
                      >
                        {isLoading ? (
                          <Loader className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Play className="w-2 h-2 fill-current" />
                        )}
                        LOAD
                      </button>
                      
                      <button
                        onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                        className="p-1 text-stone-500 hover:text-red-500 hover:bg-stone-900 transition-all shrink-0 cursor-pointer"
                        title="Erase Capsule"
                        id={`btn-delete-playlist-${playlist.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
