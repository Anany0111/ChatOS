import { useState, useRef, useEffect, useCallback } from "react";

const ROOMS = [
  { id: "general", name: "general", icon: "#", desc: "Public chat" },
  { id: "random", name: "random", icon: "#", desc: "Off-topic" },
  { id: "dev", name: "dev-talk", icon: "#", desc: "Tech discussions" },
];

const USERS = [
  { id: "ai", name: "ARIA", color: "#00ffcc", avatar: "🤖", isAI: true },
  { id: "u1", name: "alex_k", color: "#ff6b6b", avatar: "A" },
  { id: "u2", name: "mira.v", color: "#ffd93d", avatar: "M" },
  { id: "u3", name: "joe99", color: "#6bcbff", avatar: "J" },
  { id: "me", name: "you", color: "#c084fc", avatar: "Y" },
];

const SEED_MESSAGES = {
  general: [
    { id: 1, userId: "u1", text: "hey everyone 👋", ts: Date.now() - 120000 },
    { id: 2, userId: "u2", text: "what's up!", ts: Date.now() - 90000 },
    { id: 3, userId: "u3", text: "anyone tried the new AI assistant? it's wild", ts: Date.now() - 60000 },
  ],
  random: [
    { id: 4, userId: "u2", text: "coffee or tea? serious question", ts: Date.now() - 200000 },
    { id: 5, userId: "u1", text: "coffee, obviously ☕", ts: Date.now() - 180000 },
  ],
  dev: [
    { id: 6, userId: "u3", text: "react 20 dropped any thoughts?", ts: Date.now() - 300000 },
    { id: 7, userId: "u1", text: "concurrent features are 🔥", ts: Date.now() - 280000 },
  ],
};

const BOT_RESPONSES = [
  "that's an interesting perspective.",
  "could you elaborate on that?",
  "I see what you mean! 💡",
  "great point — I was thinking the same.",
  "haha yeah totally agree 😄",
  "hmm not sure about that one tbh",
  "👀 this is getting interesting",
];

