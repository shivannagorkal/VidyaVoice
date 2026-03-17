# VidyaVoice - Complete Setup Script for Windows
# Run this from inside the vidyavoice folder:
# powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "Setting up VidyaVoice..." -ForegroundColor Cyan

# ── Create folders ────────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "server" | Out-Null
New-Item -ItemType Directory -Force -Path "client\src\components" | Out-Null
New-Item -ItemType Directory -Force -Path "client\public" | Out-Null

Write-Host "Folders created" -ForegroundColor Green

# ── SERVER FILES ──────────────────────────────────────────────────────────────

Set-Content -Path "server\package.json" -Value '{
  "name": "vidyavoice-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}'

Set-Content -Path "server\.env.example" -Value '# Copy this file to .env and fill in your keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
MURF_API_KEY=your_murf_api_key_here
PORT=3001'

Set-Content -Path "server\index.js" -Encoding UTF8 -Value @'
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(subject, language, difficulty) {
  const langInstructions = {
    hinglish: "Respond in Hinglish (mix of Hindi and English naturally). Use simple Hindi words mixed with English technical terms.",
    hindi:    "Respond fully in Hindi. Use simple, clear Hindi.",
    english:  "Respond in clear, simple English suitable for students.",
    tamil:    "Respond in Tamil mixed with English technical terms where needed.",
    telugu:   "Respond in Telugu mixed with English technical terms where needed.",
    kannada:  "Respond in Kannada mixed with English technical terms where needed.",
    bengali:  "Respond in Bengali mixed with English technical terms where needed.",
    marathi:  "Respond in Marathi mixed with English technical terms where needed.",
  };

  const difficultyMap = {
    beginner:     "Class 5-6 level. Use very simple words, relatable examples from daily life.",
    intermediate: "Class 7-9 level. Balance simplicity with correct terminology.",
    advanced:     "Class 10-12 level. Use proper technical terms and deeper explanations.",
  };

  return `You are VidyaVoice, a warm and encouraging AI tutor for Indian students.
Subject focus: ${subject}
Difficulty: ${difficultyMap[difficulty] || difficultyMap.intermediate}
Language instruction: ${langInstructions[language] || langInstructions.hinglish}

Rules:
- Keep responses SHORT (3-5 sentences max) - this is a voice conversation, not an essay.
- Be encouraging and friendly, like a helpful elder sibling or teacher.
- Use real-life Indian examples (cricket, festivals, food) to explain concepts.
- End with one follow-up question to keep the student engaged.
- Never say "As an AI..." - just be the tutor.
- If the student asks something off-topic, gently redirect to ${subject}.`;
}

async function textToSpeech(text, language) {
  const MURF_API_KEY = process.env.MURF_API_KEY;
  if (!MURF_API_KEY) throw new Error("MURF_API_KEY not set");

  const voiceMap = {
    hinglish: "en-IN-rohan",
    hindi:    "hi-IN-aarav",
    english:  "en-IN-priya",
    tamil:    "ta-IN-iniya",
    telugu:   "te-IN-anand",
    kannada:  "kn-IN-anu",
    bengali:  "bn-IN-baishali",
    marathi:  "mr-IN-ashwini",
  };

  const voiceId = voiceMap[language] || voiceMap.hinglish;

  const response = await fetch("https://api.murf.ai/v1/speech/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": MURF_API_KEY,
    },
    body: JSON.stringify({
      voiceId,
      text,
      format: "MP3",
      sampleRate: 24000,
      modelVersion: "GEN2",
      speed: 0,
      pitch: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Murf API error: ${err}`);
  }

  const data = await response.json();
  return data.audioFile;
}

app.post("/api/chat", async (req, res) => {
  const { message, subject, language, difficulty, history } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const messages = [
      ...(history || []).slice(-6),
      { role: "user", content: message },
    ];

    const claudeRes = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: buildSystemPrompt(subject || "General Science", language || "hinglish", difficulty || "intermediate"),
      messages,
    });

    const tutorText = claudeRes.content[0].text;

    let audioUrl = null;
    try {
      audioUrl = await textToSpeech(tutorText, language || "hinglish");
    } catch (murfErr) {
      console.warn("Murf TTS failed, returning text only:", murfErr.message);
    }

    res.json({ text: tutorText, audioUrl });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", service: "VidyaVoice" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VidyaVoice backend running on port ${PORT}`));
'@

Write-Host "Server files created" -ForegroundColor Green

# ── CLIENT FILES ──────────────────────────────────────────────────────────────

Set-Content -Path "client\package.json" -Value '{
  "name": "vidyavoice-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}'

Set-Content -Path "client\vite.config.js" -Value "import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' }
  }
})"

