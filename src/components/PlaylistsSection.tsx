import React, { useState, useEffect } from 'react';
import { Track, Playlist } from '../types';
import { Save, FolderHeart, Trash2, ListStart, Plus, Sparkles, FolderOpen } from 'lucide-react';

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

  // 1. Load playlists on mount
  useEffect(() => {
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
              },
              {
                id: 'dQw4w9WgXcQ',
                title: 'Never Gonna Give You Up (8-Bit Remix)',
                artist: 'Chiptune Legends',
                thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=60'
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
    
    const name = prompt("ENTER PLAYLIST NAME FOR THIS SONG:", `HONEY COMB - ${currentTrack.title.substring(0, 10).toUpperCase()}`);
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
    
    // Replace queue with remaining tracks, play the first track immediately
    const [first, ...rest] = playlist.tracks;
    onPlayTrack(first);
    onReplaceQueue(rest);
    setActivePlaylistId(playlist.id);
  };

  // 5. Delete specific playlist
  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = playlists.filter(p => p.id !== id);
    savePlaylistsToStorage(updated);
    if (activePlaylistId === id) {
      setActivePlaylistId(null);
    }
  };

  return (
    <div className="w-full mt-6 select-none">
      <div 
        className="w-full bg-[#110D05] border-2 border-[#D4A017]/50 rounded-none relative overflow-hidden flex flex-col"
        id="playlist-capsule-card"
      >
        {/* Card Header title */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-dashed border-[#A89060]/45 bg-[#0F0A00]/85">
          <div className="flex items-center gap-1.5 font-press-start text-[7.5px] text-[#A89060]">
            <FolderHeart className="w-3.5 h-3.5 text-[#D4A017] animate-pulse" />
            PLAYLIST CAPSULES
          </div>
          <span className="font-mono text-[7px] text-[#A89060]">CAPSULE_SYS</span>
        </div>

        {/* Action controls: Save Queue panel */}
        <div className="p-3 border-b border-[#A89060]/20 bg-[#161005]">
          <form onSubmit={handleSaveCurrentQueue} className="flex gap-2">
            <input
              type="text"
              placeholder="ENTER PLAYLIST NAME..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="flex-1 bg-[#0F0A00] border border-[#D4A017] text-[#FFF8E7] px-2.5 py-1.5 text-[10px] rounded-none outline-none font-press-start placeholder-[#A89060]/40 focus:border-[#FFD166]"
              id="input-playlist-save-name"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#C87941] text-[#FFF8E7] border border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F0A00] cursor-pointer font-press-start text-[7.5px] uppercase tracking-wide shrink-0 transition-all active:translate-y-[1px]"
              title="Save queue to playlist"
              id="btn-save-capsule-queue"
            >
              <Save className="w-3.5 h-3.5 inline mr-1" /> SAVE QUEUE
            </button>
          </form>

          {currentTrack && (
            <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-[#A89060]">
              <span>Or save current track only:</span>
              <button
                type="button"
                onClick={handleSaveCurrentSongOnly}
                className="text-[#D4A017] hover:text-[#FFD166] underline font-press-start text-[6px] tracking-wider"
              >
                + SAVE AS SINGLE
              </button>
            </div>
          )}
        </div>

        {/* Saved List capsules */}
        <div className="p-3 flex flex-col gap-2 max-h-[220px] overflow-y-auto bg-[#0F0A00]">
          {playlists.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#A89060]/30 text-[#A89060]">
              <FolderOpen className="w-6 h-6 mx-auto mb-1 opacity-40" />
              <p className="font-sans text-[11px]">No saved hives detected.</p>
              <p className="font-sans text-[9px] opacity-70 mt-0.5">Use the save queue command above!</p>
            </div>
          ) : (
            playlists.map((playlist) => {
              const isActive = activePlaylistId === playlist.id;
              return (
                <div
                  key={playlist.id}
                  onClick={() => handleLoadPlaylist(playlist)}
                  className={`flex items-center justify-between p-2 border transition-all cursor-pointer hover:bg-[#161005]/80 ${
                    isActive 
                      ? 'bg-[#1C1408] border-[#D4A017]' 
                      : 'bg-[#0F0A00] border-[#D4A017]/25 hover:border-[#D4A017]/70'
                  }`}
                  id={`playlist-item-${playlist.id}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                      <h4 className="font-press-start text-[8px] text-[#FFF8E7] truncate uppercase tracking-widest leading-none">
                        {playlist.name}
                      </h4>
                    </div>
                    <p className="text-[10px] font-mono text-[#A89060] mt-1.5">
                      {playlist.tracks.length} honeycomb tracks logged
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadPlaylist(playlist);
                      }}
                      className="p-1 text-[#D4A017] hover:text-[#FFF8E7] hover:bg-[#C87941]/30 transition-all shrink-0 cursor-pointer text-[10px] font-press-start text-[6px] border border-[#D4A017]/40 px-1.5 py-0.5"
                      title="Load and play list"
                      id={`btn-load-playlist-${playlist.id}`}
                    >
                      LOAD
                    </button>
                    <button
                      onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                      className="p-1 hover:bg-red-500/20 text-[#C87941] hover:text-red-500 rounded transition-all shrink-0 cursor-pointer"
                      title="Erase Capsule"
                      id={`btn-delete-playlist-${playlist.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
