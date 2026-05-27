import React from 'react';

interface ProgressBarProps {
  currentTime: number; // in seconds
  duration: number; // in seconds
  onSeek: (seconds: number) => void;
}

export default function ProgressBar({
  currentTime,
  duration,
  onSeek
}: ProgressBarProps) {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format seconds into digital retro time: 00:00
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPercent = x / rect.width;
    onSeek(clickPercent * duration);
  };

  return (
    <div className="w-full max-w-[400px] px-2 flex flex-col gap-1.5 select-none">
      {/* Time Digits Row */}
      <div className="flex justify-between items-center text-[10px] font-mono text-[#A89060] tracking-wider">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Retro Pixel Progress Deck Slider */}
      <div 
        onClick={handleClick}
        className="relative h-[20px] bg-[#0F0A00] border-2 border-[#D4A017] cursor-pointer flex items-center p-[2px]"
        id="progress-bar-slider"
      >
        {/* Full Track Gauge Fill */}
        <div 
          className="h-full bg-[#D4A017] transition-all duration-100 relative flex items-center justify-end"
          style={{ 
            width: `${percent}%`,
            boxShadow: 'inset 0px 4px 0px #FFD166, inset 0px -4px 0px #C87941'
          }}
        >
          {/* Slider Core Handle Grip (Squared-off pixel node) */}
          <div 
            className="w-3 h-[24px] absolute -right-[6px] bg-[#C87941] border-2 border-[#D4A017] flex flex-col justify-around py-0.5"
            style={{
              boxShadow: '2px 2px 0px #0F0A00'
            }}
          >
            <div className="w-full h-[2px] bg-[#FFF8E7]" />
            <div className="w-full h-[2px] bg-[#FFF8E7]" />
          </div>
        </div>
      </div>
    </div>
  );
}
