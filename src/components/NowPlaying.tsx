import React from 'react';
import SpinningDisc from './SpinningDisc';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import BumblebeeSprite from './BumblebeeSprite';
import VoiceButton from './VoiceButton';
import VolumeSlider from './VolumeSlider';
import PixelVisualizer from './PixelVisualizer';
import { Track } from '../types';
import { Sparkles, HelpCircle } from 'lucide-react';

interface NowPlayingProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  hasDetectedWakeWord: boolean;
  isListening: boolean;
  statusText: string;
  isIOS: boolean;
  themeStyle: any; // Theme variables mapping
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
  onToggleListening: () => void;
}

export default function NowPlaying({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  hasDetectedWakeWord,
  isListening,
  statusText,
  isIOS,
  themeStyle,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleListening
}: NowPlayingProps) {

  const title = currentTrack ? currentTrack.title : 'NO SONGS LOADING';
  const artist = currentTrack ? currentTrack.artist : 'Select a track or command me!';
  const thumbnail = currentTrack ? currentTrack.thumbnail : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px] mx-auto select-none px-2 py-4">
      
      {/* VINYL DISC AND PLAYBACK CONTAINER */}
      <div className={`w-full ${themeStyle.surface} border-4 ${themeStyle.border} p-4 relative`}
           style={{ boxShadow: '4px 4px 0px #0F0A00' }}>
        
        {/* Retro Header Accent */}
        <div className="flex justify-between items-center border-b-2 border-dashed border-[#A89060] pb-2 mb-2">
          <span className="font-press-start text-[8px] text-[#A89060] tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D4A017] animate-pulse" /> 
            NOW INSTALLED & BZZZNG
          </span>
          <span className="font-mono text-[9px] text-[#A89060]">DECK-01</span>
        </div>

        {/* Large Centered Spinning Record Disc */}
        <SpinningDisc
          isPlaying={isPlaying}
          isLoading={isLoading}
          hasDetectedWakeWord={hasDetectedWakeWord}
          thumbnailUrl={thumbnail}
          title={title}
          artist={artist}
          themeStyle={themeStyle}
        />

        {/* Active Audio Wave Progress Track */}
        <div className="flex justify-center mt-3">
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>

        {/* Controls Board */}
        <div className="mt-3">
          <Controls
            isPlaying={isPlaying}
            isShuffle={isShuffle}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrevious={onPrevious}
            onToggleShuffle={onToggleShuffle}
            themeStyle={themeStyle}
          />
        </div>
      </div>

      {/* DYNAMIC PIXEL ART AUDIO VISUALIZER */}
      <PixelVisualizer
        isPlaying={isPlaying}
        isLoading={isLoading}
        isListening={isListening}
        volume={volume}
        themeStyle={themeStyle}
        currentTrackId={currentTrack?.id}
      />

      {/* TONE CONTROLLER AND VOLUME SECTION */}
      <div className="w-full flex justify-center gap-1">
        <VolumeSlider
          volume={volume}
          onChange={onVolumeChange}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
        />
      </div>

      {/* VOICE INTERFACE CONTROLS */}
      <div className="w-full relative flex flex-col items-center">
        <VoiceButton
          isListening={isListening}
          onToggleListening={onToggleListening}
          statusText={statusText}
        />

        {/* iOS Touch device tooltip fallback */}
        {isIOS && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 p-2 border border-[#C87941] bg-[#1C1408] text-[#C87941] text-[10px] w-full text-center">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <p className="font-sans leading-snug">
              iOS Safari blocks wake word workers. Click the microphone above to command BUMBLEBEE.
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM FLOATING CHARACTER CORNER */}
      <div className="fixed bottom-16 right-4 sm:right-6 md:right-10 z-50 flex flex-col items-center bg-[#1C1408]/80 border-2 border-[#D4A017] p-1 shadow-md">
        <BumblebeeSprite
          isPlaying={isPlaying}
          isListening={isListening}
          hasDetectedWakeWord={hasDetectedWakeWord}
          size={52}
        />
        <span className="font-press-start text-[6px] text-[#D4A017] text-center mt-0.5">BEE-OS v1</span>
      </div>
    </div>
  );
}
