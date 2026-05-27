import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Bumblebee: Server-side Gemini API initialized.");
} else {
  console.warn("Bumblebee: Missing VITE_GEMINI_API_KEY. Gemini features will run in demo/fallback mode.");
}

// ─── ENDPOINTS ───────────────────────────────────────────────────────────

/**
 * YouTube API v3 Proxy
 * Keeps Developer credentials safe and secure!
 */
app.get("/api/youtube/search", async (req, res) => {
  const query = req.query.q as string;
  const youtubeKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  if (!youtubeKey) {
    // If no key is configured, return some nice offline retro tracks as a mock safety fallback
    console.warn("Bumblebee: No VITE_YOUTUBE_API_KEY configured. Returning retro chip fallback.");
    return res.json({
      items: getRetroFallbackTracks(query)
    });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("type", "video");
    url.searchParams.append("videoCategoryId", "10"); // Music category
    url.searchParams.append("q", query);
    url.searchParams.append("maxResults", "15");
    url.searchParams.append("key", youtubeKey);

    const apiRes = await fetch(url.toString());
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("YouTube search error:", errText);
      return res.status(apiRes.status).json({ error: "Failed to search music from YouTube", details: errText });
    }

    const data = await apiRes.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Internal server error during search proxy", details: error.message });
  }
});

/**
 * Gemini AI Command Processor
 */
app.post("/api/gemini/command", async (req, res) => {
  const { transcript, currentTrack, isPlaying } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "Transcript is required" });
  }

  if (!ai) {
    // Fallback if no Gemini key present
    const demoResponse = parseCommandDemoFallback(transcript);
    return res.json(demoResponse);
  }

  try {
    const prompt = `The user said: "${transcript}". Parse this voice instruction into a structured music command. Active track currently: ${JSON.stringify(currentTrack || null)}. Player is: ${isPlaying ? "Playing" : "Paused"}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are BUMBLEBEE, a voice-controlled AI music assistant with a retro-luxury 16-bit pixel art aesthetic. 
Your tone is incredibly helpful, retro-game inspired, and you use delightful bee/honey metaphors (buzzing, sweet nectar, honeycombs, wings, hive). Keep your speech short and clean for Text-To-Speech (max 2 short sentences).

Parse the user's voice transcript and extract the appropriate playback action. Always output standard valid JSON adhering strictly to the responseSchema.

Supported Commands:
- 'play' (user wants to search and play a song/artist/genre/mood. Extract search target into 'query')
- 'skip' (next track in queue / skips current)
- 'previous' (previous track)
- 'volume_up' (make the volume louder)
- 'volume_down' (make the volume quieter)
- 'pause' (pause the music)
- 'whats_playing' (user asks what is currently playing)
- 'mood' (user requests sound for a mood - e.g. relaxed, happy, sad, gaming. Extract the music style into 'query' and return command 'play')
- 'add_to_queue' (user wants to queue a song, extract the track in 'query')
- 'shuffle' (toggle shuffling)
- 'unknown' (general chit-chat, greet, or unsupported request)

Example speech outputs:
- "Buzzing in! Playing some sweet lofi tracks for you."
- "Skip set! Let's fly onto the next flower in our queue."
- "Ah, a sweet select! Adding that track to your honey comb queue."`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "One of the supported command values: play, skip, previous, volume_up, volume_down, pause, whats_playing, mood, add_to_queue, shuffle, unknown"
            },
            query: {
              type: Type.STRING,
              description: "Extracted search query string for play/queue commands. Leave empty for control commands."
            },
            speechResponse: {
              type: Type.STRING,
              description: "Witty, cute vocal response in BUMBLEBEE's voice (MAX 180 characters, no strange emojis)"
            }
          },
          required: ["command", "query", "speechResponse"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (error: any) {
    console.error("Gemini command error:", error);
    return res.status(500).json({ error: "Gemini failed to process command", details: error.message });
  }
});

/**
 * Gemini AI Smart Recommendations Processor
 */
