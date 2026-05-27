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
      setStatusText('Listening...');
      console.log("Bumblebee: Voice recording started...");
    };

    rec.onerror = (event: any) => {
      console.error('Bumblebee: Speech recognition error', event);
      setIsListening(false);
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
      // Soft clean: only reset to Standby if still looking like active listening
      setStatusText(prev => prev === 'Listening...' ? 'Standby' : prev);
    };

    rec.onresult = (event: any) => {
      const results = event.results;
      if (results && results.length > 0) {
        const transcript = results[0][0].transcript;
        console.log("Bumblebee: Registered transcript:", transcript);
        setStatusText(`"${transcript}"`);
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

    // Abort continuous wake-word detector synchronously to free mic line
    if (window.__bumblebeeSpeechCore && typeof window.__bumblebeeSpeechCore.stopWakeWord === 'function') {
      window.__bumblebeeSpeechCore.stopWakeWord();
    }

    // Cancel the synth if speaking, then start recording
    try {
      window.speechSynthesis.cancel();
      setIsListening(true);
      setStatusText('Listening...');
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech Recognition re-entry block", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setStatusText('Processing command...');
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
  const speak = useCallback((text: string) => {
    if (!voiceEnabled) {
      console.log(`Bumblebee muted speak: "${text}"`);
      return;
    }

    // Cancel any active utterance
    window.speechSynthesis.cancel();

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
