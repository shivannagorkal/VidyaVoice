export default function VoiceButton({ status, listening, speaking, onClick }) {
  return (
    <div className="voice-btn-wrap">
      <button
        className={`voice-btn ${status}`}
        onClick={onClick}
        disabled={status === "thinking" || status === "speaking"}
        aria-label={listening ? "Stop listening" : "Start listening"}
      >
        {status === "listening" ? (
          // Stop icon
          <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        ) : status === "speaking" ? (
          // Speaker wave icon
          <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        ) : status === "thinking" ? (
          // Spinner dots
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" opacity="0.5"/>
            <circle cx="5" cy="12" r="2" opacity="0.8"/>
            <circle cx="19" cy="12" r="2" opacity="0.3"/>
          </svg>
        ) : (
          // Mic icon
          <svg viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4z"/>
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        )}
      </button>
    </div>
  );
}