let msgId = 100;
function nextId() { return ++msgId; }

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user.isAI
        ? "linear-gradient(135deg, #00ffcc, #0066ff)"
        : `${user.color}22`,
      border: `1.5px solid ${user.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700,
      color: user.isAI ? "#000" : user.color,
      flexShrink: 0,
      boxShadow: user.isAI ? `0 0 12px #00ffcc55` : "none",
    }}>
      {user.avatar}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#00ffcc",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [onlineUsers] = useState(["u1", "u2", "u3", "me", "ai"]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const convHistory = useRef([]);

  const roomMessages = messages[activeRoom] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages, aiTyping, botTyping]);

  // Simulate random bot messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const bots = USERS.filter(u => u.id !== "me" && !u.isAI);
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const text = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          setMessages(prev => ({
            ...prev,
            [activeRoom]: [...(prev[activeRoom] || []), {
              id: nextId(), userId: bot.id, text, ts: Date.now()
            }]
          }));
        }, 1500 + Math.random() * 1000);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  const callAI = useCallback(async (userMessage) => {
    setAiTyping(true);
    setAiLoading(true);
    convHistory.current.push({ role: "user", content: userMessage });

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: convHistory.current.slice(-10).map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          systemInstruction: { parts: [{ text: `You are ARIA, a witty and helpful AI assistant in a real-time group chat app. You speak concisely (1-3 sentences max), use occasional emojis naturally, and have a warm but sharp personality. The current channel is #${activeRoom}.` }] },
          generationConfig: { maxOutputTokens: 1000 },
          max_tokens: 1000,
          system: `You are ARIA, a witty and helpful AI assistant in a real-time group chat app. You speak concisely (1-3 sentences max), use occasional emojis naturally, and have a warm but sharp personality. You're knowledgeable but never condescending. The current channel is #${activeRoom}.`,
          messages: convHistory.current.slice(-10),
        }),
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, something went wrong!";
      convHistory.current.push({ role: "assistant", content: aiText });

      setAiTyping(false);
      setAiLoading(false);
      setMessages(prev => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), {
          id: nextId(), userId: "ai", text: aiText, ts: Date.now()
        }]
      }));
    } catch {
      setAiTyping(false);
      setAiLoading(false);
      setMessages(prev => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), {
          id: nextId(), userId: "ai", text: "Connection error — try again! 🔌", ts: Date.now()
        }]
      }));
    }
  }, [activeRoom]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    setMessages(prev => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), {
        id: nextId(), userId: "me", text, ts: Date.now()
      }]
    }));
    setInput("");

    const mentionsAI = /^@(aria|ai)\b/i.test(text) || text.endsWith("?");
    if (mentionsAI) {
      setTimeout(() => callAI(text.replace(/^@(aria|ai)\s*/i, "")), 500);
    }
  }, [input, activeRoom, callAI]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUser = (id) => USERS.find(u => u.id === id) || USERS[0];

  return (
    <div style={{ fontFamily: "'DM Mono', 'Fira Code', monospace", background: "#0a0a0f", color: "#e2e8f0", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px #00ffcc44} 50%{box-shadow:0 0 20px #00ffcc88} }
        .msg-row { animation: fadeSlide 0.25s ease-out; }
        .room-btn:hover { background: #1a1a2e !important; }
        .send-btn:hover:not(:disabled) { background: #00ddaa !important; }
        .input-field:focus { border-color: #00ffcc !important; box-shadow: 0 0 0 2px #00ffcc22 !important; outline: none; }
        .ai-badge { animation: glow 2s ease-in-out infinite; }
      `}</style>

      {/* Top Bar */}
      <div style={{ background: "#0d0d17", borderBottom: "1px solid #1e1e2e", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>☰</button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>
          chat<span style={{ color: "#00ffcc" }}>OS</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#00ffcc11", border: "1px solid #00ffcc33", borderRadius: 20, padding: "4px 12px" }} className="ai-badge">
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffcc", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#00ffcc", fontWeight: 500 }}>ARIA online</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{ width: 220, background: "#0d0d17", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "16px 12px 8px", fontSize: 10, color: "#444", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>Channels</div>
            {ROOMS.map(room => (
              <button key={room.id} className="room-btn" onClick={() => setActiveRoom(room.id)} style={{
                background: activeRoom === room.id ? "#1a1a2e" : "transparent",
                border: "none", color: activeRoom === room.id ? "#e2e8f0" : "#666",
                borderLeft: activeRoom === room.id ? "2px solid #00ffcc" : "2px solid transparent",
                padding: "8px 14px", cursor: "pointer", textAlign: "left", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
              }}>
                <span style={{ color: "#444" }}>{room.icon}</span>
                {room.name}
              </button>
            ))}

            <div style={{ padding: "20px 12px 8px", fontSize: 10, color: "#444", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>Members — {onlineUsers.length}</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {USERS.map(user => (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px" }}>
                  <div style={{ position: "relative" }}>
                    <Avatar user={user} size={26} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, borderRadius: "50%", background: "#00ffcc", border: "1.5px solid #0d0d17" }} />
                  </div>
                  <span style={{ fontSize: 12, color: user.id === "me" ? "#c084fc" : "#888" }}>{user.name}</span>
                  {user.isAI && <span style={{ fontSize: 9, background: "#00ffcc22", color: "#00ffcc", padding: "1px 5px", borderRadius: 3 }}>AI</span>}
                </div>
              ))}
            </div>

            <div style={{ padding: 12, margin: 8, background: "#00ffcc08", border: "1px solid #00ffcc22", borderRadius: 8, fontSize: 11, color: "#555", lineHeight: 1.5 }}>
              💬 Mention <span style={{ color: "#00ffcc" }}>@aria</span> or ask a question to chat with the AI
            </div>
          </div>
        )}

        {/* Main Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 20px", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: "#0a0a0f" }}>
            <span style={{ color: "#444", fontSize: 16 }}>#</span>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{ROOMS.find(r => r.id === activeRoom)?.name}</span>
            <span style={{ color: "#444", fontSize: 12 }}>—</span>
            <span style={{ color: "#555", fontSize: 12 }}>{ROOMS.find(r => r.id === activeRoom)?.desc}</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
            {roomMessages.map((msg, i) => {
              const user = getUser(msg.userId);
              const isMe = msg.userId === "me";
              const prevMsg = roomMessages[i - 1];
              const grouped = prevMsg?.userId === msg.userId && (msg.ts - prevMsg.ts) < 120000;

              return (
                <div key={msg.id} className="msg-row" style={{
                  display: "flex", gap: 10,
                  flexDirection: isMe ? "row-reverse" : "row",
                  marginTop: grouped ? 1 : 10,
                  alignItems: "flex-end",
                }}>
                  {!grouped ? <Avatar user={user} size={30} /> : <div style={{ width: 30, flexShrink: 0 }} />}
                  <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {!grouped && (
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3, flexDirection: isMe ? "row-reverse" : "row" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: user.color }}>{user.name}</span>
                        <span style={{ fontSize: 10, color: "#333" }}>{formatTime(msg.ts)}</span>
                      </div>
                    )}
                    <div style={{
                      background: isMe ? "#4c1d95" : user.isAI ? "#001a12" : "#13131f",
                      border: `1px solid ${isMe ? "#7c3aed44" : user.isAI ? "#00ffcc33" : "#1e1e2e"}`,
                      borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      padding: "8px 12px", fontSize: 13, lineHeight: 1.5,
                      color: isMe ? "#e9d5ff" : user.isAI ? "#b0fff0" : "#cbd5e1",
                      boxShadow: user.isAI ? "0 0 12px #00ffcc11" : "none",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {(aiTyping || botTyping) && (
              <div className="msg-row" style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-end" }}>
                <Avatar user={aiTyping ? USERS[0] : USERS[1]} size={30} />
                <div>
                  <div style={{ fontSize: 11, color: "#444", marginBottom: 3 }}>
                    {aiTyping ? "ARIA" : USERS[1].name} is typing...
                  </div>
                  <div style={{
                    background: aiTyping ? "#001a12" : "#13131f",
                    border: `1px solid ${aiTyping ? "#00ffcc33" : "#1e1e2e"}`,
                    borderRadius: "14px 14px 14px 4px",
                    padding: "10px 14px",
                  }}>
                    <TypingDots />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1e1e2e", background: "#0a0a0f", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
            <input
              ref={inputRef}
              className="input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${ROOMS.find(r => r.id === activeRoom)?.name} — type @aria to ask AI`}
              style={{
                flex: 1, background: "#13131f", border: "1px solid #1e1e2e",
                borderRadius: 10, padding: "10px 14px", color: "#e2e8f0",
                fontSize: 13, fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || aiLoading}
              style={{
                background: input.trim() ? "#00ffcc" : "#1e1e2e",
                border: "none", borderRadius: 10, width: 42, height: 42,
                cursor: input.trim() && !aiLoading ? "pointer" : "default",
                color: input.trim() ? "#000" : "#444",
                fontSize: 16, fontWeight: 700, transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