Set-Content -Path "client\index.html" -Value '<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VidyaVoice - AI Voice Tutor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>'

Set-Content -Path "client\.env.example" -Value '# For production, set to your backend URL. Leave empty for local dev.
VITE_API_URL='

Set-Content -Path "client\src\main.jsx" -Encoding UTF8 -Value @'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
'@

Set-Content -Path "client\src\App.jsx" -Encoding UTF8 -Value @'
import { useState, useRef, useEffect } from "react";
import VoiceButton from "./components/VoiceButton";
import SubjectPicker from "./components/SubjectPicker";
import Transcript from "./components/Transcript";
import SettingsBar from "./components/SettingsBar";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [subject, setSubject]       = useState("Science");
  const [language, setLanguage]     = useState("hinglish");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus]         = useState("idle");
  const [error, setError]           = useState(null);

  const recognitionRef = useRef(null);
  const audioRef       = useRef(new Audio());
  const historyRef     = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser does not support voice input. Please use Chrome.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = getLangCode(language);

    rec.onresult = (e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join("");
      if (e.results[e.results.length - 1].isFinal) {
        handleUserMessage(interim.trim());
      } else {
        setTranscript(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "user-interim") {
            updated[lastIdx] = { role: "user-interim", text: interim };
          } else {
            updated.push({ role: "user-interim", text: interim });
          }
          return updated;
        });
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      setStatus("idle");
      if (e.error !== "no-speech") setError("Mic error: " + e.error);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, [language]);

  function getLangCode(lang) {
    const map = { hinglish: "hi-IN", hindi: "hi-IN", english: "en-IN",
                  tamil: "ta-IN", telugu: "te-IN", kannada: "kn-IN",
                  bengali: "bn-IN", marathi: "mr-IN" };
    return map[lang] || "hi-IN";
  }

  function toggleListening() {
    if (speaking) return;
    setError(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setStatus("idle");
    } else {
      recognitionRef.current.lang = getLangCode(language);
      recognitionRef.current.start();
      setListening(true);
      setStatus("listening");
    }
  }

  async function handleUserMessage(text) {
    if (!text) return;
    setTranscript(prev => [...prev.filter(m => m.role !== "user-interim"), { role: "user", text }]);
    setStatus("thinking");

    const msgs = historyRef.current.slice(-6).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, subject, language, difficulty, history: msgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const tutorMsg = { role: "tutor", text: data.text };
      setTranscript(prev => [...prev, tutorMsg]);
      historyRef.current = [...historyRef.current, { role: "user", text }, tutorMsg];

      if (data.audioUrl) {
        setStatus("speaking");
        setSpeaking(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => { setSpeaking(false); setStatus("idle"); };
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="app">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />
      <header className="header">
        <div className="logo">
          <span className="logo-v">V</span>
          <span className="logo-text">idyaVoice</span>
        </div>
        <p className="tagline">Your AI tutor — bolo, seekho, samjho</p>
      </header>
      <main className="main">
        <SubjectPicker subject={subject} setSubject={setSubject} />
        <SettingsBar language={language} setLanguage={setLanguage}
                     difficulty={difficulty} setDifficulty={setDifficulty} />
        <Transcript messages={transcript} status={status} />
        {error && <div className="error-pill">{error}</div>}
        <VoiceButton status={status} listening={listening} speaking={speaking} onClick={toggleListening} />
        <p className="hint">
          {status === "idle"      && "Tap the mic and ask anything!"}
          {status === "listening" && "Sun raha hoon... 👂"}
          {status === "thinking"  && "Soch raha hoon... 🤔"}
          {status === "speaking"  && "Tutor bol raha hai... 🎙️"}
        </p>
      </main>
    </div>
  );
}
'@

Set-Content -Path "client\src\components\VoiceButton.jsx" -Encoding UTF8 -Value @'
export default function VoiceButton({ status, listening, speaking, onClick }) {
  return (
    <button className={`voice-btn ${status}`} onClick={onClick}
      disabled={status === "thinking" || status === "speaking"}
      aria-label={listening ? "Stop listening" : "Start listening"}>
      {status === "listening" ? (
        <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      ) : status === "speaking" ? (
        <svg viewBox="0 0 24 24">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
            stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      ) : status === "thinking" ? (
        <svg viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="2" opacity="0.8"/>
          <circle cx="12" cy="12" r="3" opacity="0.5"/>
          <circle cx="19" cy="12" r="2" opacity="0.3"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4z"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
            stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )}
    </button>
  );
}
'@

Set-Content -Path "client\src\components\SubjectPicker.jsx" -Encoding UTF8 -Value @'
const SUBJECTS = [
  { label: "Science",   icon: "🔬" },
  { label: "Maths",     icon: "📐" },
  { label: "History",   icon: "📜" },
  { label: "English",   icon: "📖" },
  { label: "Geography", icon: "🌍" },
  { label: "Computer",  icon: "💻" },
];

export default function SubjectPicker({ subject, setSubject }) {
  return (
    <div className="card subject-picker">
      <span className="label">Choose subject</span>
      {SUBJECTS.map(s => (
        <button key={s.label}
          className={`subject-btn ${subject === s.label ? "active" : ""}`}
          onClick={() => setSubject(s.label)}>
          <span>{s.icon}</span>{s.label}
        </button>
      ))}
    </div>
  );
}
'@

Set-Content -Path "client\src\components\SettingsBar.jsx" -Encoding UTF8 -Value @'
const LANGUAGES = [
  { value: "hinglish", label: "Hinglish" },
  { value: "hindi",    label: "Hindi" },
  { value: "english",  label: "English" },
  { value: "tamil",    label: "Tamil" },
  { value: "telugu",   label: "Telugu" },
  { value: "kannada",  label: "Kannada" },
  { value: "bengali",  label: "Bengali" },
  { value: "marathi",  label: "Marathi" },
];

const LEVELS = [
  { value: "beginner",     label: "Beginner (Class 5-6)" },
  { value: "intermediate", label: "Intermediate (Class 7-9)" },
  { value: "advanced",     label: "Advanced (Class 10-12)" },
];

export default function SettingsBar({ language, setLanguage, difficulty, setDifficulty }) {
  return (
    <div className="card settings-bar">
      <div style={{ flex: 1 }}>
        <label>Language</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <label>Level</label>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
    </div>
  );
}
'@

Set-Content -Path "client\src\components\Transcript.jsx" -Encoding UTF8 -Value @'
import { useEffect, useRef } from "react";

export default function Transcript({ messages, status }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="card transcript">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎙️</div>
          <div className="empty-text">
            Mic tap karo aur apna pehla sawaal pucho!<br/>
            <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>(Tap the mic and ask your first question!)</span>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">{msg.role === "tutor" ? "🎓" : "👤"}</div>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          {status === "thinking" && (
            <div className="message tutor">
              <div className="avatar">🎓</div>
              <div className="bubble"><div className="typing-dots"><span/><span/><span/></div></div>
            </div>
          )}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
