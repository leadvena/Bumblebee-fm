# 🐝 BUMBLEBEE RETRO VOICE AI-ASSISTANT PWA MUSIC PLAYER

Welcome to **BUMBLEBEE**, a gorgeous, luxury retro-gaming inspired voice-activated music player. Designed with a warm parchment pixel art aesthetic, BUMBLEBEE integrates hands-free hotword recognition, server-side Gemini AI command parsing, and YouTube audio backing for completely organic, seamless music streaming.

---

## 🚀 GETTING STARTED & SETUP

### 1. Acquiring API Credentials

BUMBLEBEE uses three services to operate hands-free:
1. **Gemini AI API Key** (for retro voice command routing + recommendations)
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click **Get API key** and generate a new secret.
2. **YouTube Data API v3 Key** (for searching video tracks)
   - Visit the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project, enable the **YouTube Data API v3**, and generate an API key from the Credentials tab.
3. **Picovoice Porcupine Access Key** (for background wake word "Bumblebee")
   - Visit [Picovoice Console](https://console.picovoice.ai/).
   - Register for a free Developer account to obtain your Picovoice `Access Key`.

### 2. Configure Environment variables

Create a `.env` file in the root directory (or update via your hosting console) matching this representation:

```env
VITE_YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY"
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
VITE_PORCUPINE_ACCESS_KEY="YOUR_PICOVOICE_ACCESS_KEY"
```

---

## 🛠️ INSTALLATION & RUNNING LOCALLY

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Launch Dev Environment**:
   ```bash
   npm run dev
   ```
   *BUMBLEBEE will start on port `3000` (development mode with hot-reloading express proxies for server security).*

3. **Build & Start Production Node Bundle**:
   ```bash
   npm run build
   ```
   This compiles compiling endpoints to `dist/server.cjs` with single bundle asset resolvers. Use:
   ```bash
   npm run start
   ```

---

## 📱 INSTALLING AS A PROGRESSIVE WEB APP (PWA)

BUMBLEBEE is a fully compliant Progressive Web App. Install it to your system for a standalone, borders-free full-screen music experience!

### On Android (Chrome / Edge):
- Open Chrome and navigate to the deployment URL.
- On first visit, a gold header pill will appear: **"INSTALL APP"**. Tap it!
- Alternatively, tap the Three Dots menu icon in Chrome and click **"Add to Home Screen"**.
- Open the BUMBLEBEE application icon directly from your home screen.

### On iOS (Safari):
- Launch iOS Safari and enter the deployment link.
- Tap the **Share** button (box with an arrow pointing up) at the bottom of the screen.
- Scroll down the dialog and select **"Add to Home Screen"**.
- Confirm, and launch BUMBLEBEE from your iOS Home screen grid to unlock full-screen immersion without browser bars.

---

## 🎤 SPEAKING TO BUMBLEBEE

Once booted, there are two easy actions to talk with BUMBLEBEE:

### 1. Hands-Free Wake-Word (Chrome/Edge on Desktop/Android)
- Confirm the `Wake Word Detector` status shows **READY** on the Configuration tab.
- At any time, clearly say: **"Bumblebee !"**
- BUMBLEBEE's golden wings will flutter, its eyes will expand, and it will speak back: **"Buzzing in. I'm listening."**
- Immediately state your request!

### 2. Tap-To-Talk Mic Console (iOS Safari / Other browsers)
- Safari on Apple devices restricts background service workers from controlling active microphones during music playback.
- **Fallback**: Simply tap the retro **Mic Button** on the Now Playing screen.
- Wait for the golden waveform to bounce, then state your request.

### 🌟 Supported Commands to Try:
- 🎵 *"Play cosmic lofi beats"* / *"Play Daft Punk"* (Automatically populates a similar 10-song queue!)
- ⏭️ *"Skip this song"* / *"Next track"*
- ⏮️ *"Go back"* / *"Previous"*
- 🔊 *"Turn it up"* / *"Volume up"*
- 🔈 *"Turn it down"* / *"Volume down"*
- 📻 *"What's playing?"*
- 🔀 *"Shuffle playlist"*
- ⏸️ *"Pause sound"* / *"Stop wings"*
- 🍃 *"Play something relaxed"* (Triggers Gemini smart mood parsing!)

---

## ⚠️ KNOWN iOS COMPATIBILITY & AUDIO STABILITY WORKAROUNDS

Due to strict Apple Webkit permissions, iOS Safari restricts web workers from streaming hot-words alongside YouTube iframe audio blocks:
1. **The Wake-Word engine is automatically disabled on iOS Safari** to prevent audio crashes. Instead, users are gracefully guided to the tap-to-talk mic button.
2. **Enable Silent Mode**: If you trigger Speech Recognition and don't hear BUMBLEBEE's adorable high-pitched voice synthesizer, confirm your device's physical **Silent / Ring Switch** on the side of your iPhone is switched to "Ring" mode.
3. **First-Interaction Permission**: Speech synthesis will block until the user performs at least one physical click/tap on the screen. Always tap the screen once on load to initiate the audio framework.
