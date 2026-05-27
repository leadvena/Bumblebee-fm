import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0 to 100
  onChange: (newVolume: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VolumeSlider({
  volume,
  onChange,
  isMuted,
  onToggleMute
}: VolumeSliderProps) {
  // Translate volume into a step-by-step pixel grid
  const bars = Array.from({ length: 10 });
  const currentStep = Math.floor(volume / 10);

  return (
    <div className="flex items-center gap-3 p-2 bg-[#1C1408] border-2 border-[#D4A017] max-w-[280px]">
      {/* Icon Button */}
      <button
        onClick={onToggleMute}
        className="p-1 hover:bg-[#C87941] text-[#D4A017] hover:text-[#FFF8E7] active:translate-y-[1px] transition-colors cursor-pointer"
        style={{ imageRendering: 'pixelated' }}
        id="btn-volume-mute-toggle"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* Retro Volume Meter Bars */}
      <div className="flex items-end gap-1 h-[14px]">
        {bars.map((_, index) => {
          const isActive = !isMuted && index < currentStep;
          return (
            <div
              key={index}
              onClick={() => onChange((index + 1) * 10)}
              className="group relative cursor-pointer"
            >
              <div
                className="w-[8px] transition-all duration-100"
                style={{
                  height: `${4 + index * 1.5}px`,
                  backgroundColor: isActive ? '#D4A017' : '#0F0A00',
                  border: '1px solid #A89060',
                  boxShadow: isActive ? 'inset 1px 1px 0px #FFD166' : 'none'
                }}
              />
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0F0A00] text-[#FFF8E7] text-[8px] font-press-start py-0.5 px-1 border border-[#D4A017] rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {(index + 1) * 10}%
              </span>
            </div>
          );
        })}
      </div>

      <span className="text-[10px] font-mono text-[#A89060] min-w-[28px] text-right">
        {isMuted ? 'MUTE' : `${volume}%`}
      </span>
    </div>
  );
}
