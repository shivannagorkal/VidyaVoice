import { useEffect, useRef, useState } from "react";
import { API_CONFIG_ERROR, buildApiUrl } from "../config";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("• "))) {
        items.push(lines[i].trim().replace(/^[-•]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="md-list">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineParse(item) }} />
          ))}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: inlineParse(line.trim()) }} />
    );
    i++;
  }

  return elements;
}

function inlineParse(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function SpeakButton({ text }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  async function handleSpeak() {
    if (playing) {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      if (API_CONFIG_ERROR) {
        throw new Error(API_CONFIG_ERROR);
      }

      const res = await fetch(buildApiUrl("/api/speak"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "english" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      setPlaying(true);
      audio.play();
      audio.onended = () => setPlaying(false);
    } catch (err) {
      console.error("Speak error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`speak-btn ${playing ? "playing" : ""} ${loading ? "loading" : ""}`}
      onClick={handleSpeak}
      title={playing ? "Stop" : "Read aloud"}
      aria-label={playing ? "Stop audio" : "Read aloud"}
    >
      {loading ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.9"/>
        </svg>
      ) : playing ? (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1"/>
          <rect x="14" y="5" width="4" height="14" rx="1"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      )}
    </button>
  );
}

export default function Transcript({ messages, status }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="card transcript">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎙️</div>
          <div className="empty-text">
            Tap the mic or type to ask your first question!<br/>
            <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>
              You can ask in English, Hindi, Kannada, Tamil & more
            </span>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">
                {msg.role === "tutor" ? "🎓" : "👤"}
              </div>
              <div className="bubble-wrap">
                <div className={`bubble ${msg.role === "tutor" ? "bubble-formatted" : ""}`}>
                  {msg.role === "tutor" ? renderMarkdown(msg.text) : msg.text}
                </div>
                {msg.role === "tutor" && <SpeakButton text={msg.text} />}
              </div>
            </div>
          ))}

          {status === "thinking" && (
            <div className="message tutor">
              <div className="avatar">🎓</div>
              <div className="bubble">
                <div className="typing-dots"><span/><span/><span/></div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
