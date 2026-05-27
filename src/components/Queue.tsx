import React, { useState } from 'react';
import { Track } from '../types';
import { Trash2, GripVertical, PlaySquare, Music } from 'lucide-react';

interface QueueProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  themeStyle: any;
  onRemove: (trackId: string) => void;
  onReorder: (newQueue: Track[]) => void;
  onPlayTrack: (track: Track) => void;
}

export default function Queue({
  queue,
  currentTrack,
  isPlaying,
  themeStyle,
  onRemove,
  onReorder,
  onPlayTrack
}: QueueProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    <div className="w-full max-w-[480px] mx-auto p-2 select-none">
      <div 
        className={`w-full ${themeStyle.surface} border-4 ${themeStyle.border} p-4`}
        style={{ boxShadow: '4px 4px 0px #0F0A00' }}
      >
        {/* Header Title */}
        <h2 className="font-press-start text-[12px] text-[#FFF8E7] border-b-2 border-dashed border-[#A89060] pb-2 mb-4 uppercase tracking-wider">
          ★ FLIGHT QUEUE / UP NEXT
        </h2>

        {/* Current Active Track Preview Row */}
        {currentTrack && (
          <div className="mb-6 p-2 border-2 border-[#D4A017] bg-[#0F0A00] flex items-center gap-3">
            <div className="absolute w-2 h-10 bg-[#D4A017] left-0 fill-current" />
            <img 
              src={currentTrack.thumbnail} 
              alt="Track display" 
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-cover border border-[#D4A017]"
            />
            <div className="flex-1 min-w-0">
              <span className="font-press-start text-[7px] text-[#FFD166] block uppercase tracking-wider mb-1">
                ■ NOW POLLINATING
              </span>
              <p className="font-press-start text-[9px] text-[#FFF8E7] truncate uppercase">
                {currentTrack.title}
              </p>
              <p className="text-[12px] font-sans text-[#A89060] truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        {/* Queue Items Loop */}
        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          {queue.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#A89060]/30">
              <Music className="w-8 h-8 text-[#A89060]/40 mx-auto mb-2" />
              <p className="font-sans text-[13px] text-[#A89060]">
                Queue is empty.
              </p>
              <p className="font-sans text-[11px] text-[#A89060]/60 mt-1">
                Say "Play some lofi" to load sweet music!
              </p>
            </div>
          ) : (
            queue.slice(0, 8).map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 border-2 bg-[#0F0A00] transition-colors group cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-30 border-dashed border-[#A89060]' : 'border-[#D4A017]/40 hover:border-[#D4A017]'
                }`}
                style={{ imageRendering: 'pixelated' }}
                id={`queue-item-${track.id}`}
              >
                {/* Drag Indicator handle */}
                <div className="text-[#A89060] hover:text-[#D4A017] p-1">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Cover representation */}
                <img 
                  src={track.thumbnail}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 object-cover border border-[#A89060]/50"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-press-start text-[8px] text-[#FFF8E7] uppercase truncate">
                    {track.title}
                  </h4>
                  <p className="text-[11px] font-sans text-[#A89060] truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Custom Action buttons panel */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {/* Play Immediately */}
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-1.5 hover:bg-[#D4A017] hover:text-[#0F0A00] text-[#D4A017] cursor-pointer"
                    title="Play Now"
                    id={`btn-queue-play-${track.id}`}
                  >
                    <PlaySquare className="w-4 h-4" />
                  </button>

                  {/* Trash / Delete */}
                  <button
                    onClick={() => onRemove(track.id)}
                    className="p-1.5 hover:bg-[#C87941] hover:text-[#FFF8E7] text-[#C87941] cursor-pointer"
                    title="Remove item"
                    id={`btn-queue-remove-${track.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Small footnote */}
        {queue.length > 8 && (
          <p className="text-[10px] text-center font-mono text-[#A89060] mt-3 italic">
            + {queue.length - 8} additional honeycomb cells waiting.
          </p>
        )}
      </div>
    </div>
  );
}
