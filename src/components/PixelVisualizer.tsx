import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Sliders, Activity, Disc } from 'lucide-react';

interface PixelVisualizerProps {
  isPlaying: boolean;
  isLoading: boolean;
  isListening: boolean;
  volume: number;
  themeStyle: any;
  currentTrackId?: string | null;
  vizMode?: 'bars' | 'wave' | 'radial';
  onVizModeChange?: (mode: 'bars' | 'wave' | 'radial') => void;
}

export default function PixelVisualizer({
  isPlaying,
  isLoading,
  isListening,
  volume,
  themeStyle,
  currentTrackId,
  vizMode: propVizMode,
  onVizModeChange
}: PixelVisualizerProps) {
  const [localVizMode, setLocalVizMode] = useState<'bars' | 'wave' | 'radial'>('bars');
  
  const vizMode = propVizMode !== undefined ? propVizMode : localVizMode;
  const setVizMode = (mode: 'bars' | 'wave' | 'radial') => {
    if (onVizModeChange) {
      onVizModeChange(mode);
    } else {
      setLocalVizMode(mode);
    }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Web Audio state references for microphone inputs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Peak hold array for the retro bars viz
  const peakHolds = useRef<number[]>(new Array(16).fill(0));
  const peakDecayCount = useRef<number[]>(new Array(16).fill(0));

  // 1. Manage microphone analyser lifecycle
  useEffect(() => {
    let active = true;

    async function setupMicrophone() {
      if (!isListening) {
        cleanupMic();
        return;
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("Bumblebee: MediaDevices API not supported.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // Small fftSize to make chunky retro items
        
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        console.log("Bumblebee: Microphone Analyser connected successfully.");
      } catch (err) {
        console.warn("Bumblebee Audio Visualizer mic stream failed: ", err);
      }
    }

    setupMicrophone();

    return () => {
      active = false;
      cleanupMic();
    };
  }, [isListening]);

  function cleanupMic() {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  }

  // 2. Continuous procedural or microphone canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrameTime = 0;
    
    // Setup crisp, non-blurry retro layout coordinates (downscaled grid)
    const dWidth = 160;
    const dHeight = 96;
    canvas.width = dWidth;
    canvas.height = dHeight;

    function render() {
      if (!ctx || !canvas) return;
      localFrameTime++;

      // Background clear with pixel grids spacing
      ctx.fillStyle = '#110D05';
      ctx.fillRect(0, 0, dWidth, dHeight);

      // Draw faint background pixel dotted CRT grid
      ctx.fillStyle = 'rgba(212, 160, 23, 0.03)';
      for (let x = 0; x < dWidth; x += 4) {
        for (let y = 0; y < dHeight; y += 4) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Read audio data inputs
      let frequencies: number[] = [];
      const barCount = 16;

      if (isListening && analyserRef.current && dataArrayRef.current) {
        // Mode A: True Microphone inputs
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const micData = dataArrayRef.current;
        const sliceLength = Math.floor(micData.length / barCount);
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          const start = i * sliceLength;
          for (let k = 0; k < sliceLength; k++) {
            sum += micData[start + k] || 0;
          }
          frequencies.push(sum / sliceLength);
        }
      } else if (isPlaying) {
        // Mode B: High quality synchronized procedural audio synthesis
        // Generates natural waveforms and pulses simulating beats & melodies
        const time = performance.now();
        const bpm = 110; // Chiptune heartbeat baseline
        const beatDuration = 60000 / bpm;
        const beatProgress = (time % beatDuration) / beatDuration;
        
        // Simulating rhythmic kick/bass spike
        const bassKick = Math.exp(-beatProgress * 4.5) * 1.5; 
        const melodyVibe = 0.5 + 0.3 * Math.sin(time * 0.003) + 0.1 * Math.cos(time * 0.007);
        const subBass = Math.max(0, Math.sin(time * 0.0005)) * 0.5;

        for (let i = 0; i < barCount; i++) {
          let amplitude = 0;
          
          if (i < 4) {
            // Bass frequencies reacted to kick beat pulses
            amplitude = (bassKick * 1.2 + subBass + Math.random() * 0.1) * 220;
          } else if (i >= 4 && i < 11) {
            // Midrange reacting to melody and overall vibe
            const midWave = Math.sin(time * 0.0012 + i * 0.4) * Math.cos(time * 0.0008 - i * 0.2);
            amplitude = (melodyVibe * 0.8 + Math.abs(midWave) * 0.7 + Math.random() * 0.1) * 160;
          } else {
            // High frequencies triggered by snare timing oscillations and noise
            const hiWave = Math.sin(time * 0.004 + i) * Math.sin(time * 0.007);
            const highVibe = (time % (beatDuration / 2)) < 80 ? 0.9 : 0.2;
            amplitude = (highVibe * 0.5 + Math.abs(hiWave) * 0.6 + Math.random() * 0.15) * 110;
          }

          // Apply master volume bounds scaling
          amplitude = amplitude * (volume / 100);
          frequencies.push(Math.min(255, Math.max(10, amplitude)));
        }
      } else if (isLoading) {
        // Mode C: Pulsating Loading scanner pattern
        for (let i = 0; i < barCount; i++) {
          const distanceOffset = Math.abs(i - (localFrameTime % 16));
          const wave = Math.max(0, 1 - distanceOffset * 0.3) * 180;
          frequencies.push(wave);
        }
      } else {
        // Mode D: Cozy Idle floating spectrum waves
        const idleTime = performance.now() * 0.001;
        for (let i = 0; i < barCount; i++) {
          const wave = (Math.sin(idleTime * 1.5 + i * 0.5) * 0.5 + 0.5) * 30;
          frequencies.push(wave);
        }
      }

      // Convert brand color settings to actual hex representation
      const accentColor = themeStyle.accentColor || '#D4A017';
      const glowColor = themeStyle.glow || '#FFD166';

      // 3. Render and draw modes
      if (vizMode === 'bars') {
        const gap = 3;
        const totalGapWidth = gap * (barCount - 1);
        const barWidth = Math.floor((dWidth - totalGapWidth) / barCount);
        const paddingOffset = (dWidth - (barWidth * barCount + totalGapWidth)) / 2;

        for (let i = 0; i < barCount; i++) {
          // Normalize frequency amplitude to pixels height
          const rawHeight = (frequencies[i] / 255) * (dHeight - 12);
          const barHeight = Math.max(2, Math.floor(rawHeight / 4) * 4); // Pixel lock heights in multipliers of 4
          const x = paddingOffset + i * (barWidth + gap);
          const y = dHeight - 4 - barHeight;

          // Compute custom pixel gradient bar column
          ctx.fillStyle = accentColor;
          
          // Draw segmented pixel-art column blocks
          for (let bp = 0; bp < barHeight; bp += 4) {
            const blockY = dHeight - 4 - bp;
            // Create nice retro amber/cyan color stacks based on volume height
            if (bp > 48) {
              ctx.fillStyle = '#EF4444'; // Red alarm peak
            } else if (bp > 30) {
              ctx.fillStyle = glowColor; // Vibrant yellow peak
            } else {
              ctx.fillStyle = accentColor; // Cool theme accent base
            }
            ctx.fillRect(Math.floor(x), Math.floor(blockY - 3), Math.floor(barWidth), 3);
          }

          // Peak fall-down indicator
          let peak = peakHolds.current[i];
          if (barHeight > peak) {
            peakHolds.current[i] = barHeight;
            peakDecayCount.current[i] = 15; // Hold peak for 15 frames
          } else {
            if (peakDecayCount.current[i] > 0) {
              peakDecayCount.current[i]--;
            } else {
              peakHolds.current[i] = Math.max(0, peak - 2);
            }
          }

          const peakY = dHeight - 5 - peakHolds.current[i];
          ctx.fillStyle = '#FFF8E7';
          ctx.fillRect(Math.floor(x), Math.floor(peakY), Math.floor(barWidth), 1);
        }

        // Draw pixel baseline floor
        ctx.fillStyle = '#2D200E';
        ctx.fillRect(0, dHeight - 2, dWidth, 2);

      } else if (vizMode === 'wave') {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const segmentWidth = dWidth / barCount;
        ctx.moveTo(0, dHeight / 2);

        for (let i = 0; i < barCount; i++) {
          const val = (frequencies[i] - 128) * 0.3;
          const x = i * segmentWidth + segmentWidth / 2;
          const y = (dHeight / 2) + val;
          ctx.lineTo(x, y);

          // Draw pixel nodes along the waveform
          ctx.fillStyle = glowColor;
          ctx.fillRect(Math.floor(x - 2), Math.floor(y - 2), 4, 4);
        }
        ctx.lineTo(dWidth, dHeight / 2);
        ctx.stroke();

        // Draw retro scanning waveform background overlay
        ctx.fillStyle = 'rgba(212, 160, 23, 0.06)';
        ctx.fillRect(0, Math.floor(dHeight / 2 - 12), dWidth, 24);

      } else if (vizMode === 'radial') {
        // Draw gorgeous circular radial visualizer emanating from the screen coordinates center
        const cx = dWidth / 2;
        const cy = dHeight / 2;
        
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;

        // Draw radar rings
        ctx.strokeStyle = 'rgba(212, 160, 23, 0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.stroke();

        const numParticles = 24;
        for (let i = 0; i < numParticles; i++) {
          const angle = (i / numParticles) * Math.PI * 2;
          const freqIndex = Math.floor((i % (barCount / 2)) * 2);
          const intensity = frequencies[freqIndex] || 0;
          
          const baseRadius = 18;
          const targetRadius = baseRadius + (intensity / 255) * 22;

          const startX = cx + Math.cos(angle) * baseRadius;
          const startY = cy + Math.sin(angle) * baseRadius;
          const endX = cx + Math.cos(angle) * targetRadius;
          const endY = cy + Math.sin(angle) * targetRadius;

          // Radial laser rays
          ctx.strokeStyle = i % 2 === 0 ? accentColor : glowColor;
          ctx.beginPath();
          ctx.moveTo(Math.floor(startX), Math.floor(startY));
          ctx.lineTo(Math.floor(endX), Math.floor(endY));
          ctx.stroke();

          // Particle nodes on peaks
          if (intensity > 40) {
            ctx.fillStyle = '#FFF8E7';
            ctx.fillRect(Math.floor(endX - 1.5), Math.floor(endY - 1.5), 3, 3);
          }
        }
      }

      // Draw active mode tags inside visualizer card
      ctx.fillStyle = 'rgba(15, 10, 0, 0.75)';
      ctx.fillRect(4, 4, 42, 11);
      ctx.fillStyle = isListening ? '#E23E57' : isPlaying ? glowColor : '#A89060';
      ctx.font = '6px "Courier New", monospace, sans-serif';
      ctx.fontWeight = 'bold';
      ctx.fillText(
        isListening ? '■ RECORDING' : isPlaying ? '▲ ONLINE' : '● SLEEP', 
        8, 
        12
      );

      requestRef.current = requestAnimationFrame(render);
    }

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, isLoading, isListening, volume, vizMode, themeStyle]);

  return (
    <div className="w-full relative select-none">
      {/* Visualizer Shell Container Frame */}
      <div 
        className="w-full bg-[#110D05] border-2 border-[#D4A017]/80 rounded-none relative overflow-hidden flex flex-col"
        style={{ imageRendering: 'pixelated' }}
        id="pixel-visualizer-card"
      >
        {/* Interactive Mode Toggler Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-dashed border-[#A89060]/45 bg-[#0F0A00]/80">
          <div className="flex items-center gap-1.5 font-press-start text-[7px] text-[#A89060]">
            <Activity className="w-3.5 h-3.5 text-[#D4A017] animate-pulse" />
            SPECTRUM ANALYZER
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setVizMode('bars')}
              className={`px-1.5 py-0.5 font-press-start text-[6px] tracking-tight uppercase cursor-pointer border ${
                vizMode === 'bars' 
                  ? 'bg-[#C87941] text-[#FFF8E7] border-[#D4A017]' 
                  : 'bg-transparent text-[#A89060] border-transparent hover:border-[#A89060]/30'
              }`}
              title="Matrix Equalizer"
              id="btn-viz-mode-bars"
            >
              BARS
            </button>
            <button
              onClick={() => setVizMode('wave')}
              className={`px-1.5 py-0.5 font-press-start text-[6px] tracking-tight uppercase cursor-pointer border ${
                vizMode === 'wave' 
                  ? 'bg-[#C87941] text-[#FFF8E7] border-[#D4A017]' 
                  : 'bg-transparent text-[#A89060] border-transparent hover:border-[#A89060]/30'
              }`}
              title="Oscilloscope"
              id="btn-viz-mode-wave"
            >
              WAVE
            </button>
            <button
              onClick={() => setVizMode('radial')}
              className={`px-1.5 py-0.5 font-press-start text-[6px] tracking-tight uppercase cursor-pointer border ${
                vizMode === 'radial' 
                  ? 'bg-[#C87941] text-[#FFF8E7] border-[#D4A017]' 
                  : 'bg-transparent text-[#A89060] border-transparent hover:border-[#A89060]/30'
              }`}
              title="Radial Solar Pulse"
              id="btn-viz-mode-radial"
            >
              FLOW
            </button>
          </div>
        </div>

        {/* Dynamic Draw Canvas Element */}
        <div className="w-full relative flex justify-center items-center bg-[#110D05] py-2">
          <canvas 
            ref={canvasRef} 
            className="w-full h-[120px] max-w-[420px] aspect-[160/96] block"
          />
        </div>

        {/* Small debug telemetry monitor baseline lines */}
        <div className="px-3 py-1 bg-[#0F0A00] border-t border-[#A89060]/20 flex justify-between items-center text-[7.5px] font-mono text-[#A89060]">
          <span className="flex items-center gap-1">
            <Sliders className="w-2.5 h-2.5" /> 
            CH-A DB LEVEL: {Math.max(0, Math.floor(volume * 1.2))} dB
          </span>
          <span className="uppercase tracking-widest animate-pulse font-bold text-[#D4A017]">
            {isListening ? 'VOICE COMM INCOMING' : isPlaying ? 'BZZNG HIGHS & LOWS' : 'HIVE SLEEP'}
          </span>
        </div>
      </div>
    </div>
  );
}
