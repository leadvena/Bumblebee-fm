import express from "express";
import path from "path";
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
- 'change_theme' (switch visual color palette. Find theme in: 'gold' (wood/honey 70s), 'midnight' (cosmic vinyl), 'forest' (avocado velvet), 'rose' (terracotta sunset). Store exact theme key name in 'query')
- 'set_visualizer_mode' (choose visualizer pattern. Find mode in: 'bars', 'wave', 'radial'. Store exact mode key in 'query')
- 'set_equalizer' (adjust preset filters. Find one of: 'bass', 'lofi', 'flat', 'treble'. Store exact preset key in 'query')
- 'buzz_mode' (perform bee sounds/noises, buzz or tell a bee joke)
- 'self_destruct' (engage playfully scary countdown sequence or overload alarm)
- 'status_report' (give computer systems status or honey flight measurements)
- 'unknown' (general chit-chat, greet, or unsupported request)

Example speech outputs:
- "Buzzing in! Playing some sweet lofi tracks for you."
- "Skip set! Let's fly onto the next flower in our queue."
- "Ah, shifting the hive visualizer! Radial Solar Flow online."
- "Tuning the honeycomb equalizer nodes! Bass boost activated!"
- "Danger! Overloading honeycomb power reactors... Just kidding, my wings are completely steady!"`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "One of: play, skip, previous, volume_up, volume_down, pause, whats_playing, mood, add_to_queue, shuffle, change_theme, set_visualizer_mode, set_equalizer, buzz_mode, self_destruct, status_report, unknown"
            },
            query: {
              type: Type.STRING,
              description: "Extracted search query string, or specific key for settings commands (e.g. theme names 'gold'|'midnight'|'forest'|'rose', visualizer modes 'bars'|'wave'|'radial', equalizer presets 'bass'|'lofi'|'flat'|'treble')"
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

/**
 * Dynamic Pixel Art Cover Generator using Google GenAI SDK and Imagen 3
 */
app.post("/api/cover/generate", async (req, res) => {
  const { title, artist } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  // Fallback to beautiful retro geometric SVG generator if Gemini is missing or fails
  if (!ai) {
    const fallbackSvg = generateRetroSvgPlaceholder(title, artist || "Bumblebee Studio");
    return res.json({ url: fallbackSvg });
  }

  try {
    const cleanTitle = title.replace(/\[Offline.*\]/gi, "").trim();
    const cleanArtist = (artist || "Bumblebee Retro").trim();
    const prompt = `Retro 16-bit pixel art square game cover album design for a track called "${cleanTitle}" by "${cleanArtist}". Nostalgic pixelated details, chiptune console vibe, cute bee or amber honey elements, vibrant pixel palette, centered crop, elegant composition.`;
    
    console.log(`Bumblebee Server: Generating Cover for "${cleanTitle}" via Imagen...`);
    const imgRes = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1",
      },
    });

    if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
      const base64 = imgRes.generatedImages[0].image.imageBytes;
      return res.json({ url: `data:image/jpeg;base64,${base64}` });
    }

    throw new Error("No image data returned from Google GenAI model");
  } catch (error: any) {
    console.warn("Cover image generation fallback triggered:", error.message || error);
    const fallbackSvg = generateRetroSvgPlaceholder(title, artist || "Bumblebee Studio");
    return res.json({ url: fallbackSvg });
  }
});

function generateRetroSvgPlaceholder(title: string, artist: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash + 140) % 360);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 15%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2}, 80%, 8%);stop-opacity:1" />
        </linearGradient>
        <pattern id="pixelGrid-${hash}" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#grad-${hash})" />
      <rect width="400" height="400" fill="url(#pixelGrid-${hash})" />
      
      <!-- Honeycomb design -->
      <g transform="translate(140, 120)">
        <polygon points="60,10 110,40 110,100 60,130 10,100 10,40" fill="none" stroke="#D4A017" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
        <polygon points="60,20 100,45 100,95 60,120 20,95 20,45" fill="rgba(212, 160, 23, 0.15)" />
        <circle cx="60" cy="70" r="14" fill="#D4A017" />
        
        <!-- wing pixels -->
        <rect x="34" y="52" width="10" height="10" fill="#E0F7FA" opacity="0.6"/>
        <rect x="76" y="52" width="10" height="10" fill="#E0F7FA" opacity="0.6"/>
      </g>
      
      <rect x="25" y="25" width="350" height="350" fill="none" stroke="#D4A017" stroke-width="2" opacity="0.25" />
      
      <!-- Retro labels -->
      <rect x="40" y="275" width="320" height="80" fill="rgba(10,8,5,0.85)" rx="4" stroke="#D4A017" stroke-width="1.5" opacity="0.9"/>
      <text x="55" y="305" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#FFF8E7" letter-spacing="1">
        ${title.substring(0, 22).replace(/\[Offline.*\]/gi, "").toUpperCase()}
      </text>
      <text x="55" y="325" font-family="'Courier New', monospace" font-size="10" fill="#D4A017" opacity="0.8">
        BY ${artist.substring(0, 30).toUpperCase()}
      </text>
      <text x="55" y="343" font-family="'Courier New', monospace" font-size="8.5" fill="#E0F7FA" opacity="0.5" letter-spacing="1">
        BEE-OS PIXEL SYNTH SYSTEM
      </text>
    </svg>
  `;
  
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}


