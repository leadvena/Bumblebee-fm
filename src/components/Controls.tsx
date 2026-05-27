import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  themeStyle: any;
}

export default function Controls({
  isPlaying,
  isShuffle,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  themeStyle
}: ControlsProps) {
  const accentColor = themeStyle.accentColor || '#D4A017';
  const glowColor = themeStyle.glow || '#FFD166';
  const mutedTextColor = themeStyle.textColor || '#A89060';

  const surfaceColor = themeStyle.surfaceColor || '#120B05';
  const bgColor = themeStyle.bgColor || '#060401';

  return (
    <div className="flex justify-center items-center gap-4 py-2 select-none">
      {/* SHUFFLE BUTTON */}
      <button
        onClick={onToggleShuffle}
        className="p-2 transition-all cursor-pointer border-2 active:translate-y-[2px]"
        style={{
          borderColor: isShuffle ? glowColor : accentColor,
          backgroundColor: isShuffle ? accentColor : surfaceColor,
          color: isShuffle ? bgColor : mutedTextColor,
          boxShadow: isShuffle ? `1px 1px 0px ${bgColor}` : `3px 3px 0px ${bgColor}`,
        }}
        id="btn-control-shuffle"
        title="Shuffle Hive"
      >
        <Shuffle className="w-5 h-5" />
      </button>

      {/* PREVIOUS BUTTON */}
      <button
        onClick={onPrevious}
        className="p-3 border-2 text-[#FFF8E7] hover:brightness-110 active:translate-y-[2px] cursor-pointer"
        style={{
          backgroundColor: surfaceColor,
          borderColor: accentColor,
          boxShadow: `3px 3px 0px ${bgColor}`,
        }}
        id="btn-control-previous"
        title="Previous Flower"
      >
        <SkipBack className="w-6 h-6 fill-current" />
      </button>

      {/* PLAY / PAUSE BUTTON */}
      <button
        onClick={onTogglePlay}
        className="p-4 border-2 text-[#FFF8E7] hover:brightness-125 active:translate-y-[2px] transition-all cursor-pointer"
        style={{
          backgroundColor: themeStyle.accentColor || '#C87941',
          borderColor: themeStyle.glow || '#D4A017',
          boxShadow: `4px 4px 0px ${bgColor}`,
        }}
        id="btn-control-play-pause"
        title={isPlaying ? "Pause Flight" : "Start Buzzing"}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8 fill-current" />
        ) : (
          <Play className="w-8 h-8 fill-current ml-0.5" />
        )}
      </button>

      {/* NEXT BUTTON */}
      <button
        onClick={onNext}
        className="p-3 border-2 text-[#FFF8E7] hover:brightness-110 active:translate-y-[2px] cursor-pointer"
        style={{
          backgroundColor: surfaceColor,
          borderColor: accentColor,
          boxShadow: `3px 3px 0px ${bgColor}`,
        }}
        id="btn-control-next"
        title="Next Flower"
      >
        <SkipForward className="w-6 h-6 fill-current" />
      </button>
    </div>
  );
}
