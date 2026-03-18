
import express from "express";
import cors from "cors";


const app = express();
app.use(express.json());

app.use(cors());
app.use(json());

// ── Tutor system prompt ──────────────────────────────────────────────────────
function buildSystemPrompt(subject, level, levelLabel, mode) {
  const modeInstructions = {
    explain: `The student wants you to EXPLAIN concepts clearly.
- Give clear, well-structured explanations.
- Use real-life Indian examples to make it relatable.
- Break complex topics into simple parts.`,

    qa: `The student is ASKING QUESTIONS. Answer each question fully and accurately.
- Give complete, direct answers.
- Support with examples, diagrams described in text, or analogies where useful.`,

    doubt: `The student has DOUBTS or CONFUSIONS about something. Your job is to clarify.
- First acknowledge what they are confused about.
- Then explain it clearly from scratch, assuming they have a gap.
- Be patient and thorough.`,

    quiz: `You are running an MCQ QUIZ for the student.
- When asked to start or give a question, generate ONE MCQ question with 4 options (A, B, C, D).
- Format it clearly with the question on one line, then each option on its own line.
- Wait for the student's answer.
- When they answer, tell them if they are RIGHT or WRONG, then give a clear explanation of the correct answer.
- Then ask if they want the next question.`,

    notes: `The student wants SUMMARY NOTES on a topic.
- Give well-organized, bullet-point notes.
- Use headings for sections.
- Keep it concise but complete — like revision notes.`,
  };

  return `You are VidyaVoice, a smart and friendly AI tutor for Indian students.

Student Profile:
- Education Level: ${levelLabel || level}
- Subject: ${subject}
- Study Mode: ${mode}

Mode Instructions:
${modeInstructions[mode] || modeInstructions.qa}

LANGUAGE RULE:
- If the student writes in a specific language (e.g. "explain in Kannada", "Hindi mein batao"), respond in that language.
- Otherwise respond in clear simple English appropriate for ${levelLabel || level} level.

FORMATTING RULES (very important — format like ChatGPT/Claude):
- SHORT answer (simple fact/definition): 2-3 sentences, single paragraph.
- MEDIUM answer: 2-3 paragraphs, each covering one idea. Blank line between paragraphs.
- LONG or COMPLEX answer: use paragraphs + bullet points. Use **bold** for key terms.
- Use bullet points (starting with -) when listing steps, features, or multiple items.
- NEVER dump everything into one long wall of text. Structure it properly.
- For quiz mode: format MCQ with clear question and A/B/C/D options on separate lines.

TONE RULES:
- Friendly and warm like a knowledgeable older sibling.
- NEVER say "beta", "dear", "friend" — just talk naturally.
- NEVER start with "Hello!", "Great question!", "Of course!" — get straight to the point.
- NEVER end with "Do you have any doubts?", "Hope that helps!" — just finish the answer naturally.
- Never say "As an AI" — you are the tutor.
- Always complete every sentence. Never cut off mid-sentence.`;
}

