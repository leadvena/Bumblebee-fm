import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0 to 100
  onChange: (newVolume: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  themeStyle: any;
}

export default function VolumeSlider({
  volume,
  onChange,
  isMuted,
  onToggleMute,
  themeStyle
}: VolumeSliderProps) {
  // Translate volume into a step-by-step pixel grid
  const bars = Array.from({ length: 10 });
  const currentStep = Math.floor(volume / 10);
  const accentColor = themeStyle?.accentColor || '#D4A017';
  const glowColor = themeStyle?.glow || '#FFD166';

  return (
    <div 
      className={`flex items-center gap-3 p-2 bg-[#1C1408]/90 border-2 ${themeStyle.border} max-w-[280px] w-full`}
      style={{
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5), 2px 2px 0px #000'
      }}
    >
      {/* Icon Button */}
      <button
        onClick={onToggleMute}
        className="p-1 hover:bg-black/30 transition-colors cursor-pointer"
        style={{ 
          color: accentColor,
          imageRendering: 'pixelated' 
        }}
        id="btn-volume-mute-toggle"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5 animate-pulse" />
        )}
      </button>

      {/* Retro Volume Meter Bars */}
      <div className="flex items-end gap-1.5 h-[14px] flex-1 justify-center">
        {bars.map((_, index) => {
          const isActive = !isMuted && index < currentStep;
          return (
            <div
              key={index}
              onClick={() => onChange((index + 1) * 10)}
              className="group relative cursor-pointer"
            >
              <div
                className="w-[8px] transition-all duration-100 border"
                style={{
                  height: `${4 + index * 1.5}px`,
                  backgroundColor: isActive ? accentColor : '#0F0A00',
                  borderColor: isActive ? glowColor : '#44351E',
                  boxShadow: isActive ? `0px 0px 4px ${glowColor}80` : 'none'
                }}
              />
              <span 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-[#FFF8E7] text-[8px] font-press-start py-0.5 px-1 border rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md"
                style={{ borderColor: accentColor }}
              >
                {(index + 1) * 10}%
              </span>
            </div>
          );
        })}
      </div>

      <span className="text-[10px] font-mono min-w-[28px] text-right" style={{ color: themeStyle.textColor }}>
        {isMuted ? 'MUTE' : `${volume}%`}
      </span>
    </div>
  );
}
