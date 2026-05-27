import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface for Web Speech SDK fallback
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    __bumblebeeSpeechCore?: any;
  }
}

// Set up a global SpeechCore coordinator on the window to prevent double-booking the browser microphone
if (typeof window !== 'undefined') {
  window.__bumblebeeSpeechCore = window.__bumblebeeSpeechCore || {
    activeWakeWordRec: null,
    activeVoiceRec: null,
    isVoiceListening: false,
    isSpeaking: false,
    stopWakeWord: () => {
      const core = window.__bumblebeeSpeechCore;
      if (core && core.activeWakeWordRec) {
        console.log("Bumblebee SpeechCore: Synchronously aborting continuous wake-word session to liberate microphone.");
        try {
          core.activeWakeWordRec.abort();
        } catch (e) {}
        core.activeWakeWordRec = null;
      }
    }
  };
}

interface UseVoiceOptions {
  onTranscriptReady: (transcript: string) => void;
  voiceEnabled: boolean; // Settings control
}

export default function useVoice({ onTranscriptReady, voiceEnabled }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Standby');
  const recognitionRef = useRef<any>(null);

  // Keep a ref of the latest callback to prevent re-initializing recognition on callback change
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  // Keep active status synchronized in global core for useWakeWord
  useEffect(() => {
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isVoiceListening = isListening;
    }
  }, [isListening]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setStatusText('Speech Recognition not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = true;
      }
      setStatusText('Listening...');
      console.log("Bumblebee: Voice recording started...");
    };

    rec.onerror = (event: any) => {
      console.error('Bumblebee: Speech recognition error', event);
      setIsListening(false);
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = false;
      }
      if (event.error === 'not-allowed') {
        setStatusText('Permission denied. Please enable mic access.');
      } else if (event.error === 'aborted') {
        setStatusText('Cancel');
      } else {
        setStatusText(`Error: ${event.error}`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = false;
      }
      // Soft clean: only reset to Standby if still looking like active listening
      setStatusText(prev => prev === 'Listening...' ? 'Standby' : prev);
    };

    rec.onresult = (event: any) => {
      const results = event.results;
      if (results && results.length > 0) {
        const transcript = results[0][0].transcript;
        console.log("Bumblebee: Registered transcript:", transcript);
        setStatusText(`"${transcript}"`);
        
        // Stop listing immediately so the user's mic closes immediately!
        try {
          rec.stop();
        } catch (e) {}
        setIsListening(false);
        if (window.__bumblebeeSpeechCore) {
          window.__bumblebeeSpeechCore.isVoiceListening = false;
        }

        onTranscriptReadyRef.current(transcript);
      }
    };

    recognitionRef.current = rec;
  }, []);

  // Command to trigger recording
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setStatusText('Speech Recognition unavailable.');
      return;
    }

    // Cancel any current speech synthesis first
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    // Synchronously claim transcription lock in global core
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isVoiceListening = true;
      // Abort continuous wake-word detector synchronously to free mic line
      if (typeof window.__bumblebeeSpeechCore.stopWakeWord === 'function') {
        window.__bumblebeeSpeechCore.stopWakeWord();
      }
    }

    setIsListening(true);
    setStatusText('Listening...');

    // Add a safe 250ms delay to give browser mic layers time to cleanly disengage the wake-word listener
    setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech Recognition collision/start issue, reclaiming session:", e);
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error("Speech Recognition restart failed:", err);
            }
          }, 200);
        } catch (abortErr) {}
      }
    }, 250);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setStatusText('Processing command...');
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isVoiceListening = false;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop(); // Stops capture but lets onresult handle remaining buffers
      } catch (e) {
        try {
          recognitionRef.current.abort(); // Fallback hard abort
        } catch (err) {}
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // BUMBLEBEE Voice synthesis SPEAK BACK helper
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!voiceEnabled) {
      console.log(`Bumblebee muted speak: "${text}"`);
      if (onEnd) onEnd();
      return;
    }

    // Cancel any active utterance
    window.speechSynthesis.cancel();

    // Mark system speaking immediately in global core
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isSpeaking = true;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose high retro pitch for bee effect
    utterance.pitch = 1.35; // Cute high pitch
    utterance.rate = 1.1;   // Slightly fast energetic rate
    utterance.volume = 1.0;

    // Direct pitch adjustments and voice matching
    const voices = window.speechSynthesis.getVoices();
    // Try to find a nice high English voice if available
    const chosenVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) || 
                        voices.find(v => v.lang.startsWith('en')) || 
                        voices[0];
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isSpeaking = true;
      }
    };

    const handleSpeakComplete = () => {
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isSpeaking = false;
      }
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onend = handleSpeakComplete;
    utterance.onerror = handleSpeakComplete;

    window.speechSynthesis.speak(utterance);
    setStatusText(`Bumblebee: "${text}"`);
  }, [voiceEnabled]);

  return {
    isListening,
    statusText,
    setStatusText,
    startListening,
    stopListening,
    toggleListening,
    speak
  };
}
