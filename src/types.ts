export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export type ScreenType = 'now-playing' | 'queue' | 'search' | 'history' | 'settings';

export type EqualizerPreset = 'bass' | 'flat' | 'treble' | 'lofi';

export type ThemePreset = 'gold' | 'midnight' | 'forest' | 'rose';

export interface BumblebeeState {
  isPlaying: boolean;
  isListening: boolean;
  hasDetectedWakeWord: boolean;
  statusText: string;
}
