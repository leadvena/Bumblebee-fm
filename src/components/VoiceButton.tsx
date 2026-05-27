import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceButtonProps {
  isListening: boolean;
  onToggleListening: () => void;
  statusText: string;
}

export default function VoiceButton({
  isListening,
  onToggleListening,
  statusText
}: VoiceButtonProps) {
  // Waveform bars
  const bars = Array.from({ length: 6 });

  return (
    <div className="flex flex-col items-center gap-3 py-3 w-full max-w-[340px] bg-[#1C1408] border-2 border-[#D4A017] p-4 relative">
      {/* Visual Feedback Golden Waveform */}
      <div className="flex items-center justify-center gap-1.5 h-[32px] w-full">
        {isListening ? (
          bars.map((_, i) => (
            <motion.div
              key={i}
              className="w-3 bg-[#FFD166] border border-[#0F0A00]"
              animate={{
                height: [8, 28, 6, 22, 12, 8][(i + Math.floor(Math.random() * 4)) % 6],
                backgroundColor: ['#D4A017', '#FFD166', '#C87941'][i % 3]
              }}
              transition={{
                duration: 0.4 + i * 0.08,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              style={{
                boxShadow: 'inset 1px 1px 0px #FFF8E7'
              }}
            />
          ))
        ) : (
          /* Idle Waveform */
          <div className="flex items-center gap-1.5 h-[32px]">
            {bars.map((_, i) => (
              <div 
                key={i} 
                className="w-3 bg-[#0F0A00] border border-[#A89060] transition-all duration-300"
                style={{ height: '4px' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mic/Voice Push Button */}
      <button
        onClick={onToggleListening}
        className={`relative p-4 border-4 border-[#D4A017] cursor-pointer active:translate-y-[2px] transition-all ${
          isListening 
            ? 'bg-[#D4A017] text-[#0F0A00] animate-pulse-glow' 
            : 'bg-[#C87941] text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00]'
        }`}
        style={{
          boxShadow: '4px 4px 0px #0F0A00',
        }}
        id="btn-voice-talk-trigger"
        title="Buzz Command Antenna"
      >
        <Mic className="w-8 h-8" />
        
        {/* Glow bead */}
        {isListening && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FFF8E7] border border-[#0F0A00]" />
        )}
      </button>

      {/* Subtext info */}
      <div className="text-center">
        <p className="text-[9px] font-press-start text-[#FFD166] uppercase tracking-wider animate-pulse">
          {isListening ? 'BUMBLEBEE LISTENING...' : 'TAP TO TALK'}
        </p>
        <p className="text-[11px] font-sans text-[#A89060] mt-1.5 line-clamp-1 italic px-2">
          "{statusText}"
        </p>
      </div>
    </div>
  );
}
