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

// Global set to prevent garbage-collection of active SpeechSynthesisUtterances in Chromium browsers
const activeUtterances = new Set<SpeechSynthesisUtterance>();

interface UseVoiceOptions {
  onTranscriptReady: (transcript: string) => void;
  voiceEnabled: boolean; // Settings control
}

export default function useVoice({ onTranscriptReady, voiceEnabled }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Standby');
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef('');
  const silenceTimerRef = useRef<any>(null);

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

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Command to trigger recording
  const startListening = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setStatusText('Speech Recognition not supported in this browser.');
      return;
    }

    // Clear any previous session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    latestTranscriptRef.current = '';

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

    // Dynamic, brand-new SpeechRecognition configuration to prevent stuck sessions or re-use locks
    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      latestTranscriptRef.current = '';
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = true;
      }
      setStatusText('Listening...');
      console.log("Bumblebee: Voice recording started on a pristine instance...");
    };

    rec.onerror = (event: any) => {
      console.warn('Bumblebee: Speech recognition error', event.error);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (event.error === 'aborted') {
        // Ignored because abort is normal upon stop button triggers
        return;
      }
      setIsListening(false);
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = false;
      }
      if (event.error === 'not-allowed') {
        setStatusText('Permission denied. Please enable mic access.');
      } else {
        setStatusText(`Error: ${event.error}`);
      }
    };

    rec.onresult = (event: any) => {
      let combinedTranscript = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i] && event.results[i][0]) {
          combinedTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
      }
      
      const currentText = combinedTranscript.trim();
      if (currentText) {
        latestTranscriptRef.current = currentText;
        setStatusText(`"${currentText}"`);
        console.log("Bumblebee transcript updated: ", currentText, " (isFinal:", isFinal, ")");

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Set a timer to automatically trigger stop
        // Wait 700ms if browser marked as final; 1300ms if we're paused or interim results pause.
        const delay = isFinal ? 700 : 1300;
        silenceTimerRef.current = setTimeout(() => {
          console.log(`Bumblebee: Silence detected for ${delay}ms. Auto-stopping with transcript: "${currentText}"`);
          if (recognitionRef.current === rec) {
            try {
              rec.stop(); // Stops mic recording and triggers the onend callback
            } catch (err) {
              console.warn("Bumblebee: Failed to gently stop, force-end stream:", err);
              // Force trigger fallback if stop fails
              rec.onend();
            }
          }
        }, delay);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isVoiceListening = false;
      }
      
      const text = latestTranscriptRef.current;
      if (text.trim()) {
        latestTranscriptRef.current = ''; // Prevent double submissions
        setStatusText(`"${text}"`);
        onTranscriptReadyRef.current(text);
      } else {
        setStatusText(prev => prev === 'Listening...' ? 'Standby' : prev);
      }

      if (recognitionRef.current === rec) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = rec;

    // Start recognition SYNCHRONOUSLY to satisfy browser user-gesture requirements
    try {
      rec.start();
    } catch (e) {
      console.warn("Speech Recognition capture collision, hot resetting:", e);
      try {
        rec.abort();
        // Fallback micro-delay only if initial synchronous start fails
        setTimeout(() => {
          try {
            rec.start();
          } catch (err) {
            console.error("Critical Speech restart failure under fallback:", err);
          }
        }, 80);
      } catch (abortErr) {}
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isVoiceListening = false;
    }

    if (recognitionRef.current) {
      try {
        console.log("Bumblebee: Gentle stop requested. Finalizing spoken buffer capture...");
        recognitionRef.current.stop(); // Stops mic recording instantly, lets the browser compile the final words of transcription, and triggers onresult / onend beautifully
      } catch (e) {
        console.warn("Speech Recognition failed to gently stop, forcing abort instead:", e);
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch (err) {}
        recognitionRef.current = null;
        setStatusText('Standby');
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
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    // Mark system speaking immediately in global core
    if (window.__bumblebeeSpeechCore) {
      window.__bumblebeeSpeechCore.isSpeaking = true;
    }
    setIsSpeaking(true);

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
      setIsSpeaking(true);
    };

    // Keep safe tracking of completion to release global speaking locks
    let hasCompleted = false;
    const handleSpeakComplete = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      activeUtterances.delete(utterance);
      
      if (window.__bumblebeeSpeechCore) {
        window.__bumblebeeSpeechCore.isSpeaking = false;
      }
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    // Save item in our global memory to prevent garbage collection interrupts
    activeUtterances.add(utterance);

    utterance.onend = handleSpeakComplete;
    utterance.onerror = handleSpeakComplete;

    // Safety timeout: in some browsers style speech synthesis complete callbacks get lost
    setTimeout(() => {
      if (!hasCompleted) {
        console.warn("Bumblebee: Speak complete safety callback timeout reached.");
        handleSpeakComplete();
      }
    }, 8000);

    window.speechSynthesis.speak(utterance);
    setStatusText(`Bumblebee: "${text}"`);
  }, [voiceEnabled]);

  return {
    isListening,
    isSpeaking,
    statusText,
    setStatusText,
    startListening,
    stopListening,
    toggleListening,
    speak
  };
}
