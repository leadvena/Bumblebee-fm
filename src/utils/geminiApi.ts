import { Track } from "../types";

export interface CommandParsedResult {
  command: 'play' | 'skip' | 'previous' | 'volume_up' | 'volume_down' | 'pause' | 'whats_playing' | 'mood' | 'add_to_queue' | 'shuffle' | 'unknown';
  query: string;
  speechResponse: string;
}

export interface RecommendationItem {
  searchTerm: string;
  label: string;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  speechResponse: string;
}

/**
 * Sends the user voice transcript (or custom typed command) to the Express server for parsing with Gemini models
 */
export async function parseVoiceCommand(
  transcript: string, 
  currentTrack: Track | null, 
  isPlaying: boolean
): Promise<CommandParsedResult> {
  try {
    const res = await fetch("/api/gemini/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transcript,
        currentTrack,
        isPlaying
      })
    });

    if (!res.ok) {
      throw new Error(`Server command API returned status ${res.status}`);
    }

    const data = await res.json();
    return data as CommandParsedResult;
  } catch (error) {
    console.warn("Client parseVoiceCommand failed. Falling back to local pattern parser:", error);
    return getLocalCommandFallback(transcript);
  }
}

/**
 * Gets personalized listening recommendations from Gemini based on history
 */
export async function getRecommendations(history: Track[]): Promise<RecommendationResponse> {
  try {
    const res = await fetch("/api/gemini/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ history })
    });

    if (!res.ok) {
      throw new Error(`Server suggest API returned status ${res.status}`);
    }

    const data = await res.json();
    return data as RecommendationResponse;
  } catch (error) {
    console.warn("Client getRecommendations failed. Returning static recommendation list:", error);
    return {
      recommendations: [
        { searchTerm: "Chiptune arcade classic soundtracks", label: "Gold Retro", reason: "Ready to start buzzing with some sweet 8-Bit chiptune hits!" },
        { searchTerm: "Chill lofi beats coffee shop", label: "Amber Honey", reason: "A soothing flight through warm lofi rhythms to keep you productive." },
        { searchTerm: "Synthwave grid music", label: "Hive Dance", reason: "Get those wings flapping with high-energy arcade rhythms!" }
      ],
      speechResponse: "Buzzing in with suggestions to make your gaming flight sweet as honey!"
    };
  }
}

/**
 * Pure client-side pattern matching command processor as a robust backup
 */
function getLocalCommandFallback(transcript: string): CommandParsedResult {
  const text = transcript.toLowerCase();
  
  if (text.includes("play") || text.includes("search")) {
    const q = text.replace("play", "").replace("search", "").trim() || "lofi chiptune";
    return {
      command: 'play',
      query: q,
      speechResponse: `Buzzing in! Searching online for ${q} on our radio antennas.`
    };
  }
  
  if (text.includes("skip") || text.includes("next")) {
    return {
      command: 'skip',
      query: '',
      speechResponse: "Next flower! Flight skipped forward!"
    };
  }
  
  if (text.includes("back") || text.includes("prev") || text.includes("previous")) {
    return {
      command: 'previous',
      query: '',
      speechResponse: "Retracing our flight pattern back by one trail."
    };
  }
  
  if (text.includes("louder") || text.includes("volume up") || text.includes("turn it up")) {
    return {
      command: 'volume_up',
      query: '',
      speechResponse: "Turning up the honey sound nodes!"
    };
  }
  
  if (text.includes("quieter") || text.includes("volume down") || text.includes("turn it down")) {
    return {
      command: 'volume_down',
      query: '',
      speechResponse: "Turning the speaker nodes down."
    };
  }
  
  if (text.includes("pause") || text.includes("stop") || text.includes("halt")) {
    return {
      command: 'pause',
      query: '',
      speechResponse: "Pausing wings and audio waves."
    };
  }
  
  if (text.includes("whats playing") || text.includes("song playing")) {
    return {
      command: 'whats_playing',
      query: '',
      speechResponse: "Checking the honeycomb's music data!"
    };
  }

  if (text.includes("shuffle")) {
    return {
      command: 'shuffle',
      query: '',
      speechResponse: "Re-sorting the honeycomb cells. Shuffle enabled!"
    };
  }

  return {
    command: 'unknown',
    query: '',
    speechResponse: "My antennae buzzed but didn't quite get that. Tap and try again!"
  };
}
