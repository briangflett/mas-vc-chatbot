"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { splitSuggestions } from "@/lib/suggestions";

interface Identity {
  wp_user_id?: number;
  wp_user_email?: string;
  wp_display_name?: string;
  civicrm_contact_id?: number | null;
  civicrm_display_name?: string | null;
}

const STARTERS = [
  "What are a VC's responsibilities?",
  "How do I close a project?",
  "What service requests need a VC?",
  "How can you help me with a project?",
];

/** Extract plain text from a UIMessage's parts. */
function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function Page() {
  const [identity, setIdentity] = useState<Identity>({});
  const [input, setInput] = useState("");
  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `s-${Date.now()}`),
    [],
  );

  // Identity arrives from the embedding WordPress page via postMessage; URL
  // params are a fallback for standalone testing.
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
    // Announce readiness so the parent can post identity.
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

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    void sendMessage({ text: t });
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const liveSuggestions =
    lastAssistant && !busy ? splitSuggestions(messageText(lastAssistant)).suggestions : [];

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxWidth: 820,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--mas-border)",
          background: "var(--mas-surface)",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>MAS AI Assistant</h1>
        <p style={{ fontSize: 13, color: "var(--mas-muted)", margin: "2px 0 0" }}>
          Ask about MAS processes, contacts, or cases
          {identity.civicrm_display_name ? ` · ${identity.civicrm_display_name}` : ""}
        </p>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} style={chipStyle}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const { body } = splitSuggestions(messageText(m));
          return (
            <div key={m.id} style={{ margin: "0 0 16px" }}>
              <div style={{ fontSize: 12, color: "var(--mas-muted)", marginBottom: 4 }}>
                {m.role === "user" ? "You" : "MAS AI Assistant"}
              </div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  background: m.role === "user" ? "#eff6ff" : "var(--mas-surface)",
                  border: "1px solid var(--mas-border)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  lineHeight: 1.5,
                }}
              >
                {body || (busy ? "…" : "")}
              </div>
            </div>
          );
        })}

        {liveSuggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {liveSuggestions.map((s) => (
              <button key={s} onClick={() => send(s)} style={chipStyle}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{
          display: "flex",
          gap: 8,
          padding: 16,
          borderTop: "1px solid var(--mas-border)",
          background: "var(--mas-surface)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={busy}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--mas-border)",
            fontSize: 15,
          }}
        />
        <button type="submit" disabled={busy || !input.trim()} style={sendStyle}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}

const chipStyle: React.CSSProperties = {
  background: "var(--mas-surface)",
  border: "1px solid var(--mas-border)",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--mas-muted)",
  cursor: "pointer",
  textAlign: "left",
};

const sendStyle: React.CSSProperties = {
  background: "var(--mas-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "0 18px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
