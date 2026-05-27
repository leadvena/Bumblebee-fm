import React, { useState } from 'react';
import { Track } from '../types';
import { Trash2, GripVertical, PlaySquare, Music, Headphones, Archive } from 'lucide-react';
import PlaylistsSection from './PlaylistsSection';
import { motion, AnimatePresence } from 'motion/react';

interface QueueProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  themeStyle: any;
  onRemove: (trackId: string) => void;
  onReorder: (newQueue: Track[]) => void;
  onPlayTrack: (track: Track) => void;
  onReplaceQueue: (tracks: Track[]) => void;
  onAddToQueue: (track: Track) => void;
}

export default function Queue({
  queue,
  currentTrack,
  isPlaying,
  themeStyle,
  onRemove,
  onReorder,
  onPlayTrack,
  onReplaceQueue,
  onAddToQueue
}: QueueProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const accentColor = themeStyle.accentColor;
  const textColor = themeStyle.textColor;
  const surfaceBg = themeStyle.surface;

  // HTML5 Draggable item handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Swap items in temporary buffer for visual feedback
    const arr = [...queue];
    const draggedItem = arr[draggedIndex];
    arr.splice(draggedIndex, 1);
    arr.splice(index, 0, draggedItem);
    onReorder(arr);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-12 h-12 opacity-10 pointer-events-none" 
             style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent)` }} />

        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-[#D4A017]/35 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Archive className="w-4 h-4" style={{ color: accentColor }} />
            <h2 className="font-press-start text-[11px] text-[#FFF8E7] uppercase tracking-wider">
              FLIGHT QUEUE / CORES
            </h2>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-black/40 border border-dashed border-[#D4A017]/40 text-[#D4A017]">
            PENDING: {queue.length}
          </span>
        </div>

        {/* Current Active Track Preview Row */}
        {currentTrack && (
          <div 
            className="mb-5 p-3 border-2 bg-black/50 flex items-center gap-3 relative overflow-hidden"
            style={{ borderColor: accentColor }}
          >
            {/* Elegant relative bar indicator */}
            <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: accentColor }} />
            
            <div className="relative w-12 h-12 shrink-0 border border-stone-800">
              <img 
                src={currentTrack.thumbnail} 
                alt="Track display" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white animate-bounce" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pl-1">
              <span className="font-press-start text-[6.5px] block uppercase tracking-wider mb-1.5" style={{ color: themeStyle.glow }}>
                ⚡ CURRENTLY STREAMING
              </span>
              <p className="font-press-start text-[8px] text-[#FFF8E7] truncate uppercase tracking-widest leading-none">
                {currentTrack.title}
              </p>
              <p className="text-[11px] font-sans text-stone-400 truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        {/* Queue Items Loop */}
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {queue.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 border-2 border-dashed border-[#A89060]/30 bg-black/20 p-4"
              >
                <Music className="w-8 h-8 text-[#A89060]/40 mx-auto mb-2" />
                <p className="font-press-start text-[7px] text-[#A89060] uppercase tracking-wide">
                  Queue is empty.
                </p>
                <p className="font-sans text-[11px] text-stone-500 mt-1">
                  Ask Bumblebee to play something, or search tracks in the Scan screen!
                </p>
              </motion.div>
            ) : (
              // Slice queue safely but let users scroll
              queue.map((track, index) => (
                <motion.div
                  key={`${track.id}-${index}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 border bg-black/60 hover:bg-black/90 transition-all group cursor-grab active:cursor-grabbing ${
                    draggedIndex === index ? 'opacity-30 border-dashed border-[#A89060]' : 'hover:translate-x-1'
                  }`}
                  style={{ 
                    borderColor: draggedIndex === index ? accentColor : `${accentColor}25`,
                    imageRendering: 'pixelated' 
                  }}
                  id={`queue-item-${track.id}`}
                >
                  {/* Drag Indicator handle */}
                  <div className="text-stone-500 hover:text-white p-1 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Cover representation */}
                  <img 
                    src={track.thumbnail}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover border border-[#D4A017]/20 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-press-start text-[7.5px] text-[#FFF8E7] uppercase truncate tracking-wider">
                      {track.title}
                    </h4>
                    <p className="text-[10.5px] font-sans text-stone-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  {/* Custom Action buttons panel */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                    {/* Play Immediately */}
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-1.5 bg-[#C87941]/20 hover:bg-[#D4A017] hover:text-[#0F0A00] text-[#D4A017] transition-colors border border-[#D4A017]/30 hover:border-transparent cursor-pointer"
                      title="Play Now"
                      id={`btn-queue-play-${track.id}`}
                    >
                      <PlaySquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Trash / Delete */}
                    <button
                      onClick={() => onRemove(track.id)}
                      className="p-1.5 hover:bg-red-500/20 text-stone-500 hover:text-red-500 border border-stone-800 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Remove item"
                      id={`btn-queue-remove-${track.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footnote information */}
        {queue.length > 0 && (
          <div className="mt-4 text-[9px] text-center font-mono opacity-65 flex items-center justify-center gap-1 text-stone-500 uppercase">
            <span>💡 Tip:</span>
            <span>You can drag & drop rows to reorder your flight track queue!</span>
          </div>
        )}
      </div>

      {/* SAVED HIVE PLAYLIST CAPSULES */}
      <PlaylistsSection
        themeStyle={themeStyle}
        queue={queue}
        currentTrack={currentTrack}
        onReplaceQueue={onReplaceQueue}
        onAddToQueue={onAddToQueue}
        onPlayTrack={onPlayTrack}
      />
    </div>
  );
}
