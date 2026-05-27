/**
 * Retro chiptune synthesizer using Web Audio API for immersive mechanical bumblebee BEE-OS sound effects.
 */
export function playBumblebeeSynthSound(type: 'buzz' | 'happy' | 'alarm' | 'melody' | 'chime') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'buzz') {
      // Simulate bee buzzing sound using saw-tooth waves oscillating quickly
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';

      // Quick frequency vibrato around 150Hz
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(185, ctx.currentTime + 0.45);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.7);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } else if (type === 'happy') {
      // Cute happy chiptune arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.1 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.15);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.18);
      });
    } else if (type === 'alarm') {
      // Alarm siren pattern for self-destruct sequence
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        
        const startTime = ctx.currentTime + i * 0.4;
        const endTime = startTime + 0.35;
        
        osc.frequency.setValueAtTime(500, startTime);
        osc.frequency.linearRampToValueAtTime(1100, startTime + 0.18);
        osc.frequency.linearRampToValueAtTime(500, startTime + 0.35);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.04);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.28);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(endTime);
      }
    } else if (type === 'melody') {
      // Cute melody sequence (little bee flying theme)
      const pitches = [440, 493.88, 523.25, 587.33, 659.25, 587.33, 659.25, 783.99]; // A4, B4, C5, D5, E5, D5, E5, G5
      const durations = [0.12, 0.12, 0.12, 0.12, 0.18, 0.12, 0.12, 0.35];
      let runningTime = ctx.currentTime;
      pitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, runningTime);
        
        const d = durations[idx];
        gainNode.gain.setValueAtTime(0, runningTime);
        gainNode.gain.linearRampToValueAtTime(0.12, runningTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.08, runningTime + d - 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, runningTime + d);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(runningTime);
        osc.stop(runningTime + d);
        runningTime += d + 0.02;
      });
    } else if (type === 'chime') {
      // Cybernetic glass chime for system actions or theme changes!
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc2.type = 'triangle';
      
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.25);
      osc2.frequency.setValueAtTime(2000, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn("playBumblebeeSynthSound failed:", err);
  }
}
