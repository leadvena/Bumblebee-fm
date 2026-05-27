import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { Loader } from 'lucide-react';

interface DynamicTrackThumbnailProps {
  track: Track;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// In-memory caching for faster immediate renders
const coverCache: { [trackId: string]: string } = {};

export default function DynamicTrackThumbnail({
  track,
  className = '',
  size = 'md'
}: DynamicTrackThumbnailProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    // 1. Reset state for current track
    setImgSrc('');
    setIsGenerating(false);

    if (!track) return;

    const originalUrl = track.thumbnail || '';
    
    // Define what constitutes a "low quality" or missing thumbnail.
    // YouTube's 'default.jpg' is 120x90 and blurry, while hqdefault, mqdefault, sddefault, maxresdefault are high quality.
    // Also, if the thumbnail is empty or a default blank placeholder, it's low quality.
    const isLowQuality = 
      !originalUrl || 
      originalUrl.includes('/default.jpg') || 
      originalUrl.trim() === '';

    if (!isLowQuality) {
      // Use original high quality thumbnail directly
      setImgSrc(originalUrl);
      return;
    }

    // 2. Check Cache (In-Memory first, then LocalStorage)
    const cacheKey = `bumble_cover_${track.id}`;
    if (coverCache[track.id]) {
      setImgSrc(coverCache[track.id]);
      return;
    }

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        coverCache[track.id] = cached;
        setImgSrc(cached);
        return;
      }
    } catch (e) {
      console.warn("Storage read failed in DynamicTrackThumbnail", e);
    }

    // 3. Trigger image generation for missing / low-quality thumbnail
    setIsGenerating(true);
    let isMounted = true;

    async function generateCover() {
      try {
        const response = await fetch('/api/cover/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: track.title,
            artist: track.artist || 'Chiptune Synth'
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.url) {
          if (isMounted) {
            setImgSrc(data.url);
            coverCache[track.id] = data.url;
            try {
              localStorage.setItem(cacheKey, data.url);
            } catch (err) {
              // LocalStorage quota might be exceeded if they store too many Base64 images, handle gracefully:
              console.warn("LocalStorage caching disabled (quota full or private mode)");
            }
          }
        }
      } catch (error) {
        console.error("Failed to generate pixel cover:", error);
        // Fallback to high-contrast color avatar placeholder
        if (isMounted) {
          setImgSrc(`https://picsum.photos/seed/${encodeURIComponent(track.id)}/200/200`);
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    }

    generateCover();

    return () => {
      isMounted = false;
    };
  }, [track]);

  // Sizing definitions
  const dimensions = 
    size === 'sm' ? 'w-10 h-10' :
    size === 'md' ? 'w-12 h-12' : 
                    'w-full h-full';

  return (
    <div className={`relative shrink-0 overflow-hidden bg-[#0A0703]/90 border border-[#D4A017]/25 ${dimensions} ${className}`}>
      {isGenerating ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 z-10 p-1 text-center">
          <Loader className="w-4 h-4 animate-spin text-[#D4A017] mb-0.5" />
          <span className="font-press-start text-[5.5px] text-[#A89060] tracking-tight uppercase animate-pulse">
            PIXEL COVR
          </span>
        </div>
      ) : null}

      {imgSrc ? (
        <img
          src={imgSrc}
          alt={track.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-500 ${isGenerating ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[18px]">
          📻
        </div>
      )}
    </div>
  );
}
