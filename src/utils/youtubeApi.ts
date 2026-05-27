import { Track } from "../types";

export async function searchYouTube(query: string): Promise<Track[]> {
  try {
    // 1. Try our server-side secure proxy first
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Proxy search failed with status ${res.status}`);
    }
    const data = await res.json();
    
    // Check if it's the raw items list from official API or fallback items direct list
    const itemsList = data.items || [];
    if (itemsList && Array.isArray(itemsList)) {
      return itemsList
        .filter((item: any) => item.id && (item.id.videoId || typeof item.id === 'string'))
        .map((item: any) => {
          // Normalise videoId position
          const videoId = typeof item.id === 'string' ? item.id : item.id.videoId;
          return {
            id: videoId,
            title: cleanHtmlEntities(item.snippet.title),
            artist: cleanHtmlEntities(item.snippet.channelTitle),
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || ""
          };
        });
    }
    return [];
  } catch (err) {
    console.warn("YouTube API Proxy failed, trying direct fallback if VITE_YOUTUBE_API_KEY is defined:", err);
    
    // 2. Direct fallback (if client has the key)
    const directKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
    if (!directKey) {
      console.warn("No VITE_YOUTUBE_API_KEY found on client. Serving elegant retro fallback loops.");
      return getMockFallbackTracks(query);
    }
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&key=${directKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        return data.items
          .filter((item: any) => item.id && item.id.videoId)
          .map((item: any) => ({
            id: item.id.videoId,
            title: cleanHtmlEntities(item.snippet.title),
            artist: cleanHtmlEntities(item.snippet.channelTitle),
            thumbnail: item.snippet.thumbnails?.high?.url || ""
          }));
      }
    } catch (directErr) {
      console.error("Direct YouTube search failed too:", directErr);
    }
    return getMockFallbackTracks(query);
  }
}

/**
 * Remove standard HTML entities that YouTube API frequently returns in song titles
 */
function cleanHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u2014]/g, '-') // em dash to hyphen
    .replace(/[\u2013]/g, '-'); // en dash to hyphen
}

function getMockFallbackTracks(query: string): Track[] {
  // Let's search inside our local database of mock tracks for relevant tags
  const norm = query.toLowerCase();
  
  const library = [
    { id: "A7_tXscfU00", title: "Retro Arcade Game Soundtrack (8-bit)", artist: "Chiptune Hero", thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200" },
    { id: "S23126J8r_4", title: "Pixel Art Lo-fi Night Flight", artist: "Nectar Chill", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200" },
    { id: "3jWRrafhO6M", title: "Bumblebee Wingbeat Synth Loops", artist: "Honeystick", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200" },
    { id: "2D8mH-tclj8", title: "Following Pollen: 16-bit Symphony", artist: "Golden Grid", thumbnail: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200" }
  ];

  return library.map(item => ({
    ...item,
    title: `${item.title} [Offline '${query}']`
  }));
}