// ── Murf TTS ──────────────────────────────────────────────────────────────────
async function textToSpeech(text, language) {
  const MURF_API_KEY = process.env.MURF_API_KEY;
  if (!MURF_API_KEY) throw new Error("MURF_API_KEY not set");

  // Gen2 voice IDs — confirmed working on free/starter Murf plans
  // For languages without a dedicated voice, we fall back to en-IN-rohan
  // which supports multilingual output and works on most plans
  const voiceMap = {
    english:  "en-IN-rohan",     // ✅ confirmed working
    hinglish: "en-IN-rohan",     // ✅ Indian English, great for Hinglish
    tamil:    "ta-IN-iniya",     // ✅ confirmed working
    bengali:  "bn-IN-abhik",     // ✅ confirmed working
    // Below: fallback to en-IN-rohan if not on your plan
    hindi:    "en-IN-rohan",     // fallback — hi-IN voices need higher plan
    telugu:   "en-IN-rohan",     // fallback
    kannada:  "en-IN-rohan",     // fallback
    marathi:  "en-IN-rohan",     // fallback
  };

  const voiceId = voiceMap[language] || "en-IN-rohan";

  // Try primary voice first, auto-fallback to en-IN-rohan if it fails
  const tryVoice = async (vid) => {
    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY,
      },
      body: JSON.stringify({
        voiceId: vid,
        text,
        format: "MP3",
        sampleRate: 24000,
        speed: 0,
        pitch: 0,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Murf API error: ${err}`);
    }

    const data = await response.json();
    const audioUrl = data.audioFile || data.audio_file || data.url || data.audioUrl;
    if (!audioUrl) throw new Error("No audio URL in response: " + JSON.stringify(data));
    return audioUrl;
  };

  // Try selected voice, fall back to rohan if invalid
  try {
    return await tryVoice(voiceId);
  } catch (err) {
    if (err.message.includes("Invalid voice_id") && voiceId !== "en-IN-rohan") {
      console.warn(`Voice ${voiceId} not available, falling back to en-IN-rohan`);
      return await tryVoice("en-IN-rohan");
    }
    throw err;
  }
}

// ── Main chat endpoint ───────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, subject, level, levelLabel, mode, history } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const sysPrompt = buildSystemPrompt(subject || "General Science", level || "class9-10", levelLabel || "Class 9-10", mode || "qa");

  try {
    // 1. Build Groq conversation history
    const groqHistory = (history || []).slice(-6).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text || m.content,
    }));

    // 2. Call Groq API (free, fast, works from India)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set in .env");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",   // free, very fast (~500 tokens/sec)
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: "system", content: sysPrompt },
          ...groqHistory,
          { role: "user", content: message },
        ],
      }),
    });

    const groqData = await groqRes.json();
    if (!groqRes.ok) throw new Error(JSON.stringify(groqData));

    let tutorText = groqData.choices[0].message.content.trim();

    // Safety: if response was cut off (no ending punctuation), trim to last complete sentence
    const finishReason = groqData.choices[0].finish_reason;
    if (finishReason === "length") {
      // Was cut off by token limit — find last complete sentence
      const lastPunct = Math.max(
        tutorText.lastIndexOf("."),
        tutorText.lastIndexOf("?"),
        tutorText.lastIndexOf("!"),
        tutorText.lastIndexOf("।"),   // Hindi/Kannada danda
        tutorText.lastIndexOf("॥")    // double danda
      );
      if (lastPunct > tutorText.length * 0.4) {
        tutorText = tutorText.substring(0, lastPunct + 1).trim();
        console.log("Trimmed cut-off response to last complete sentence.");
      }
    }

    // 3. Convert to speech via Murf
    // Strip markdown so Murf doesn't read symbols out loud
    const cleanForTTS = (text) => {
      return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/^[-\u2022\u25B8]\s+/gm, '')
        .replace(/^#+\s+/gm, '')
        .replace(/\n\n\n+/g, '\n\n')
        .trim();
    };

    let audioUrl = null;
    try {
      const ttsText = cleanForTTS(tutorText);
      audioUrl = await textToSpeech(ttsText, "english");
    } catch (murfErr) {
      // If still too long and timing out, retry with first 3 sentences only
      if (murfErr.message.includes("408") || murfErr.message.includes("timeout")) {
        try {
          const short = cleanForTTS(tutorText);
          let cut = '', count = 0;
          for (let i = 0; i < short.length; i++) {
            cut += short[i];
            if (['.','!','?','।'].includes(short[i])) {
              count++;
              if (count >= 3) break;
            }
          }
          audioUrl = await textToSpeech(cut.trim(), "english");
        } catch (e) {
          console.warn("Murf TTS retry also failed:", e.message);
        }
      } else {
        console.warn("Murf TTS failed, returning text only:", murfErr.message);
      }
    }

    res.json({ text: tutorText, audioUrl });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", service: "VidyaVoice" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VidyaVoice backend running on port ${PORT}`));

// ── Speak endpoint (convert any text to voice on demand) ─────────────────────
app.post("/api/speak", async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  // Strip markdown symbols so Murf doesn't read them aloud
  const cleanForTTS = (str) => {
    return str
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^[-\u2022\u25B8]\s+/gm, '')
      .replace(/^#+\s+/gm, '')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();
  };

  const ttsText = cleanForTTS(text);

  // Retry once on timeout
  const tryWithRetry = async () => {
    try {
      return await textToSpeech(ttsText, language || "english");
    } catch (err) {
      if (err.message.includes("408") || err.message.includes("timeout")) {
        console.log("Murf timeout, retrying once...");
        await new Promise(r => setTimeout(r, 1000)); // wait 1s
        return await textToSpeech(ttsText, language || "english");
      }
      throw err;
    }
  };

  try {
    const audioUrl = await tryWithRetry();
    res.json({ audioUrl });
  } catch (err) {
    console.error("Speak error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Test voices endpoint (GET /test-voices) ───────────────────────────────────
// Visit http://localhost:3001/test-voices in browser to find working voice IDs
app.get("/test-voices", async (req, res) => {
  const MURF_API_KEY = process.env.MURF_API_KEY;
  const testVoices = [
    "en-IN-nikhil", "en-IN-priya", "en-IN-aarav", "en-IN-rohan",
    "hi-IN-aarav",  "hi-IN-aman",  "hi-IN-karan",
    "kn-IN-rajesh", "kn-IN-julia", "kn-IN-maverick",
    "ta-IN-iniya",  "ta-IN-murali",
    "te-IN-anand",  "te-IN-josie",
    "bn-IN-abhik",  "mr-IN-rujuta",
  ];

  const results = [];
  for (const voiceId of testVoices) {
    try {
      const r = await fetch("https://api.murf.ai/v1/speech/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": MURF_API_KEY },
        body: JSON.stringify({ voiceId, text: "Hello", format: "MP3" }),
      });
      const d = await r.json();
      results.push({ voiceId, status: r.ok ? "✅ WORKS" : "❌ " + d.error_message });
    } catch (e) {
      results.push({ voiceId, status: "❌ " + e.message });
    }
  }
  res.json(results);
});