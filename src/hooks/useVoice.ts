import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface for Web Speech SDK fallback
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface UseVoiceOptions {
  onTranscriptReady: (transcript: string) => void;
  voiceEnabled: boolean; // Settings control
}

export default function useVoice({ onTranscriptReady, voiceEnabled }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Standby');
  const recognitionRef = useRef<any>(null);

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
      } else {
        setStatusText(`Error: ${event.error}`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (event: any) => {
      const results = event.results;
      if (results && results.length > 0) {
        const transcript = results[0][0].transcript;
        console.log("Bumblebee: Registered transcript:", transcript);
        setStatusText(`"${transcript}"`);
        onTranscriptReady(transcript);
      }
    };

    recognitionRef.current = rec;
  }, [onTranscriptReady]);

  // Command to trigger recording
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setStatusText('Speech Recognition unavailable.');
      return;
    }
    // Cancel the synth if speaking, then start recording
    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech Recognition re-entry block", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