app.post("/api/gemini/suggest", async (req, res) => {
  const { history } = req.body; // Array of Track objects

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.json({
      recommendations: [
        { searchTerm: "Chiptune retro 8bit", label: "Golden Retro", reason: "Ready to start buzzing with some sweet 8-Bit chiptune hits!" },
        { searchTerm: "Chill lofi beats gaming", label: "Amber Honey", reason: "A soothing flight through warm lofi rhythms to keep you productive." },
        { searchTerm: "Upbeat arcade music", label: "Hive Dance", reason: "Get those wings flapping with high-energy arcade rhythms!" }
      ],
      speechResponse: "Greetings! I've loaded some fresh honey suggestions for you to start our flight."
    });
  }

  if (!ai) {
    return res.json({
      recommendations: [
        { searchTerm: `${history[0].artist} similar tracks`, label: "Nectar Match", reason: `Based on your love for ${history[0].title}, here's something similar!` },
        { searchTerm: "Jazz cafe lofi piano", label: "Sweet Jazz", reason: "A perfect blend of relaxing jazz sounds for the queen bee." },
        { searchTerm: "Synthwave arcade racing", label: "Neon Flights", reason: "Ignite those retro engines with neon synthwave grooves." }
      ],
      speechResponse: "Buzzing in with recommendations based on your sweet flight history!"
    });
  }

  try {
    const historySample = history.slice(0, 5).map(t => `${t.title} by ${t.artist}`).join(", ");
    const prompt = `Based on this listening history: [${historySample}], recommend 3 cute retro queries and music styles for the user to try next.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are BUMBLEBEE. Create exactly 3 personalized retro recommendations based on history. Your suggestions should feel bespoke and retro gaming/chiptune inspired. Return valid JSON matching the schema. Try to make the visual labels cute and concise (e.g. Hive Synth, Nectar Lounge). Make the reasons very charming.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  searchTerm: { type: Type.STRING, description: "Specific YouTube search search string" },
                  label: { type: Type.STRING, description: "Short retro-themed category name (e.g. Amber Chiptune)" },
                  reason: { type: Type.STRING, description: "Cute explanation from Bumblebee" }
                },
                required: ["searchTerm", "label", "reason"]
              }
            },
            speechResponse: {
              type: Type.STRING,
              description: "Welcome speech summarizing your analysis (max 180 characters)"
            }
          },
          required: ["recommendations", "speechResponse"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (error: any) {
    console.error("Gemini suggestion error:", error);
    return res.status(500).json({ error: "Gemini failed to suggest music", details: error.message });
  }
});


// ─── FRONTEND INTEGRATION & VITE DRIVER ───────────────────────────────

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server middleware so all changes rebuild on saving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Bumblebee: Running in DEVELOPMENT mode with Vite Middleware.");
  } else {
    // Serve production built assets from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Bumblebee: Running in PRODUCTION mode serving static dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bumblebee is running and waiting for commands on port ${PORT}`);
  });
}

start();

// ─── CONTINGENCY IMPLEMENTATIONS ──────────────────────────────────────

/**
 * Clean mock search fallback containing royalty-free and 16-bit arcade content
 */
function getRetroFallbackTracks(query: string) {
  const norm = query.toLowerCase();
  const options = [
    { id: "A7_tXscfU00", title: "Retro Arcade Game Soundtrack", artist: "Chiptune Hero", thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200" },
    { id: "S23126J8r_4", title: "Pixel Art Lo-fi Night Flight", artist: "Nectar Chill", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200" },
    { id: "3jWRrafhO6M", title: "Bumblebee Wingbeat Synth Loops", artist: "Honeystick", thumbnail: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200" },
    { id: "2D8mH-tclj8", title: "Follwing Pollen: 16-bit Symphony", artist: "Golden Grid", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200" }
  ];

  // Randomize order slightly or filter
  return options.map((item, idx) => ({
    id: item.id,
    snippet: {
      title: `${item.title} (${query})`,
      channelTitle: item.artist,
      thumbnails: {
        high: { url: item.thumbnail }
      }
    }
  }));
}

/**
 * Text-processing pattern matching to extract basic intents without Gemini keys
 */
function parseCommandDemoFallback(transcript: string) {
  const text = transcript.toLowerCase();
  let command = "unknown";
  let query = "";
  let speechResponse = "Buzz buzz? I didn't quite catch that. Try saying 'Play lofi' or 'Next'!";

  if (text.includes("play") || text.includes("search")) {
    command = "play";
    query = text.replace("play", "").replace("search", "").trim() || "8bit chiptune";
    speechResponse = `Buzzing in! Searching for ${query} on our retro antenna. Swarm power activated!`;
  } else if (text.includes("skip") || text.includes("next")) {
    command = "skip";
    speechResponse = "Next flower! Skipping onwards to the next jam.";
  } else if (text.includes("back") || text.includes("previous") || text.includes("prev")) {
    command = "previous";
    speechResponse = "Going backward in our flight trail.";
  } else if (text.includes("louder") || text.includes("turn it up") || text.includes("volume up")) {
    command = "volume_up";
    speechResponse = "Buzz buzz! Turning up the honey amplfiers!";
  } else if (text.includes("quieter") || text.includes("turn it down") || text.includes("volume down")) {
    command = "volume_down";
    speechResponse = "Calming down the hive, turning the sound down.";
  } else if (text.includes("pause") || text.includes("stop") || text.includes("hold")) {
    command = "pause";
    speechResponse = "Pausing our wings. Resting on a sweet leaf.";
  } else if (text.includes("what") && text.includes("playing")) {
    command = "whats_playing";
    speechResponse = "Checking our current audio nectar!";
  } else if (text.includes("shuffle")) {
    command = "shuffle";
    speechResponse = "Stirring the honeycomb! Playlist shuffled.";
  } else if (text.includes("hello") || text.includes("hey") || text.includes("bumblebee")) {
    speechResponse = "Hello there! I'm Bumblebee, your pixel music companion. Buzz buzz!";
  }

  return { command, query, speechResponse };
}
