import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';
import { searchYouTube } from '../utils/youtubeApi';

// Declare global YT interface
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isDucked, setIsDucked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Queue state management
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);

  // Playback modes/presets
  const [equalizer, setEqualizer] = useState<'bass' | 'flat' | 'treble' | 'lofi'>('flat');

  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<number | null>(null);
  const handleTrackEndedRef = useRef<() => void>(() => {});

  // Keep track-ended callback fresh inside player events
  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  });

  // 1. Initialise localStorage History
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('bumblebee_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.warn("localStorage history read failed", e);
    }
  }, []);

  const saveHistory = (newHistory: Track[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('bumblebee_history', JSON.stringify(newHistory.slice(0, 20)));
    } catch (e) {
      console.warn("localStorage history save failed", e);
    }
  };

  // 2. Load YouTube IFrame Player API Dynamically
  useEffect(() => {
    const initPlayer = () => {
      // Check if div exists, else append
      let playerDiv = document.getElementById('youtube-iframe-target');
      if (!playerDiv) {
        playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-iframe-target';
        playerDiv.style.position = 'fixed';
        playerDiv.style.left = '-10000px'; // Place fully offscreen
        playerDiv.style.top = '0';
        playerDiv.style.width = '300px';   // Give it a non-zero, healthy visible dimension
        playerDiv.style.height = '200px';
        playerDiv.style.opacity = '1';      // Opacity 1 ensures the browser schedules and triggers its processing smoothly
        playerDiv.style.pointerEvents = 'none';
        playerDiv.style.zIndex = '-9999';
        document.body.appendChild(playerDiv);
      }

      try {
        playerRef.current = new window.YT.Player('youtube-iframe-target', {
          height: '200',
          width: '300',
          videoId: 'A7_tXscfU00', // Initialize with a nice retro theme track
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              console.log("Bumblebee: YouTube Player ready");
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              }
            },
            onStateChange: (event: any) => {
              // States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
              const state = event.data;
              console.log("Bumblebee: Player State Change:", state);
              
              if (state === 1) { // Playing
                setIsPlaying(true);
                setIsLoading(false);
                setDuration(event.target.getDuration());
              } else if (state === 2) { // Paused
                setIsPlaying(false);
              } else if (state === 3) { // Buffering
                setIsLoading(true);
              } else if (state === 0) { // Ended (Play next in queue!)
                setIsPlaying(false);
                handleTrackEndedRef.current();
              }
            }
          }
        });
      } catch (err) {
        console.error("Bumblebee: Fail to create YouTube Player object:", err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load script
      console.log("Bumblebee: Loading YouTube Player API script...");
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.body.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        console.log("Bumblebee: YouTube Iframe API Loaded");
        initPlayer();
      };
    }

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // 3. Track Playback Progress Monitor Loop
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = window.setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setCurrentTime(playerRef.current.getCurrentTime());
          // Sometimes duration isn't set immediately, poll it
          if (duration === 0) {
            setDuration(playerRef.current.getDuration() || 0);
          }
        }
      }, 500);
    } else {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [isPlaying, duration]);


  // Integrated Dynamic Audio Ducking controller
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;

    if (isDucked) {
      // Duck to 15% of current volume, or a minimum low level like 12 (unless muted entirely)
      const targetVolume = isMuted ? 0 : Math.max(12, Math.floor(volume * 0.15));
      playerRef.current.setVolume(targetVolume);
      console.log(`Bumblebee Engine: Ducking audio stream to ${targetVolume}% (User level is ${volume}%)`);
    } else {
      // Restore player volume to the user's setting
      playerRef.current.setVolume(isMuted ? 0 : volume);
      console.log(`Bumblebee Engine: Restoring audio stream to setting ${volume}%`);
    }
  }, [isDucked, volume, isMuted]);


  // Play specific song
  const playTrack = useCallback(async (track: Track, bypassAutoSuggest = false) => {
    if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') {
      console.warn("YouTube player not fully booted yet.");
      return;
    }

    try {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setCurrentTrack(track);

      // Save into history, removing any duplicate first representings
      const filteredHistory = history.filter(t => t.id !== track.id);
      saveHistory([track, ...filteredHistory]);

      // Trigger YouTube Iframe player loading
      playerRef.current.loadVideoById(track.id);
      playerRef.current.playVideo();
      setIsPlaying(true);

      // Auto building 10 similar tracks if requested
      if (!bypassAutoSuggest) {
        buildAutoPlaylist(track);
      }
    } catch (e) {
      console.error("Playtrack fail:", e);
      setIsLoading(false);
    }
  }, [history]);

  // Builds secondary queue matches using artist or query suggestions
  const buildAutoPlaylist = async (track: Track) => {
    try {
      console.log(`Bumblebee: Auto-suggesting similar tracks for: "${track.artist}"`);
      const related = await searchYouTube(`${track.artist} best official tracks`);
      // Exclude currently playing track
      const filtered = related.filter(t => t.id !== track.id).slice(0, 10);
      if (filtered.length > 0) {
        setQueue(filtered);
      }
    } catch (err) {
      console.warn("Fail building automatic smart suggestion list", err);
    }
  };

  const handleTrackEnded = () => {
    // If we have items in the queue, skip to next
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(next, true); // Don't trigger suggestions inside suggestions to prevent loops
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const skip = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(next, true);
    }
  }, [queue, playTrack]);

  const previous = useCallback(() => {
    // Replay current if more than 3 seconds elapsed
    if (currentTime > 3) {
      seek(0);
      return;
    }
    // Else check history 
    if (history.length > 1) {
      // history[0] is active track, history[1] is previous track
      const prevTrack = history[1];
      // Move active track to front of queue
      if (currentTrack) {
        setQueue(prev => [currentTrack, ...prev]);
      }
      playTrack(prevTrack, true);
    } else {
      seek(0); // Restart
    }
  }, [history, currentTime, currentTrack, playTrack]);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const bounded = Math.max(0, Math.min(100, newVolume));
    setVolume(bounded);
    setIsMuted(bounded === 0);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(bounded);
      if (bounded > 0 && isMuted) {
        playerRef.current.unMute();
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      if (volume === 0) setVolume(50);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const seek = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const nextVal = !prev;
      if (nextVal && queue.length > 1) {
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
      }
      return nextVal;
    });
  }, [queue]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const reorderQueue = useCallback((newQueue: Track[]) => {
    setQueue(newQueue);
  }, []);

  const buildPlaylistFromHistory = async () => {
    if (history.length === 0) return;
    try {
      setIsLoading(true);
      const seedName = history[0].artist;
      const results = await searchYouTube(`${seedName} best greatest chiptune hits`);
      setQueue(results.slice(0, 10));
      if (results.length > 0) {
        playTrack(results[0], true);
      }
    } catch (err) {
      console.warn("History building playlist match failed", err);
      setIsLoading(false);
    }
  };

  return {
    isPlaying,
    isLoading,
    volume,
    isMuted,
    isDucked,
    setIsDucked,
    currentTime,
    duration,
    currentTrack,
    queue,
    history,
    isShuffle,
    equalizer,
    setEqualizer,
    playTrack,
    togglePlay,
    skip,
    previous,
    setVolume: setVolumeLevel,
    toggleMute,
    seek,
    toggleShuffle,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    buildPlaylistFromHistory
  };
}