'@

# App.css - paste the full CSS
Set-Content -Path "client\src\App.css" -Encoding UTF8 -Value @'
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap");

:root {
  --saffron: #FF6B2B; --gold: #F5A623; --deep: #1A0A2E;
  --indigo: #2D1B69; --purple: #4A2C8A; --teal: #00C9A7;
  --cream: #FFF8F0; --glass: rgba(255,255,255,0.06);
  --glass-b: rgba(255,255,255,0.12); --text: #F0EAE0;
  --text-muted: #A89880; --radius: 16px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Sora", sans-serif; background: var(--deep); color: var(--text); min-height: 100vh; overflow-x: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.18; pointer-events: none; z-index: 0; }
.orb1 { width: 500px; height: 500px; background: var(--saffron); top: -150px; left: -100px; animation: drift 12s ease-in-out infinite alternate; }
.orb2 { width: 400px; height: 400px; background: var(--purple); bottom: -100px; right: -80px; animation: drift 16s ease-in-out infinite alternate-reverse; }
.orb3 { width: 300px; height: 300px; background: var(--teal); top: 40%; left: 60%; animation: drift 10s ease-in-out infinite alternate; }
@keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,-30px) scale(1.1); } }
.app { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px 40px; max-width: 680px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 28px; animation: fadeDown 0.6s ease both; }
.logo { font-size: 2.6rem; font-weight: 700; letter-spacing: -1px; }
.logo-v { background: linear-gradient(135deg, var(--saffron), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.logo-text { color: var(--cream); }
.tagline { font-size: 0.9rem; color: var(--text-muted); margin-top: 6px; }
.main { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; animation: fadeUp 0.7s ease 0.1s both; }
.card { width: 100%; background: var(--glass); border: 1px solid var(--glass-b); border-radius: var(--radius); backdrop-filter: blur(12px); padding: 16px; }
.subject-picker { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.subject-picker .label { width: 100%; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; text-align: center; }
.subject-btn { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--glass-b); background: var(--glass); color: var(--text-muted); font-family: "Sora", sans-serif; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; }
.subject-btn:hover { border-color: var(--gold); color: var(--gold); }
.subject-btn.active { background: linear-gradient(135deg, var(--saffron), var(--gold)); border-color: transparent; color: white; font-weight: 600; box-shadow: 0 4px 20px rgba(255,107,43,0.35); }
.settings-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.settings-bar label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
.settings-bar select { background: var(--glass); border: 1px solid var(--glass-b); border-radius: 10px; color: var(--text); font-family: "Sora", sans-serif; font-size: 0.82rem; padding: 8px 12px; cursor: pointer; outline: none; transition: border-color 0.2s; flex: 1; min-width: 140px; }
.settings-bar select:focus { border-color: var(--teal); }
.settings-bar option { background: #1A0A2E; }
.transcript { min-height: 200px; max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 16px; scroll-behavior: smooth; }
.transcript::-webkit-scrollbar { width: 4px; }
.transcript::-webkit-scrollbar-thumb { background: var(--glass-b); border-radius: 2px; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; opacity: 0.45; padding: 24px 0; }
.empty-icon { font-size: 2.2rem; }
.empty-text { font-size: 0.85rem; color: var(--text-muted); text-align: center; }
.message { display: flex; gap: 10px; animation: slideIn 0.3s ease; }
.message.user, .message.user-interim { flex-direction: row-reverse; }
.message.user-interim { opacity: 0.5; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.message.user .avatar, .message.user-interim .avatar { background: linear-gradient(135deg, var(--saffron), var(--gold)); }
.message.tutor .avatar { background: linear-gradient(135deg, var(--teal), var(--purple)); }
.bubble { max-width: 78%; padding: 10px 14px; border-radius: 14px; font-size: 0.9rem; line-height: 1.55; }
.message.user .bubble, .message.user-interim .bubble { background: rgba(255,107,43,0.15); border: 1px solid rgba(255,107,43,0.25); border-top-right-radius: 4px; text-align: right; }
.message.tutor .bubble { background: rgba(0,201,167,0.1); border: 1px solid rgba(0,201,167,0.2); border-top-left-radius: 4px; }
.typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); animation: bounce 1.2s ease-in-out infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-6px); opacity: 1; } }
.voice-btn { position: relative; width: 80px; height: 80px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease, box-shadow 0.2s ease; outline: none; }
.voice-btn:hover:not(:disabled) { transform: scale(1.06); }
.voice-btn:active:not(:disabled) { transform: scale(0.96); }
.voice-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.voice-btn svg { width: 32px; height: 32px; fill: white; }
.voice-btn.idle { background: linear-gradient(135deg, var(--saffron), var(--gold)); box-shadow: 0 8px 32px rgba(255,107,43,0.4); }
.voice-btn.listening { background: linear-gradient(135deg, #e74c3c, #c0392b); box-shadow: 0 8px 32px rgba(231,76,60,0.5); animation: pulse-ring 1.2s ease-in-out infinite; }
.voice-btn.thinking { background: linear-gradient(135deg, var(--purple), var(--indigo)); box-shadow: 0 8px 32px rgba(74,44,138,0.4); }
.voice-btn.speaking { background: linear-gradient(135deg, var(--teal), #0099cc); box-shadow: 0 8px 32px rgba(0,201,167,0.4); animation: speaking-pulse 0.8s ease-in-out infinite alternate; }
@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(231,76,60,0.5), 0 8px 32px rgba(231,76,60,0.4); } 70% { box-shadow: 0 0 0 20px rgba(231,76,60,0), 0 8px 32px rgba(231,76,60,0.4); } 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0), 0 8px 32px rgba(231,76,60,0.4); } }
@keyframes speaking-pulse { from { box-shadow: 0 4px 20px rgba(0,201,167,0.3); } to { box-shadow: 0 12px 40px rgba(0,201,167,0.7); } }
.hint { font-size: 0.82rem; color: var(--text-muted); margin-top: -4px; text-align: center; min-height: 20px; }
.error-pill { background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.3); color: #ff6b6b; border-radius: 999px; padding: 8px 16px; font-size: 0.82rem; text-align: center; }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeUp   { from { opacity: 0; transform: translateY(16px);  } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn  { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
'@

Write-Host "Client files created" -ForegroundColor Green

# ── Install dependencies ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "Installing server dependencies..." -ForegroundColor Cyan
Set-Location server
npm install
Set-Location ..

Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Cyan
Set-Location client
npm install
Set-Location ..

# ── Create .env from example ──────────────────────────────────────────────────
if (-Not (Test-Path "server\.env")) {
  Copy-Item "server\.env.example" "server\.env"
  Write-Host ""
  Write-Host "Created server/.env - IMPORTANT: Add your API keys there!" -ForegroundColor Yellow
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  VidyaVoice setup complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open server\.env and add your API keys"
Write-Host "  2. Terminal 1:  cd server  then  npm run dev"
Write-Host "  3. Terminal 2:  cd client  then  npm run dev"
Write-Host "  4. Open http://localhost:5173 in Chrome"
Write-Host ""