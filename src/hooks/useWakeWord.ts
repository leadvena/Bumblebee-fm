import { useState, useEffect, useRef } from 'react';

interface UseWakeWordOptions {
  onWakeWordDetected: () => void;
  wakeWordEnabled: boolean;
  voiceActive: boolean;
}

export default function useWakeWord({
  onWakeWordDetected,
  wakeWordEnabled,
  voiceActive
}: UseWakeWordOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error' | 'unsupported' | 'disabled'>('initializing');
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef<any>(null);

  // Check simple iOS detection to set support flags or tooltips
  const isIOS = typeof window !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  useEffect(() => {
    // Unsupported environments: iOS Safari restricts background mic in PWAs/iframes
    if (isIOS) {
      setIsSupported(false);
      setStatus('unsupported');
      setErrorMessage('iOS Safari restricts continuous mic access. Tap buttom to command BUMBLEBEE.');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setStatus('unsupported');
      setErrorMessage('Speech Recognition is not supported in this browser.');
      return;
    }

    if (!wakeWordEnabled) {
      setStatus('disabled');
      setIsReady(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      return;
    }

    if (voiceActive) {
      setStatus('disabled'); // Suspended while BUMBLEBEE is actively talking or recording command
      setIsReady(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      return;
    }

    let active = true;
    let rec: any = null;

    function initContinuousRecognition() {
      if (!active) return;
      try {
        setStatus('initializing');
        console.log("Bumblebee: Initializing continuous wake-word detector via Web Speech API...");

        rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          if (!active) return;
          setIsReady(true);
          setStatus('ready');
          console.log("Bumblebee: Always-listening scanning is ACTIVE. Say 'Bumblebee' !");
        };

        rec.onresult = (event: any) => {
          if (!active) return;
          const results = event.results;
          for (let i = event.resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript.toLowerCase();
            console.log("Bumblebee scanning transcript snippet -> ", transcript);
            
            if (transcript.includes('bumblebee')) {
              console.log("Bumblebee: Wake word matched! Halting continuous scan immediately.");
              
              // Stop continuous scanning immediately to clear the microphone line
              active = false;
              try {
                if (rec) rec.abort();
              } catch (e) {}
              
              setIsReady(false);
              onWakeWordDetected();
              break;
            }
          }
        };

        rec.onerror = (event: any) => {
          if (!active) return;
          console.warn("Bumblebee continuous scanning issue of code:", event.error);
          
          if (event.error === 'not-allowed') {
            setStatus('error');
            setErrorMessage('Microphone access denied. Enable mic to scan always.');
            active = false;
          } else if (event.error === 'aborted') {
            // Safe manual stop/aborted trigger
          } else {
            // Auto restart on minor network/silent errors to maintain active scanning loop
            restartRec();
          }
        };

        rec.onend = () => {
          if (active && wakeWordEnabled && !voiceActive) {
            console.log("Bumblebee continuous scan ended. Restarting scanning...");
            restartRec();
          } else {
            setIsReady(false);
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err: any) {
        console.error("Bumblebee continuous initiation fail:", err);
        if (active) {
          setStatus('error');
          setErrorMessage(err?.message || 'Failed to initialize continuous scan.');
        }
      }
    }

    function restartRec() {
      if (!active) return;
      try {
        if (rec) {
          rec.abort();
        }
      } catch (e) {}
      
      setTimeout(() => {
        if (active && wakeWordEnabled && !voiceActive) {
          initContinuousRecognition();
        }
      }, 400);
    }

    initContinuousRecognition();

    return () => {
      active = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
        console.log("Bumblebee: Stopped continuous wake-word session.");
      }
    };
  }, [onWakeWordDetected, wakeWordEnabled, voiceActive, isIOS]);

  return {
    isReady,
    isSupported,
    status,
    errorMessage,
    isIOS
  };
}
