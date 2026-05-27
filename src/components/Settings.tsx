import React from 'react';
import { ToggleLeft, ToggleRight, Check, Sparkles, Volume2, ShieldAlert } from 'lucide-react';

interface SettingsProps {
  theme: 'gold' | 'midnight' | 'forest' | 'rose';
  onThemeChange: (theme: 'gold' | 'midnight' | 'forest' | 'rose') => void;
  equalizer: 'bass' | 'flat' | 'treble' | 'lofi';
  onEqualizerChange: (eq: 'bass' | 'flat' | 'treble' | 'lofi') => void;
  wakeWordEnabled: boolean;
  onWakeWordToggle: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  wakeWordStatus: string;
  themeStyle: any;
}

export default function Settings({
  theme,
  onThemeChange,
  equalizer,
  onEqualizerChange,
  wakeWordEnabled,
  onWakeWordToggle,
  voiceEnabled,
  onVoiceToggle,
  wakeWordStatus,
  themeStyle
}: SettingsProps) {
  const themesList: { id: 'gold' | 'midnight' | 'forest' | 'rose'; name: string; color: string }[] = [
    { id: 'gold', name: 'Golden Parchment', color: 'bg-[#D4A017]' },
    { id: 'midnight', name: 'Midnight Neon', color: 'bg-[#3B82F6]' },
    { id: 'forest', name: 'Emerald Forest', color: 'bg-[#22C55E]' },
    { id: 'rose', name: 'Cherry Blossom', color: 'bg-[#EC4899]' }
  ];

  const eqPresets: { id: 'bass' | 'flat' | 'treble' | 'lofi'; name: string; desc: string }[] = [
    { id: 'bass', name: 'BASS BOOST', desc: 'Deep buzzing hive vibrations' },
    { id: 'flat', name: 'FLAT SIGNAL', desc: 'Standard vintage studio output' },
    { id: 'treble', name: 'TREBLE FOCUS', desc: 'Crisp wingbeat high frequencies' },
    { id: 'lofi', name: 'LO-FI CRACKLE', desc: 'Cosy retro warmth with fuzzy textures' }
  ];

  const surfaceColor = themeStyle.surfaceColor || '#120B05';
  const bgColor = themeStyle.bgColor || '#060401';
  const accentColor = themeStyle.accentColor || '#D4A017';
  const textColor = themeStyle.textColor || '#F5E6C8';

  return (
    <div className="w-full max-w-[480px] mx-auto p-2 select-none">
      <div 
        className={`w-full border-4 p-4`}
        style={{ 
          backgroundColor: surfaceColor,
          borderColor: accentColor,
          boxShadow: `4px 4px 0px ${bgColor}` 
        }}
      >
        {/* Header Grid */}
        <h2 
          className="font-press-start text-[12px] border-b-2 border-dashed pb-2 mb-4 uppercase tracking-wider"
          style={{ color: '#FAFAFA', borderColor: `${accentColor}80` }}
        >
          ★ BEE-OS CONTROLS / CONFIG
        </h2>

        {/* 1. CHARACTER INTERACTIONS CONFIG */}
        <div className="mb-6">
          <span 
            className="font-press-start text-[7px] block tracking-wide uppercase mb-3"
            style={{ color: textColor }}
          >
            ■ BEE SPEECH INTENNA
          </span>
          <div className="flex flex-col gap-3">
            {/* Talk toggle */}
            <div 
              className="flex items-center justify-between p-2 border-2"
              style={{ backgroundColor: bgColor, borderColor: `${accentColor}30` }}
            >
              <div>
                <h4 
                  className="font-press-start text-[8px] uppercase flex items-center gap-1"
                  style={{ color: '#FAFAFA' }}
                >
                  <Volume2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  BUMBLEBEE RESPONSE VOICE
                </h4>
                <p 
                  className="text-[11px] font-sans mt-0.5"
                  style={{ color: textColor }}
                >
                  Allows BUMBLEBEE to speak back using Text-to-Speech lines.
                </p>
              </div>
              <button 
                onClick={onVoiceToggle}
                className="hover:brightness-125 cursor-pointer"
                id="toggle-settings-voice"
              >
                {voiceEnabled ? (
                  <ToggleRight className="w-10 h-10 fill-current" style={{ color: accentColor }} />
                ) : (
                  <ToggleLeft className="w-10 h-10" style={{ color: textColor, opacity: 0.5 }} />
                )}
              </button>
            </div>

            {/* Wake word toggle */}
            <div 
              className="flex flex-col gap-2 p-2 border-2"
              style={{ backgroundColor: bgColor, borderColor: `${accentColor}30` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 
                    className="font-press-start text-[8px] uppercase"
                    style={{ color: '#FAFAFA' }}
                  >
                    WAKE WORK DETECTOR
                  </h4>
                  <p 
                    className="text-[11px] font-sans mt-0.5"
                    style={{ color: textColor }}
                  >
                    Say "Bumblebee" to activate hands-free microphone listening.
                  </p>
                </div>
                <button 
                  onClick={onWakeWordToggle}
                  className="hover:brightness-125 cursor-pointer"
                  id="toggle-settings-wakeword"
                >
                  {wakeWordEnabled ? (
                    <ToggleRight className="w-10 h-10 fill-current" style={{ color: accentColor }} />
                  ) : (
                    <ToggleLeft className="w-10 h-10" style={{ color: textColor, opacity: 0.5 }} />
                  )}
                </button>
              </div>
              {/* Status display */}
              <div 
                className="text-[10px] font-mono p-1 border border-dashed mt-1 flex items-center justify-between"
                style={{ borderColor: `${accentColor}30` }}
              >
                <span style={{ color: textColor }}>ENGINE STATUS:</span>
                <span className={`uppercase font-bold ${
                  wakeWordStatus.includes('ready') ? 'text-green-500' : 
                  wakeWordStatus.includes('initializing') ? 'animate-pulse' : ''
                }`}
                style={{ color: wakeWordStatus.includes('initializing') ? accentColor : undefined }}
                >
                  {wakeWordStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. COLOR PALETTE PRESETS (THEMES) */}
        <div className="mb-6">
          <span 
            className="font-press-start text-[7px] block tracking-wide uppercase mb-3"
            style={{ color: textColor }}
          >
            ■ COLOURED HIVE COATING
          </span>
          <div className="grid grid-cols-2 gap-2">
            {themesList.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`flex items-center gap-2 p-2 border-2 text-[11px] font-sans rounded-none transition-all cursor-pointer`}
                  style={{
                    backgroundColor: active ? surfaceColor : `${bgColor}80`,
                    borderColor: active ? accentColor : `${accentColor}40`,
                    color: active ? '#FAFAFA' : textColor,
                    boxShadow: active ? `2px 2px 0px ${bgColor}` : 'none'
                  }}
                  id={`btn-settings-theme-${t.id}`}
                >
                  <div className={`w-3.5 h-3.5 ${t.color} border border-[#0F0A00] shrink-0`} />
                  <span className="truncate">{t.name}</span>
                  {active && <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: accentColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. EQUALIZER PRESETS */}
        <div>
          <span 
            className="font-press-start text-[7px] block tracking-wide uppercase mb-3"
            style={{ color: textColor }}
          >
            ■ BEE AUDIO CO-PROCESSOR EQ
          </span>
          <div className="flex flex-col gap-2">
            {eqPresets.map((preset) => {
              const active = equalizer === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onEqualizerChange(preset.id)}
                  className={`p-2 border-2 cursor-pointer transition-all flex items-center gap-3`}
                  style={{
                    backgroundColor: active ? surfaceColor : `${bgColor}80`,
                    borderColor: active ? accentColor : `${accentColor}40`
                  }}
                  id={`settings-eq-block-${preset.id}`}
                >
                  {/* Select Bullet */}
                  <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0`}
                    style={{ 
                      borderColor: active ? accentColor : `${accentColor}80`,
                      backgroundColor: active ? accentColor : 'transparent' 
                    }}
                  >
                    {active && <div className="w-1.5 h-1.5" style={{ backgroundColor: bgColor }} />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h5 
                      className="font-press-start text-[7px] uppercase"
                      style={{ color: '#FAFAFA' }}
                    >
                      {preset.name}
                    </h5>
                    <p 
                      className="text-[11px] font-sans mt-0.5 truncate"
                      style={{ color: textColor }}
                    >
                      {preset.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