// ─── FRONTEND INTEGRATION & VITE DRIVER ───────────────────────────────

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server middleware so all changes rebuild on saving
    const { createServer: createViteServer } = await import("vite");
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

  // Only listen on port if not running inside a Vercel Serverless Function
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Bumblebee is running and waiting for commands on port ${PORT}`);
    });
  }
}

start();

export default app; // Export app for Vercel Serverless Function support

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
  } else if (text.includes("theme") || text.includes("palette") || text.includes("color") || text.includes("display")) {
    command = "change_theme";
    if (text.includes("midnight") || text.includes("cosmic") || text.includes("indigo") || text.includes("purple")) {
      query = "midnight";
      speechResponse = "Shifting into Midnight mode! Cosmic vinyl grooves spinning.";
    } else if (text.includes("forest") || text.includes("avocado") || text.includes("green") || text.includes("olive")) {
      query = "forest";
      speechResponse = "Buzzing into Forest mode! Feel the fresh avocado velvet ambience.";
    } else if (text.includes("rose") || text.includes("sunset") || text.includes("terracotta") || text.includes("orange") || text.includes("red")) {
      query = "rose";
      speechResponse = "Sunset vibe activated! Shifting to Rose terracotta warmth.";
    } else {
      query = "gold";
      speechResponse = "Reverting to classic Gold! Wood, honey, and high-fidelity active.";
    }
  } else if (text.includes("visualizer") || text.includes("oscilloscope") || text.includes("wave") || text.includes("bars") || text.includes("radial") || text.includes("flow")) {
    command = "set_visualizer_mode";
    if (text.includes("wave") || text.includes("oscilloscope") || text.includes("line")) {
      query = "wave";
      speechResponse = "Tuning scope to Wave mode! Dynamic line oscillations active.";
    } else if (text.includes("radial") || text.includes("flow") || text.includes("circle")) {
      query = "radial";
      speechResponse = "Spinning Solar Flow visualizer! Radial particle pulses online.";
    } else {
      query = "bars";
      speechResponse = "Switching to classic Spectrum Bars grid!";
    }
  } else if (text.includes("equalizer") || text.includes("bass") || text.includes("lofi") || text.includes("filter") || text.includes("sound")) {
    command = "set_equalizer";
    if (text.includes("bass") || text.includes("booster") || text.includes("punchy")) {
      query = "bass";
      speechResponse = "Equalizer set: Bass! Honey subwoofer nodes boosted.";
    } else if (text.includes("lofi") || text.includes("slow") || text.includes("chill")) {
      query = "lofi";
      speechResponse = "Equalizer set: Lofi! Warm, retro analogue tape filters active.";
    } else if (text.includes("treble") || text.includes("high") || text.includes("crisp")) {
      query = "treble";
      speechResponse = "Equalizer set: Treble! Clear high frequencies enabled.";
    } else {
      query = "flat";
      speechResponse = "Equalizer set: Flat! Pure monitor sound waves output.";
    }
  } else if (text.includes("buzz") || text.includes("joke") || text.includes("sound") || text.includes("melody") || text.includes("hum")) {
    command = "buzz_mode";
    speechResponse = "Buzz buzz, click-clack! Let me hum you a little chiptune sequence.";
  } else if (text.includes("destruct") || text.includes("critical") || text.includes("explode") || text.includes("blow up")) {
    command = "self_destruct";
    speechResponse = "EMERGENCY! Self-destruct sequence engaged. Radioactive honeycomb melting down!";
  } else if (text.includes("status") || text.includes("system") || text.includes("cpu") || text.includes("feeling") || text.includes("diagnose")) {
    command = "status_report";
    speechResponse = "Accessing Bee-OS kernel telemetry! Core temperature: nominal. Honeycomb reserves: 98%. Wings lubrication: perfect.";
  } else if (text.includes("hello") || text.includes("hey") || text.includes("bumblebee")) {
    speechResponse = "Hello there! I'm Bumblebee, your pixel music companion. Buzz buzz!";
  }

  return { command, query, speechResponse };
}
