import { useState, useRef, useEffect } from "react";
import { Show, SignInButton, UserButton, useUser, useClerk } from "@clerk/react";
import VoiceButton from "./components/VoiceButton";
import Transcript from "./components/Transcript";
import Onboarding from "./components/Onboarding";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Browser TTS ───────────────────────────────────────────────────────────────
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
    <div className="app app-wide auth-page">
      <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
      <div className="auth-box">
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div className="logo" style={{ fontSize: "2.8rem", marginBottom: "8px" }}>
            <span className="logo-v">V</span><span className="logo-text">idyaVoice</span>
          </div>
          <p className="tagline">I'm Your AI tutor. Ask a question, explore the facts, and master the world around you.</p>
        </div>
        <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "28px" }} />
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--cream)", marginBottom: "8px" }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Sign in to start learning with your personal AI tutor
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="google-login-btn" style={{ marginBottom: "16px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </SignInButton>
        <SignInButton mode="modal">
          <button className="google-login-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Continue with Email
          </button>
        </SignInButton>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "24px", textAlign: "center", lineHeight: 1.6 }}>
          By signing in, you agree to our Terms of Service.<br />
          Your learning data is private and secure.
        </p>
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "28px" }}>
        {["📖 Explain Concepts", "💬 Ask Questions", "🧪 Take Quizzes", "📝 Quick Notes"].map(f => (
          <span key={f} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "999px", padding: "6px 14px", fontSize: "0.78rem", color: "var(--text-muted)",
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
}

// ── User avatar + dropdown ────────────────────────────────────────────────────
function UserAvatar() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="user-avatar-wrap" onClick={() => setIsOpen(!isOpen)}>
      {user?.imageUrl
        ? <img className="user-avatar-img" src={user.imageUrl} alt="avatar" />
        : <div className="user-avatar-fallback">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
          </div>
      }
      { isOpen && <div className="user-dropdown">
        <div className="user-name">{user?.fullName || user?.firstName || "Student"}</div>
        <div className="user-email">{user?.emailAddresses?.[0]?.emailAddress}</div>
        <button className="signout-btn" onClick={() => signOut()}>Sign Out</button>
      </div>}
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
function MainApp() {
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

  // Preload browser voices
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
      rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
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
        setListening(false); setStatus("idle");
        if (e.error !== "no-speech" && e.error !== "aborted")
          setError("Mic error: " + e.error);
      };
      rec.onend = () => {
        clearTimeout(silenceTimerRef.current);
        setListening(false);
        const text = lastInterimRef.current.trim();
        if (text) { lastInterimRef.current = ""; handleMessageRef.current(text); }
      };
      return rec;
    }
    recognitionRef.current = { createRecognition };
  }, []);

  // ── Speak: browser TTS for welcome, Murf for everything else ───────────────
  async function speak(text, { forceArowser = false } = {}) {
    setSpeaking(true); setStatus("speaking");
    const done = () => { setSpeaking(false); setStatus("idle"); };

    // Always use browser TTS for welcome message (instant, no cold start wait)
    if (forceArowser || ttsMode === "browser") {
      speakWithBrowser(text, done);
      return;
    }

    try {
      const res  = await fetch(`${API_BASE}/api/speak`, {
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
    setBackToMode(false); setSession(info);
    setTranscript([]); historyRef.current = [];
    const modeIntros = {
      explain: `Ready to explain ${info.subject}. What topic shall we start with?`,
      qa:      `Ask me anything about ${info.subject}!`,
      doubt:   `Tell me what's confusing you in ${info.subject}.`,
      quiz:    `Let's quiz you on ${info.subject}! Say start quiz to begin.`,
      notes:   `Which ${info.subject} topic do you need notes on?`,
    };
    const welcomeText = modeIntros[info.mode] || `Ready to help with ${info.subject}!`;
    setTranscript([{ role: "tutor", text: welcomeText }]);
    // Use browser TTS for welcome — instant, no Murf cold-start delay
    await speak(welcomeText, { forceArowser: true });
  }

  function toggleListening() {
    if (speaking) return;
    setError(null);
    if (listening) {
      clearTimeout(silenceTimerRef.current);
      activeRecRef.current?.stop();
      setListening(false); setStatus("idle"); return;
    }
    if (!recognitionRef.current) { setError("Voice not supported. Use the text box below."); return; }
    lastInterimRef.current = "";
    const rec = recognitionRef.current.createRecognition();
    activeRecRef.current = rec;
    try { rec.start(); setListening(true); setStatus("listening"); }
    catch (err) { setError("Could not start mic. Please try again."); }
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    const msg = textInput.trim();
    if (!msg || status === "thinking" || status === "speaking") return;
    setTextInput(""); handleUserMessage(msg);
  }

  async function handleUserMessage(text) {
    if (!text || !session) return;
    lastInterimRef.current = ""; setListening(false);
    setTranscript(prev => [...prev.filter(m => m.role !== "user-interim"), { role: "user", text }]);
    setStatus("thinking");
    const msgs = historyRef.current.slice(-8).map(m => ({
      role: m.role === "user" ? "user" : "assistant", content: m.text,
    }));
    try {
      const res  = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, subject: session.subject,
          level: session.level, levelLabel: session.levelLabel,
          mode: session.mode, history: msgs,
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

  if (!session) {
    return (
      <div className="app app-wide">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <header className="header header-chat" style={{ marginBottom: "20px" }}>
          <div className="header-left">
            <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
            <p className="tagline">I'm Your AI tutor. Ask a question, explore the facts, and master the world around you.</p>
          </div>
          <UserAvatar />
        </header>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (backToMode) {
    return (
      <div className="app app-wide">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <header className="header header-chat">
          <div className="header-left">
            <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
          </div>
          <UserAvatar />
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
            title="Switch voice engine" style={{ fontSize: "12px" }}
          >
            {ttsMode === "murf" ? "🎙️ Murf" : "🔊 Browser"}
          </button>
          <button className="restart-btn"
            onClick={() => { window.speechSynthesis?.cancel(); setBackToMode(true); }}
            title="Change study mode">← Back
          </button>
          <button className="restart-btn"
            onClick={() => { setSession(null); setTranscript([]); historyRef.current = []; window.speechSynthesis?.cancel(); }}
            title="Change subject">↩ Change
          </button>
          <UserAvatar />
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
          <input className="text-input" type="text"
            placeholder={session.mode === "quiz" ? "Type your answer or ask for next question..." : "Type your question here..."}
            value={textInput} onChange={e => setTextInput(e.target.value)} disabled={busy}
          />
          <button className={`send-btn ${busy ? "disabled" : ""}`} type="submit"
            disabled={busy || !textInput.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Show when="signed-out"><LoginScreen /></Show>
      <Show when="signed-in"><MainApp /></Show>
    </>
  );
}