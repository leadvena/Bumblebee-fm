import React from 'react';
import { Mic } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceButtonProps {
  isListening: boolean;
  onToggleListening: () => void;
  statusText: string;
  themeStyle: any;
}

export default function VoiceButton({
  isListening,
  onToggleListening,
  statusText,
  themeStyle
}: VoiceButtonProps) {
  // Waveform bars
  const bars = Array.from({ length: 9 });
  const activeBg = isListening ? themeStyle.surface : 'bg-[#1C1408]/90';

  return (
    <div 
      className={`flex flex-col items-center gap-3 py-3.5 w-full max-w-[340px] ${activeBg} border-2 ${themeStyle.border} p-4 relative`}
      style={{
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6), 3px 3px 0px #000'
      }}
    >
      {/* 70s Backlit Glowing Waveform Screen (Radio Indicator look) */}
      <div 
        className="flex items-center justify-center gap-1 h-[36px] w-full px-4 border border-black/30 bg-black/80 relative"
        style={{
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(ellipse at center, #FFF 0%, transparent 100%)',
          }}
        />

        {isListening ? (
          bars.map((_, i) => (
            <motion.div
              key={i}
              className="w-2 rounded-none border border-black/40"
              animate={{
                height: [6, 26, 4, 20, 10, 6][(i + Math.floor(Math.random() * 5)) % 6],
                backgroundColor: [themeStyle.accentColor, themeStyle.glow, '#EF4444'][i % 3]
              }}
              transition={{
                duration: 0.35 + i * 0.05,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              style={{
                boxShadow: `0 0 6px ${themeStyle.glow}80`
              }}
            />
          ))
        ) : (
          /* Idle Waveform */
          <div className="flex items-center gap-1 h-[26px]">
            {bars.map((_, i) => {
              const staticHt = [4, 6, 4, 8, 4, 8, 4, 6, 4][i];
              return (
                <div 
                  key={i} 
                  className="w-2 border border-black/20 transition-all duration-300"
                  style={{ 
                    height: `${staticHt}px`, 
                    backgroundColor: `${themeStyle.accentColor}30` 
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Mic/Voice Push Button - Looks like a premium physical spring-loaded retro switch */}
      <button
        onClick={onToggleListening}
        className={`relative p-3.5 rounded-full border-4 cursor-pointer active:translate-y-[2px] active:scale-95 transition-all ${
          isListening 
            ? 'bg-red-600 text-white border-red-500 animate-pulse-glow' 
            : 'bg-[#21170A] border-[#D4A017] hover:border-white text-[#F5E6C8]'
        }`}
        style={{
          borderColor: isListening ? '#EF4444' : themeStyle.accentColor,
          backgroundImage: 'radial-gradient(120% 120% at 35% 30%, rgba(255,255,255,0.15) 0%, transparent 80%)',
          boxShadow: isListening 
            ? `0 0 16px rgba(239, 68, 68, 0.45), 3px 3px 0px #000`
            : 'inset 0 2px 4px rgba(255,255,255,0.1), 3px 3px 0px #000',
        }}
        id="btn-voice-talk-trigger"
        title="Buzz Command Antenna"
      >
        <Mic className="w-7 h-7" />
        
        {/* Glow bead */}
        {isListening && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white border border-red-600 animate-ping" />
        )}
      </button>

      {/* Subtext info */}
      <div className="text-center w-full">
        <p 
          className="text-[8px] font-press-start uppercase tracking-wider animate-pulse font-bold"
          style={{ color: isListening ? '#EF4444' : themeStyle.accentColor }}
        >
          {isListening ? 'BUMBLEBEE COMM CAPTURE' : 'TAP MICROPHONE & COMMAND'}
        </p>
        <p 
          className="text-[10px] font-mono mt-1 w-full text-center truncate italic font-medium px-2"
          style={{ color: themeStyle.textColor }}
        >
          {statusText === 'Standby' ? 'Ready for your retro flight instructions...' : statusText}
        </p>
      </div>
    </div>
  );
}
