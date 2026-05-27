import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useAudio from './hooks/useAudio';
import useVoice from './hooks/useVoice';
import useWakeWord from './hooks/useWakeWord';
import usePWA from './hooks/usePWA';
import { parseVoiceCommand, getRecommendations } from './utils/geminiApi';
import { searchYouTube } from './utils/youtubeApi';
import { Track, ScreenType } from './types';

// Screen imports
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import SearchScreen from './components/SearchScreen';
import HistoryScreen from './components/HistoryScreen';
import Settings from './components/Settings';

// Icons
import { Radio, ListMusic, Search, History, Settings as SettingsIcon, Download, Disc, Mic } from 'lucide-react';

const themes = {
  gold: { // Wood & Honey (70s Walnut High Fidelity)
    bg: 'bg-[#120A03]',
    surface: 'bg-[#291809]',
    border: 'border-[#F4B03F]',
    accentColor: '#F4B03F',
    textColor: '#FFF4E0',
    text: 'text-[#FFF4E0]',
    muted: 'text-[#B58A55]',
    glow: '#FFCB74',
    borderClass: 'border-[#F4B03F]',
    borderBg: 'border-[#120A03]',
    bgColor: '#120A03',
    surfaceColor: '#291809'
  },
  midnight: { // Cosmic Vinyl (Plum Indigo Groove)
    bg: 'bg-[#070310]',
    surface: 'bg-[#190C29]',
    border: 'border-[#00E5D7]',
    accentColor: '#00E5D7',
    textColor: '#EADDF8',
    text: 'text-[#EADDF8]',
    muted: 'text-[#7B538E]',
    glow: '#6CF2EA',
    borderClass: 'border-[#00E5D7]',
    borderBg: 'border-[#070310]',
    bgColor: '#070310',
    surfaceColor: '#190C29'
  },
  forest: { // Avocado Velvet (Lounge Olive)
    bg: 'bg-[#0A100B]',
    surface: 'bg-[#18261A]',
    border: 'border-[#AACC4E]',
    accentColor: '#AACC4E',
    textColor: '#E6ECE7',
    text: 'text-[#E6ECE7]',
    muted: 'text-[#6C8466]',
    glow: '#C0EB6A',
    borderClass: 'border-[#AACC4E]',
    borderBg: 'border-[#0A100B]',
    bgColor: '#0A100B',
    surfaceColor: '#18261A'
  },
  rose: { // Terracotta Sunset (Solar Hearth)
    bg: 'bg-[#190602]',
    surface: 'bg-[#381106]',
    border: 'border-[#FF5625]',
    accentColor: '#FF5625',
    textColor: '#FCEBE6',
    text: 'text-[#FCEBE6]',
    muted: 'text-[#A25D4A]',
    glow: '#FF8A65',
    borderClass: 'border-[#FF5625]',
    borderBg: 'border-[#190602]',
    bgColor: '#190602',
    surfaceColor: '#381106'
  }
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('now-playing');
  
  // Custom theme & interaction settings states
  const [theme, setTheme] = useState<'gold' | 'midnight' | 'forest' | 'rose'>('gold');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // States guiding reactive bee character actions
  const [hasDetectedWakeWord, setHasDetectedWakeWord] = useState(false);

  // Load custom utilities
  const audio = useAudio();
  const pwa = usePWA();

  const themeStyle = useMemo(() => themes[theme], [theme]);

  // Keep updated ref of voice status and utils to resolve circular dependency beautifully
  const voiceRef = useRef<any>(null);

  // Command router and orchestrator
  const executeCommand = useCallback(async (command: string, query: string) => {
    console.log(`Bumblebee Command Executor: [${command}] with query "${query}"`);
    
    switch (command) {
      case 'play':
      case 'mood':
        if (query) {
          audio.setEqualizer(command === 'mood' ? 'lofi' : 'flat');
          setActiveScreen('now-playing');
          try {
            const results = await searchYouTube(query);
            if (results && results.length > 0) {
              await audio.playTrack(results[0]);
            } else {
              voiceRef.current?.speak(`I searched but couldn't find any sweet tracks on YouTube matching ${query}.`);
            }
          } catch (err) {
            console.error("Voice command play search failed:", err);
          }
        }
        break;
      case 'skip':
        audio.skip();
        break;
      case 'previous':
        audio.previous();
        break;
      case 'volume_up':
        audio.setVolume(audio.volume + 15);
        break;
      case 'volume_down':
        audio.setVolume(audio.volume - 15);
        break;
      case 'pause':
        audio.togglePlay();
        break;
      case 'whats_playing':
        if (audio.currentTrack) {
          voiceRef.current?.speak(`The honeycomb is vibrating with "${audio.currentTrack.title}" by ${audio.currentTrack.artist}.`);
        } else {
          voiceRef.current?.speak("The audio honeycomb is quiet. Tell me what to play next!");
        }
        break;
      case 'shuffle':
        audio.toggleShuffle();
        break;
      case 'add_to_queue':
        if (query) {
          try {
            const results = await searchYouTube(query);
            if (results && results.length > 0) {
              audio.addToQueue(results[0]);
              voiceRef.current?.speak(`Added ${results[0].title} directly to your honey queue.`);
            } else {
              voiceRef.current?.speak(`Couldn't find any sweet tracks matching ${query} to add.`);
            }
          } catch (err) {
            console.error("Voice add to queue fail:", err);
          }
        }
        break;
      default:
        console.warn("Bumblebee: Noted general query");
        break;
    }
  }, [audio]);

  // Voice transcript receiver callback
  const handleTranscriptReady = useCallback(async (transcript: string) => {
    try {
      // Warmly notify the user we are decoding their buzz command
      voiceRef.current?.setStatusText(`Processing: "${transcript}"...`);

      // 1. Send text to server for Gemini decision routing
      const result = await parseVoiceCommand(transcript, audio.currentTrack, audio.isPlaying);
      
      // 2. Play BUMBLEBEE's voice synthesized line back
      voiceRef.current?.speak(result.speechResponse);

      // 3. Trigger playback execution
      executeCommand(result.command, result.query);
    } catch (e) {
      console.error("Gemini commander parsing failure", e);
      voiceRef.current?.setStatusText("Standby");
    }
  }, [audio.currentTrack, audio.isPlaying, executeCommand]);

  // Voice engine initializer hooks
  const voice = useVoice({
    onTranscriptReady: handleTranscriptReady,
    voiceEnabled
  });

  // Keep ref synchronized on renders
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  // Wake word triggers
  const handleWakeWordDetected = useCallback(() => {
    setHasDetectedWakeWord(true);
    
    // Automatically trigger audio recording window after speaking greeting is finished
    voiceRef.current?.speak("Buzzing in! I'm listening.", () => {
      voiceRef.current?.startListening();
      setHasDetectedWakeWord(false);
    });
  }, []);

  const wakeWord = useWakeWord({
    onWakeWordDetected: handleWakeWordDetected,
    wakeWordEnabled,
    voiceActive: voice.isListening || hasDetectedWakeWord
  });

  // Track ended handler suggestions
  const handleBuildPlaylistFromHistory = useCallback(async () => {
    if (audio.history.length === 0) return;
    try {
      voiceRef.current?.speak("Analyzing honey flight records! Generating your custom nectar list.");
      const response = await getRecommendations(audio.history);
      
      // Load top suggestion
      if (response.recommendations && response.recommendations.length > 0) {
        voiceRef.current?.speak(response.speechResponse);
        setActiveScreen('now-playing');
        
        const mainRec = response.recommendations[0];
        try {
          const results = await searchYouTube(mainRec.searchTerm);
          if (results && results.length > 0) {
            await audio.playTrack(results[0]);
            
            // Queue up remaining recommendations in the background as a playlist!
            for (let i = 1; i < response.recommendations.length; i++) {
              try {
                const subResults = await searchYouTube(response.recommendations[i].searchTerm);
                if (subResults && subResults.length > 0) {
                  audio.addToQueue(subResults[0]);
                }
              } catch (subErr) {
                console.warn("Failed queuing sub suggestion:", subErr);
              }
            }
          }
        } catch (searchErr) {
          console.error("Suggest search play failed:", searchErr);
        }
      }
    } catch (e) {
      console.error("Smart historical compilation failed", e);
    }
  }, [audio.history, audio.playTrack, audio.addToQueue]);

  // Handle playing custom queue tracks natively
  const handleQueuePlaySelected = useCallback((track: Track) => {
    audio.playTrack(track, true);
    setActiveScreen('now-playing');
    voiceRef.current?.speak(`Playing queue item: ${track.title}.`);
  }, [audio]);

  return (
    <div className={`min-h-screen ${themeStyle.bg} pb-24 overflow-x-hidden flex flex-col relative font-sans`}>
      
      {/* GLOBAL ALWAYS-LISTENING MIC INDICATOR */}
      {wakeWord.isReady && (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 bg-[#1C1408] border-2 border-[#D4A017] px-2 py-1 shadow-md animate-pulse">
          <div className="w-2 h-2 rounded-full bg-[#FFD166] animate-ping" />
          <Mic className="w-3.5 h-3.5 text-[#D4A017]" />
          <span className="font-press-start text-[6px] text-[#FFF8E7] uppercase tracking-wider">ALWAYS-ON</span>
        </div>
      )}

      {/* RETRO SCANLINES SCREEN FILTER SHIELDS */}
      <div className="crt-overlay" />

      {/* TOP DECK TITLE HEADER BAR */}
      <header className={`w-full max-w-[480px] mx-auto pt-6 px-4 pb-2 z-10 select-none`}>
        <div className={`flex items-center justify-between border-b-4 ${themeStyle.border} pb-3 mb-1`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-sm flex items-center justify-center animate-pulse"
              style={{
                backgroundColor: `${themeStyle.accentColor}20`,
                border: `2px solid ${themeStyle.accentColor}`,
                boxShadow: `0 0 10px ${themeStyle.accentColor}40`
              }}
            >
              <Disc className="w-5 h-5" style={{ color: themeStyle.accentColor }} />
            </div>
            <div>
              <h1 
                className="font-press-start text-[14px] sm:text-[18px] tracking-tighter uppercase"
                style={{ color: '#FAFAFA' }}
              >
                BUMBLEBEE
              </h1>
              <p 
                className="font-press-start text-[6px] tracking-widest uppercase mt-1 opacity-80"
                style={{ color: themeStyle.textColor }}
              >
                AUDIO CHASSIS // AI
              </p>
            </div>
          </div>

          {/* Quick install block as Home page notification bar */}
          {pwa.isReadyToInstall ? (
            <button
              onClick={pwa.triggerInstall}
              className="px-2 py-1.5 bg-[#C87941] border border-[#D4A017] text-[#FFF8E7] hover:bg-[#D4A017] hover:text-[#0F0A00] font-press-start text-[7px] uppercase tracking-wider animate-bounce cursor-pointer flex items-center gap-1 shrink-0"
              id="btn-header-pwa-install"
            >
              <Download className="w-3 h-3" /> INSTALL APP
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#1C1408] border border-[#D4A017]/30 px-2 py-1.5 rounded-none" style={{ boxShadow: '2px 2px 0px #0F0A00' }}>
              <div className="flex flex-col items-center">
                <span className="text-[5px] font-press-start text-[#A89060] mb-0.5">PWR</span>
                <div 
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: themeStyle.accentColor,
                    boxShadow: `0 0 6px ${themeStyle.accentColor}`
                  }}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[5px] font-press-start text-[#A89060] mb-0.5">SIG</span>
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-[400ms] ${audio.isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: audio.isPlaying ? themeStyle.glow : '#2D200E',
                    boxShadow: audio.isPlaying ? `0 0 6px ${themeStyle.glow}` : 'none'
                  }}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[5px] font-press-start text-[#A89060] mb-0.5">VOX</span>
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${(voice.isListening || hasDetectedWakeWord) ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: (voice.isListening || hasDetectedWakeWord) ? '#EC4899' : '#1C1408',
                    border: `1px solid ${themeStyle.accentColor}`,
                    boxShadow: (voice.isListening || hasDetectedWakeWord) ? '0 0 6px #EC4899' : 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic install guidelines marquee */}
        {pwa.isReadyToInstall && (
          <div className="bg-[#1C1408] border border-[#D4A017] py-0.5 px-2 mb-2 w-full overflow-hidden">
            <span className="font-press-start text-[6px] text-[#FFD166] uppercase animate-pulse">
              ★ SYSTEM ALERT: TAP 'INSTALL APP' FOR STANDALONE RETRO PERFORMANCE!
            </span>
          </div>
        )}
      </header>

      {/* CENTRAL CORE VIEW-SCREEN FRAME */}
      <div 
        className="flex-1 w-full max-w-[460px] mx-auto px-4 z-10 mb-8 relative p-4 border-4"
        style={{ 
          borderColor: themeStyle.accentColor,
          backgroundColor: `${themeStyle.surfaceColor}F2`, // Slightly translucent surface color
          boxShadow: `inset 0 0 24px rgba(0,0,0,0.85), 5px 5px 0px #000, 10px 10px 30px rgba(0,0,0,0.6)`
        }}
        id="chassis-cabinet-body"
      >
        {/* Physical ventilation speaker grates on details sides */}
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 flex flex-col gap-1 opacity-25">
          <div className="w-1 h-10 opacity-70 border-r" style={{ borderColor: themeStyle.accentColor }} />
          <div className="w-1 h-10 opacity-70 border-r" style={{ borderColor: themeStyle.accentColor }} />
          <div className="w-1 h-10 opacity-70 border-r" style={{ borderColor: themeStyle.accentColor }} />
        </div>
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 flex flex-col gap-1 opacity-25">
          <div className="w-1 h-10 opacity-70 border-l" style={{ borderColor: themeStyle.accentColor }} />
          <div className="w-1 h-10 opacity-70 border-l" style={{ borderColor: themeStyle.accentColor }} />
          <div className="w-1 h-10 opacity-70 border-l" style={{ borderColor: themeStyle.accentColor }} />
        </div>

        {/* Chassis corner physical metallic panel brass screws */}
        <div className="absolute top-2 left-6 text-[7px] font-mono select-none opacity-50 font-bold" style={{ color: themeStyle.textColor }}>✛</div>
        <div className="absolute top-2 right-6 text-[7px] font-mono select-none opacity-50 font-bold" style={{ color: themeStyle.textColor }}>✛</div>

        <main className="w-full">
          {activeScreen === 'now-playing' && (
          <NowPlaying
            currentTrack={audio.currentTrack}
            isPlaying={audio.isPlaying}
            isLoading={audio.isLoading}
            currentTime={audio.currentTime}
            duration={audio.duration}
            volume={audio.volume}
            isMuted={audio.isMuted}
            isShuffle={audio.isShuffle}
            hasDetectedWakeWord={hasDetectedWakeWord}
            isListening={voice.isListening}
            statusText={voice.statusText}
            isIOS={wakeWord.isIOS}
            themeStyle={themeStyle}
            onTogglePlay={audio.togglePlay}
            onNext={audio.skip}
            onPrevious={audio.previous}
            onToggleShuffle={audio.toggleShuffle}
            onSeek={audio.seek}
            onVolumeChange={audio.setVolume}
            onToggleMute={audio.toggleMute}
            onToggleListening={voice.toggleListening}
          />
        )}

        {activeScreen === 'queue' && (
          <Queue
            queue={audio.queue}
            currentTrack={audio.currentTrack}
            isPlaying={audio.isPlaying}
            themeStyle={themeStyle}
            onRemove={audio.removeFromQueue}
            onReorder={audio.reorderQueue}
            onPlayTrack={handleQueuePlaySelected}
            onReplaceQueue={audio.reorderQueue}
            onAddToQueue={audio.addToQueue}
          />
        )}

        {activeScreen === 'search' && (
          <SearchScreen
            themeStyle={themeStyle}
            onPlayTrack={audio.playTrack}
            onAddToQueue={audio.addToQueue}
            statusText={voice.statusText}
            isListening={voice.isListening}
            onToggleListening={voice.toggleListening}
          />
        )}

        {activeScreen === 'history' && (
          <HistoryScreen
            history={audio.history}
            themeStyle={themeStyle}
            onPlayTrack={audio.playTrack}
            onBuildPlaylist={handleBuildPlaylistFromHistory}
          />
        )}

        {activeScreen === 'settings' && (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
            equalizer={audio.equalizer}
            onEqualizerChange={audio.setEqualizer}
            wakeWordEnabled={wakeWordEnabled}
            onWakeWordToggle={() => setWakeWordEnabled(prev => !prev)}
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => setVoiceEnabled(prev => !prev)}
            wakeWordStatus={wakeWord.status}
            lastTranscriptChunk={wakeWord.lastTranscriptChunk}
            themeStyle={themeStyle}
          />
        )}
        </main>
      </div>

      {/* FIXED FOOTER CONTROLS / SCREEN MOVEMENT TABS */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] ${themeStyle.surface} border-t-4 ${themeStyle.border} grid grid-cols-5 p-1 px-2 gap-1 z-40 select-none`}>
        {/* NAV PLAY */}
        <button
          onClick={() => setActiveScreen('now-playing')}
          className="flex flex-col items-center justify-center py-2 relative transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: activeScreen === 'now-playing' ? themeStyle.accentColor : 'transparent',
            color: activeScreen === 'now-playing' ? '#0F0A00' : themeStyle.textColor,
          }}
          id="nav-tab-now-playing"
        >
          <Radio className="w-5 h-5 mb-1" />
          <span className="font-press-start text-[6px] tracking-wide">DECK</span>
          {activeScreen === 'now-playing' && (
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: themeStyle.glow }} />
          )}
        </button>

        {/* NAV QUEUE */}
        <button
          onClick={() => setActiveScreen('queue')}
          className="flex flex-col items-center justify-center py-2 relative transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: activeScreen === 'queue' ? themeStyle.accentColor : 'transparent',
            color: activeScreen === 'queue' ? '#0F0A00' : themeStyle.textColor,
          }}
          id="nav-tab-queue"
        >
          <div className="relative">
            <ListMusic className="w-5 h-5 mb-1" />
            {audio.queue.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white font-mono font-bold text-[8px] px-1 rounded-none border border-black">
                {audio.queue.length}
              </span>
            )}
          </div>
          <span className="font-press-start text-[6px] tracking-wide">QUEUE</span>
          {activeScreen === 'queue' && (
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: themeStyle.glow }} />
          )}
        </button>

        {/* NAV SEARCH */}
        <button
          onClick={() => setActiveScreen('search')}
          className="flex flex-col items-center justify-center py-2 relative transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: activeScreen === 'search' ? themeStyle.accentColor : 'transparent',
            color: activeScreen === 'search' ? '#0F0A00' : themeStyle.textColor,
          }}
          id="nav-tab-search"
        >
          <Search className="w-5 h-5 mb-1" />
          <span className="font-press-start text-[6px] tracking-wide">SCAN</span>
          {activeScreen === 'search' && (
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: themeStyle.glow }} />
          )}
        </button>

        {/* NAV HISTORY */}
        <button
          onClick={() => setActiveScreen('history')}
          className="flex flex-col items-center justify-center py-2 relative transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: activeScreen === 'history' ? themeStyle.accentColor : 'transparent',
            color: activeScreen === 'history' ? '#0F0A00' : themeStyle.textColor,
          }}
          id="nav-tab-history"
        >
          <History className="w-5 h-5 mb-1" />
          <span className="font-press-start text-[6px] tracking-wide">LOGS</span>
          {activeScreen === 'history' && (
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: themeStyle.glow }} />
          )}
        </button>

        {/* NAV SETTINGS */}
        <button
          onClick={() => setActiveScreen('settings')}
          className="flex flex-col items-center justify-center py-2 relative transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: activeScreen === 'settings' ? themeStyle.accentColor : 'transparent',
            color: activeScreen === 'settings' ? '#0F0A00' : themeStyle.textColor,
          }}
          id="nav-tab-settings"
        >
          <SettingsIcon className="w-5 h-5 mb-1" />
          <span className="font-press-start text-[6px] tracking-wide">CONF</span>
          {activeScreen === 'settings' && (
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: themeStyle.glow }} />
          )}
        </button>
      </nav>

    </div>
  );
}
