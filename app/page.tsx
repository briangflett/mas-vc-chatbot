"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { splitSuggestions } from "@/lib/suggestions";

interface Identity {
  wp_user_id?: number;
  wp_user_email?: string;
  wp_display_name?: string;
  civicrm_contact_id?: number | null;
  civicrm_display_name?: string | null;
}

// Starter chips — exact text/order from the live n8n widget (no trailing "?").
const STARTERS = [
  "What are a VC's responsibilities",
  "How do I close a project",
  "What service requests need a VC",
  "How can you help me with a project",
];

const WELCOME =
  "Welcome! I can help you with MAS processes, find contacts and cases in CiviCRM, and answer questions about nonprofit consulting.";

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function Page() {
  const [identity, setIdentity] = useState<Identity>({});
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `s-${Date.now()}`),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Identity = {};
    if (params.get("email")) fromUrl.wp_user_email = params.get("email")!;
    if (params.get("cid")) fromUrl.civicrm_contact_id = Number(params.get("cid"));
    if (Object.keys(fromUrl).length) setIdentity((cur) => ({ ...cur, ...fromUrl }));

    function onMessage(e: MessageEvent) {
      if (e.data?.type === "mas-vc-identity" && e.data.payload) {
        setIdentity((cur) => ({ ...cur, ...e.data.payload }));
      }
    }
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "mas-vc-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const identityRef = useRef(identity);
  identityRef.current = identity;

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: msgs }) => ({
        body: { messages: msgs, metadata: identityRef.current, sessionId },
      }),
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    void sendMessage({ text: t });
  }

  const hasUserMsg = messages.some((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const liveSuggestions =
    lastAssistant && !busy ? splitSuggestions(messageText(lastAssistant)).suggestions : [];

  return (
    <div style={S.root}>
      {open && (
        <section style={S.panel}>
          {/* Header */}
          <header style={S.header}>
            <h1 style={S.title}>MAS AI Assistant</h1>
            <p style={S.subtitle}>Ask me about MAS processes, contacts, or cases</p>
          </header>

          {/* Body */}
          <div ref={scrollRef} style={S.body}>
            <Bubble role="bot">{WELCOME}</Bubble>

            {messages.map((m) => {
              const { body } = splitSuggestions(messageText(m));
              const text = body || (busy && m.role === "assistant" ? "…" : "");
              if (!text) return null;
              return (
                <Bubble key={m.id} role={m.role === "user" ? "user" : "bot"}>
                  {text}
                </Bubble>
              );
            })}

            {!hasUserMsg && <Chips items={STARTERS} onPick={send} />}
            {liveSuggestions.length > 0 && <Chips items={liveSuggestions} onPick={send} />}
          </div>

          {/* Input */}
          <form
            style={S.inputBar}
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={busy}
              style={S.input}
            />
            <button type="submit" disabled={busy || !input.trim()} style={S.send} aria-label="Send">
              <SendIcon />
            </button>
          </form>
        </section>
      )}

      {/* Pink toggle — matches the n8n widget launcher */}
      <button style={S.toggle} onClick={() => setOpen((o) => !o)} aria-label={open ? "Close chat" : "Open chat"}>
        <Chevron down={open} />
      </button>
    </div>
  );
}

function Bubble({ role, children }: { role: "bot" | "user"; children: string }) {
  if (role === "user") {
    return <div style={S.bubbleUser}>{children}</div>;
  }
  return (
    <div style={S.bubbleBot}>
      <ReactMarkdown
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={S.link}>
              {c}
            </a>
          ),
          p: ({ children: c }) => <p style={{ margin: "0 0 8px" }}>{c}</p>,
          ul: ({ children: c }) => <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>{c}</ul>,
          ol: ({ children: c }) => <ol style={{ margin: "0 0 8px", paddingLeft: 18 }}>{c}</ol>,
          li: ({ children: c }) => <li style={{ marginBottom: 2 }}>{c}</li>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function Chips({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div style={S.chips}>
      {items.map((s) => (
        <button key={s} onClick={() => onPick(s)} style={S.chip}>
          {s}
        </button>
      ))}
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function Chevron({ down }: { down: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "none" : "rotate(180deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1000,
  },
  panel: {
    position: "fixed",
    top: 0,
    bottom: 90,
    right: 0,
    width: "min(400px, 100vw)",
    display: "flex",
    flexDirection: "column",
    background: "var(--chat-body-bg)",
    overflow: "hidden",
    boxShadow: "-8px 0 30px rgba(0,0,0,0.15)",
    pointerEvents: "auto",
  },
  header: {
    background: "var(--chat-header-bg)",
    color: "var(--chat-header-fg)",
    padding: "18px 20px",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 500, lineHeight: 1.1 },
  subtitle: { margin: "8px 0 0", fontSize: 14, color: "#c7cbd6" },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  bubbleBot: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    background: "var(--chat-bot-bg)",
    color: "var(--chat-bot-fg)",
    borderRadius: "4px 4px 4px 0",
    padding: "15px 15px 7px",
    fontSize: 14,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    background: "var(--chat-user-bg)",
    color: "var(--chat-user-fg)",
    borderRadius: "4px 4px 0 4px",
    padding: 15,
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  link: { color: "#2563eb", textDecoration: "underline" },
  chips: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  chip: {
    background: "#fff",
    border: "1px solid var(--chat-border)",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--chat-muted)",
    cursor: "pointer",
    textAlign: "left",
    maxWidth: 200,
    lineHeight: 1.4,
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    background: "#fff",
    borderTop: "1px solid var(--chat-border)",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    background: "transparent",
    color: "#0f172a",
  },
  send: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  toggle: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "var(--chat-toggle-bg)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    pointerEvents: "auto",
    zIndex: 1001,
  },
};
