import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BumblebeeSpriteProps {
  isPlaying: boolean;
  isListening: boolean;
  hasDetectedWakeWord: boolean;
  size?: number;
}

export default function BumblebeeSprite({
  isPlaying,
  isListening,
  hasDetectedWakeWord,
  size = 64
}: BumblebeeSpriteProps) {
  // Determine current active animation state: 'wakeword' | 'listening' | 'playing' | 'idle'
  const state = useMemo(() => {
    if (hasDetectedWakeWord) return 'wakeword';
    if (isListening) return 'listening';
    if (isPlaying) return 'playing';
    return 'idle';
  }, [isPlaying, isListening, hasDetectedWakeWord]);

  // Wing flapping speed & angle based on state
  const wingTransition = useMemo(() => {
    if (state === 'wakeword') {
      return { repeat: Infinity, duration: 0.1, ease: 'easeInOut' };
    }
    if (state === 'listening' || state === 'playing') {
      return { repeat: Infinity, duration: 0.2, ease: 'easeInOut' };
    }
    return { repeat: Infinity, duration: 1.0, ease: 'easeInOut' }; // Gentle idle flutter
  }, [state]);

  const bodyTransition = useMemo(() => {
    if (state === 'wakeword') return { repeat: Infinity, duration: 0.3, ease: 'easeInOut' };
    if (state === 'listening' || state === 'playing') return { repeat: Infinity, duration: 0.6, ease: 'easeInOut' };
    return { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }; // Soft breathing/float
  }, [state]);

  // Eyes and mouth reactive configurations
  const faceState = useMemo(() => {
    switch (state) {
      case 'wakeword':
        return {
          eyeWidth: 3,
          eyeHeight: 4,
          eyeColor: '#FFD166',
          hasAura: true,
          mouthOpen: true,
          cheeksGlow: true
        };
      case 'listening':
        return {
          eyeWidth: 2,
          eyeHeight: 3,
          eyeColor: '#FFD166',
          hasAura: false,
          mouthOpen: true,
          cheeksGlow: true
        };
      case 'playing':
        return {
          eyeWidth: 2,
          eyeHeight: 2,
          eyeColor: '#FFF8E7',
          hasAura: false,
          mouthOpen: false,
          cheeksGlow: false
        };
      case 'idle':
      default:
        return {
          eyeWidth: 2,
          eyeHeight: 2,
          eyeColor: '#A89060',
          hasAura: false,
          mouthOpen: false,
          cheeksGlow: false
        };
    }
  }, [state]);

  return (
    <div 
      className="relative flex items-center justify-center p-2"
      style={{ width: size, height: size }}
    >
      {/* Outer Golden Aura for Wake Word */}
      {faceState.hasAura && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#FFD166]/20 blur-md"
          animate={{ scale: [1.0, 1.3, 1.0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}

      {/* SVG Container: 32x32 crisp pixels */}
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full select-none"
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* WINGS - Left & Right */}
        <motion.g
          id="wings"
          animate={
            state === 'idle'
              ? { scaleY: [1, 0.7, 1], rotate: [0, -5, 0] }
              : { scaleY: [1, -0.4, 1], rotate: [0, 15, 0], translateY: [-1, 2, -1] }
          }
          transition={wingTransition}
          style={{ originX: '16px', originY: '14px' }}
        >
          {/* Left Wing (Beige-White Canvas) */}
          <rect x="7" y="6" width="5" height="4" fill="#FFF8E7" opacity="0.95" />
          <rect x="6" y="8" width="7" height="4" fill="#FFF8E7" opacity="0.95" />
          <rect x="8" y="12" width="4" height="2" fill="#D4A017" opacity="0.4" />
          {/* Wing Outline */}
          <rect x="8" y="5" width="3" height="1" fill="#D4A017" />
          <rect x="5" y="8" width="1" height="4" fill="#D4A017" />
          <rect x="13" y="8" width="1" height="3" fill="#D4A017" />

          {/* Right Wing */}
          <rect x="20" y="6" width="5" height="4" fill="#FFF8E7" opacity="0.95" />
          <rect x="19" y="8" width="7" height="4" fill="#FFF8E7" opacity="0.95" />
          <rect x="20" y="12" width="4" height="2" fill="#D4A017" opacity="0.4" />
          {/* Wing Outline */}
          <rect x="21" y="5" width="3" height="1" fill="#D4A017" />
          <rect x="26" y="8" width="1" height="4" fill="#D4A017" />
          <rect x="18" y="8" width="1" height="3" fill="#D4A017" />
        </motion.g>

        {/* MAIN BODY GROUP */}
        <motion.g
          id="body"
          animate={{ translateY: [0, -2, 0] }}
          transition={bodyTransition}
        >
          {/* Antennas */}
          <rect x="11" y="5" width="1" height="3" fill="#C87941" />
          <rect x="10" y="4" width="2" height="1" fill="#D4A017" />
          <rect x="20" y="5" width="1" height="3" fill="#C87941" />
          <rect x="20" y="4" width="2" height="1" fill="#D4A017" />

          {/* Stinger */}
          <rect x="15" y="24" width="2" height="3" fill="#0F0A00" />
          <rect x="16" y="27" width="1" height="1" fill="#C87941" />

          {/* Bee Body Core Structure (Golden Shell) */}
          <rect x="8" y="11" width="16" height="12" fill="#1C1408" /> {/* base shadow */}
          <rect x="9" y="10" width="14" height="13" fill="#D4A017" /> {/* main gold body */}

          {/* Stripes (Dark Warm Brown/Black) */}
          <rect x="9" y="14" width="14" height="2" fill="#0F0A00" />
          <rect x="9" y="19" width="14" height="2" fill="#0F0A00" />

          {/* Body Highlight Shimmer (Yellow-Gold Light) */}
          <rect x="10" y="11" width="12" height="1" fill="#FFD166" />
          <rect x="9" y="12" width="2" height="2" fill="#FFD166" />

          {/* Face Area (Soft Beige Cheek/Muzzle) */}
          <rect x="11" y="15" width="10" height="7" fill="#F5E6C8" />

          {/* Rosy Amber Cheeks (Blushing pixels) */}
          {faceState.cheeksGlow ? (
            <>
              <rect x="10" y="18" width="2" height="2" fill="#FFD166" />
              <rect x="20" y="18" width="2" height="2" fill="#FFD166" />
              <rect x="11" y="19" width="2" height="1" fill="#C87941" />
              <rect x="19" y="19" width="2" height="1" fill="#C87941" />
            </>
          ) : (
            <>
              <rect x="11" y="19" width="2" height="1" fill="#C87941" opacity="0.6" />
              <rect x="19" y="19" width="2" height="1" fill="#C87941" opacity="0.6" />
            </>
          )}

          {/* EYES */}
          <g id="eyes">
            {/* Left Eye */}
            <motion.rect
              x="12"
              y="15"
              width={faceState.eyeWidth}
              height={faceState.eyeHeight}
              fill={faceState.eyeColor}
              animate={state === 'idle' ? { scaleY: [1, 0.1, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
            />
            {/* Right Eye */}
            <motion.rect
              x="18"
              y="15"
              width={faceState.eyeWidth}
              height={faceState.eyeHeight}
              fill={faceState.eyeColor}
              animate={state === 'idle' ? { scaleY: [1, 0.1, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
            />
          </g>

          {/* Mouth */}
          {faceState.mouthOpen ? (
            /* Open mouth - speaking/excited */
            <rect x="15" y="19" width="2" height="2" fill="#0F0A00" />
          ) : (
            /* Mini happy line mouth */
            <rect x="15" y="19" width="2" height="1" fill="#A89060" />
          )}
        </motion.g>
      </svg>
    </div>
  );
}
