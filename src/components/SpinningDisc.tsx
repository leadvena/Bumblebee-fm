import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause } from 'lucide-react';

interface SpinningDiscProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasDetectedWakeWord: boolean;
  thumbnailUrl: string | null;
  title: string;
  artist: string;
  themeStyle: any;
}

export default function SpinningDisc({
  isPlaying,
  isLoading,
  hasDetectedWakeWord,
  thumbnailUrl,
  title,
  artist,
  themeStyle
}: SpinningDiscProps) {
  // Setup fallback image if thumbnail is absent (a golden pixel art music note)
  const finalThumbnail = thumbnailUrl || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300";

  const accentColor = themeStyle?.accentColor || '#D4A017';
  const glowColor = themeStyle?.glow || '#FFD166';
  const textColor = themeStyle?.textColor || '#FFF8E7';

  // Spin speed and glows based on state
  const spinClass = hasDetectedWakeWord 
    ? 'animate-spin-fast' 
    : isPlaying 
      ? 'animate-spin-slow' 
      : '';

  const isMarqueeNeeded = title.length > 20;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Container holding disc + needle */}
      <div className="relative flex items-center justify-center w-[320px] h-[300px] sm:w-[360px]">
        {/* DISC GLOW EFFECT */}
        <div 
          className={`absolute transition-all duration-700 rounded-full w-[202px] h-[202px] sm:w-[262px] sm:h-[262px] z-0 blur-xl ${
            hasDetectedWakeWord 
              ? 'scale-110 opacity-70' 
              : isPlaying 
                ? 'opacity-40' 
                : 'opacity-0'
          }`} 
          style={{
            backgroundColor: hasDetectedWakeWord ? glowColor : (isPlaying ? glowColor : 'transparent')
          }}
        />

        {/* VINYL DISC */}
        <div 
          className={`relative z-10 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] select-none ${spinClass} ${
            isLoading ? 'animate-pulse opacity-75' : ''
          }`}
          style={{
            imageRendering: 'pixelated',
            transition: 'transform 0.15s ease-out, box-shadow 0.3s ease-in-out',
            animationPlayState: isPlaying || hasDetectedWakeWord ? 'running' : 'paused',
          }}
        >
          {/* Outer Ring & Grooves */}
          <div 
            className="w-full h-full border-4 relative flex items-center justify-center text-center rounded-full"
            style={{
              borderColor: accentColor,
              backgroundColor: themeStyle?.surfaceColor || '#120B05',
              boxShadow: `
                inset 0 0 0 8px ${themeStyle?.bgColor || '#060401'},
                inset 0 0 0 12px ${accentColor},
                inset 0 0 0 20px ${themeStyle?.bgColor || '#060401'},
                inset 0 0 0 22px ${themeStyle?.surfaceColor || '#120B05'},
                inset 0 0 0 32px ${themeStyle?.bgColor || '#060401'},
                inset 0 0 0 34px ${accentColor},
                inset 0 0 0 46px ${themeStyle?.surfaceColor || '#120B05'},
                4px 4px 0px ${themeStyle?.bgColor || '#060401'}
              `
            }}
          >
            {/* Middle Shimmer (Accent Highlight) */}
            <div 
              className="absolute inset-6 border rounded-full pointer-events-none" 
              style={{ borderColor: `${accentColor}40` }}
            />

            {/* Static Pixel Art Shine (Highlight on Vinyl Top-Left) */}
            <div className="absolute top-4 left-10 w-3 h-3 bg-[#FFF8E7]/40 pointer-events-none rotate-45" />
            <div className="absolute top-8 left-14 w-2 h-2 bg-[#FFF8E7]/30 pointer-events-none rotate-45" />

            {/* Center Record Label / YouTube Thumbnail Container */}
            <div 
              className="absolute w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] border-4 flex items-center justify-center overflow-hidden rounded-full relative"
              style={{
                borderColor: themeStyle?.bgColor || '#060401',
                boxShadow: `0 0 0 3px ${accentColor}`,
                backgroundColor: accentColor
              }}
            >
              <AnimatePresence mode="popLayout">
                <motion.img 
                  key={finalThumbnail || "fallback"}
                  src={finalThumbnail} 
                  alt="Record album design" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-110 absolute inset-0 text-transparent"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              </AnimatePresence>

              {/* Spindle hole */}
              <div 
                className="absolute w-4 h-4 border-2 flex items-center justify-center rounded-full z-10" 
                style={{ 
                  backgroundColor: themeStyle?.bgColor || '#060401',
                  borderColor: accentColor 
                }}>
                <div className="w-1.5 h-1.5 bg-[#FFF8E7] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* PHYSICAL TONEARM / NEEDLE (Top-Right position) */}
        <div 
          className="absolute top-2 right-12 z-20 w-[64px] h-[120px] pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Gold ToneArm Base */}
          <div 
            className="absolute top-0 right-0 w-8 h-8 border-2 flex items-center justify-center rounded-full" 
            style={{ 
              backgroundColor: themeStyle?.surfaceColor || '#120B05',
              borderColor: accentColor 
            }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>

          {/* Needle Rod Arm (Rotates into Vinyl when playing) */}
          <motion.div
            className="absolute top-4 right-3 origin-top-right w-[4px] h-[90px]"
            style={{ backgroundColor: accentColor }}
            animate={{
              rotate: (isPlaying && !isLoading) || hasDetectedWakeWord ? 22 : 2
            }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
          >
            {/* ToneArm Head / Cartridge */}
            <div 
              className="absolute bottom-0 -left-2 w-[10px] h-[16px] border border-[#0F0A00]"
              style={{
                backgroundColor: accentColor,
                boxShadow: 'inset 2px 2px 0px #FFF8E7'
              }}
            >
              {/* Tiny needle stylus point */}
              <div className="absolute bottom-0 left-1 w-1.5 h-1.5 bg-[#FFF8E7]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* TRACK INFORMATION (BELOW DISC) */}
      <div className="w-full text-center mt-3 max-w-[320px] min-h-[50px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={title || 'none'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full text-center"
          >
            {/* Title (Press Start 2P) */}
            <div className="h-[24px] overflow-hidden flex justify-center items-center">
              {isMarqueeNeeded ? (
                <div className="marquee-container text-[11px] sm:text-[12px] font-press-start text-[#FFF8E7] uppercase w-full">
                  <span className="marquee-text inline-block min-w-full">
                    {title} &nbsp; &nbsp; ★ &nbsp; &nbsp; {title}
                  </span>
                </div>
              ) : (
                <h2 className="text-[11px] sm:text-[13px] font-press-start text-[#FFF8E7] tracking-wider truncate uppercase">
                  {title || 'NO TRACK LOADED'}
                </h2>
              )}
            </div>

            {/* Artist (Inter) */}
            <p className="text-[12px] sm:text-[14px] font-medium text-[#A89060] mt-1.5 truncate">
              {artist || 'Bumblebee Music Assistant'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
