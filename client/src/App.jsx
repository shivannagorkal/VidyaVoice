import { useState, useRef, useEffect } from "react";
import { Show, SignInButton, UserButton, useUser } from "@clerk/react";
import VoiceButton from "./components/VoiceButton";
import Transcript from "./components/Transcript";
import Onboarding from "./components/Onboarding";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Browser TTS fallback ──────────────────────────────────────────────────────
function speakWithBrowser(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = "en-IN";
  utter.rate  = 0.95;
  utter.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang === "en-IN") ||
                      voices.find(v => v.lang.startsWith("en"));
  if (indianVoice) utter.voice = indianVoice;

  utter.onend   = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="app app-wide">
      <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
      <header className="header">
        <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
        <p className="tagline">Your AI tutor — bolo, seekho, samjho</p>
      </header>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "60px",
        gap: "16px",
      }}>
        <p style={{ color: "#ccc", fontSize: "16px" }}>Please sign in to continue</p>
        <SignInButton mode="modal">
          <button style={{
            padding: "12px 32px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6c63ff, #48cae4)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            border: "none",
            cursor: "pointer",
          }}>
            Sign In / Sign Up
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

// ── Main app (only shown when signed in) ─────────────────────────────────────
function MainApp() {
  const { user } = useUser();

  const [session, setSession]       = useState(null);
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus]         = useState("idle");
  const [error, setError]           = useState(null);
  const [textInput, setTextInput]   = useState("");
  const [ttsMode, setTtsMode]       = useState("murf");
  const [backToMode, setBackToMode] = useState(false);

  const recognitionRef   = useRef(null);
  const audioRef         = useRef(new Audio());
  const historyRef       = useRef([]);
  const activeRecRef     = useRef(null);
  const silenceTimerRef  = useRef(null);
  const lastInterimRef   = useRef("");
  const handleMessageRef = useRef(null);

  useEffect(() => { handleMessageRef.current = handleUserMessage; });

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", () =>
      window.speechSynthesis.getVoices()
    );
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    function createRecognition() {
      const rec = new SR();
      rec.continuous     = false;
      rec.interimResults = true;
      rec.lang           = "en-IN";

      rec.onresult = (e) => {
        const interim = Array.from(e.results).map(r => r[0].transcript).join("");
        lastInterimRef.current = interim;

        setTranscript(prev => {
          const updated = [...prev];
          const last = updated.length - 1;
          if (last >= 0 && updated[last].role === "user-interim")
            updated[last] = { role: "user-interim", text: interim };
          else updated.push({ role: "user-interim", text: interim });
          return updated;
        });

        if (e.results[e.results.length - 1].isFinal) {
          clearTimeout(silenceTimerRef.current);
          rec.stop();
          if (interim.trim()) handleMessageRef.current(interim.trim());
          return;
        }

        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const text = lastInterimRef.current.trim();
          rec.stop();
          if (text) handleMessageRef.current(text);
        }, 2000);
      };

      rec.onerror = (e) => {
        clearTimeout(silenceTimerRef.current);
        setListening(false);
        setStatus("idle");
        if (e.error !== "no-speech" && e.error !== "aborted")
          setError("Mic error: " + e.error);
      };

      rec.onend = () => {
        clearTimeout(silenceTimerRef.current);
        setListening(false);
        const text = lastInterimRef.current.trim();
        if (text) {
          lastInterimRef.current = "";
          handleMessageRef.current(text);
        }
      };

      return rec;
    }

    recognitionRef.current = { createRecognition };
  }, []);

  async function speak(text) {
    setSpeaking(true);
    setStatus("speaking");
    const done = () => { setSpeaking(false); setStatus("idle"); };

    if (ttsMode === "browser") {
      speakWithBrowser(text, done);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "english" }),
      });
      const data = await res.json();

      if (data.audioUrl) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        audioRef.current.onended = done;
        audioRef.current.onerror = () => speakWithBrowser(text, done);
      } else {
        setTtsMode("browser");
        speakWithBrowser(text, done);
      }
    } catch (err) {
      console.warn("Murf failed, using browser TTS:", err.message);
      setTtsMode("browser");
      speakWithBrowser(text, done);
    }
  }

  async function handleOnboardingComplete(info) {
    setBackToMode(false);
    setSession(info);
    setTranscript([]);
    historyRef.current = [];

    const modeIntros = {
      explain: `Ready to explain ${info.subject}. What topic shall we start with?`,
      qa:      `Ask me anything about ${info.subject}!`,
      doubt:   `Tell me what's confusing you in ${info.subject}.`,
      quiz:    `Let's quiz you on ${info.subject}! Say start quiz to begin.`,
      notes:   `Which ${info.subject} topic do you need notes on?`,
    };
    const welcomeText = modeIntros[info.mode] || `Ready to help with ${info.subject}!`;
    setTranscript([{ role: "tutor", text: welcomeText }]);
    await speak(welcomeText);
  }

  function toggleListening() {
    if (speaking) return;
    setError(null);

    if (listening) {
      clearTimeout(silenceTimerRef.current);
      activeRecRef.current?.stop();
      setListening(false);
      setStatus("idle");
      return;
    }

    if (!recognitionRef.current) {
      setError("Voice not supported. Use the text box below."); return;
    }

    lastInterimRef.current = "";
    const rec = recognitionRef.current.createRecognition();
    activeRecRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setStatus("listening");
    } catch (err) {
      setError("Could not start mic. Please try again.");
    }
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    const msg = textInput.trim();
    if (!msg || status === "thinking" || status === "speaking") return;
    setTextInput("");
    handleUserMessage(msg);
  }

  async function handleUserMessage(text) {
    if (!text || !session) return;
    lastInterimRef.current = "";
    setListening(false);
    setTranscript(prev => [...prev.filter(m => m.role !== "user-interim"), { role: "user", text }]);
    setStatus("thinking");

    const msgs = historyRef.current.slice(-8).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          subject: session.subject,
          level: session.level,
          levelLabel: session.levelLabel,
          mode: session.mode,
          history: msgs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const tutorMsg = { role: "tutor", text: data.text };
      setTranscript(prev => [...prev, tutorMsg]);
      historyRef.current = [...historyRef.current, { role: "user", text }, tutorMsg];

      await speak(data.text);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  const busy = status === "thinking" || status === "speaking";

  // ── Onboarding ───────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="app app-wide">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <header className="header">
          <div className="header-left">
            <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
            <p className="tagline">Your AI tutor — bolo, seekho, samjho</p>
          </div>
          <UserButton />
        </header>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // ── Back to mode selection ────────────────────────────────────────────────────
  if (backToMode) {
    return (
      <div className="app app-wide">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <header className="header">
          <div className="header-left">
            <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
          </div>
          <UserButton />
        </header>
        <Onboarding
          onComplete={handleOnboardingComplete}
          initialStep={3}
          initialLevel={session.level}
          initialSubject={session.subject}
        />
      </div>
    );
  }

  // ── Main chat view ────────────────────────────────────────────────────────────
  return (
    <div className="app app-wide">
      <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />

      <header className="header header-chat">
        <div className="header-left">
          <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
        </div>
        <div className="session-badge">
          <span className="badge-item">📚 {session.subject}</span>
          <span className="badge-sep">·</span>
          <span className="badge-item">{session.levelLabel}</span>
          <span className="badge-sep">·</span>
          <span className="badge-item badge-mode">
            {{ explain:"📖 Explain", qa:"💬 Q&A", doubt:"🤔 Doubt", quiz:"🧪 Quiz", notes:"📝 Notes" }[session.mode]}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="restart-btn"
            onClick={() => setTtsMode(m => m === "murf" ? "browser" : "murf")}
            title="Switch voice engine"
            style={{ fontSize: "12px" }}
          >
            {ttsMode === "murf" ? "🎙️ Murf" : "🔊 Browser"}
          </button>
          <button
            className="restart-btn"
            onClick={() => { window.speechSynthesis?.cancel(); setBackToMode(true); }}
            title="Change study mode"
          >
            ← Back
          </button>
          <button
            className="restart-btn"
            onClick={() => {
              setSession(null);
              setTranscript([]);
              historyRef.current = [];
              window.speechSynthesis?.cancel();
            }}
            title="Change subject"
          >
            ↩ Change
          </button>
          <UserButton />
        </div>
      </header>

      <main className="main main-chat">
        <Transcript messages={transcript} status={status} />
        {error && <div className="error-pill">{error}</div>}

        <VoiceButton status={status} listening={listening} speaking={speaking} onClick={toggleListening} />
        <p className="hint">
          {status === "idle"      && "Tap the mic or type below!"}
          {status === "listening" && "Listening... 👂"}
          {status === "thinking"  && "Thinking... 🤔"}
          {status === "speaking"  && "Tutor is speaking... 🎙️"}
        </p>

        <form className="text-input-row" onSubmit={handleTextSubmit}>
          <input
            className="text-input"
            type="text"
            placeholder={session.mode === "quiz" ? "Type your answer or ask for next question..." : "Type your question here..."}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            disabled={busy}
          />
          <button
            className={`send-btn ${busy ? "disabled" : ""}`}
            type="submit"
            disabled={busy || !textInput.trim()}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}

// ── Root — shows login or app based on auth state ────────────────────────────
export default function App() {
  return (
    <>
      <Show when="signed-out">
        <LoginScreen />
      </Show>
      <Show when="signed-in">
        <MainApp />
      </Show>
    </>
  );
}