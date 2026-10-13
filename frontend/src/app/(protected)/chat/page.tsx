"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MarkdownView } from "@/components/MarkdownView";
import { PageHeader } from "@/components/PageHeader";
import {
  createChatSession,
  deleteChatSession,
  fetchChatSession,
  fetchChatSessions,
  getApiErrorMessage,
  streamChatMessage,
} from "@/lib/api";
import type { ChatMessage, ChatSession } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type UiMessage = ChatMessage & { streaming?: boolean; toolNotes?: string[] };

function ChatPageInner() {
  const searchParams = useSearchParams();
  const seedQ = searchParams.get("q") || "";
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState(seedQ);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const loadSessions = useCallback(() => {
    fetchChatSessions()
      .then((list) => {
        setSessions(list);
        if (!activeId && list[0]) setActiveId(list[0].id);
      })
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [activeId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (seedQ) setInput(seedQ);
  }, [seedQ]);

  useEffect(() => {
    if (!seedQ || seededRef.current) return;
    seededRef.current = true;
    createChatSession(seedQ.slice(0, 60))
      .then((s) => {
        setSessions((prev) => [s, ...prev]);
        setActiveId(s.id);
      })
      .catch(() => {
        /* keep existing session */
      });
  }, [seedQ]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    fetchChatSession(activeId)
      .then((d) => setMessages(d.messages))
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function newSession() {
    try {
      const s = await createChatSession();
      setSessions((prev) => [s, ...prev]);
      setActiveId(s.id);
      setMessages([]);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  async function removeSession(id: string) {
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setError("");

    const userMsg: UiMessage = {
      id: `local-${Date.now()}`,
      session_id: activeId,
      role: "user",
      content,
      token_count: 0,
      meta: {},
      created_at: new Date().toISOString(),
    };
    const assistantId = `stream-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        session_id: activeId,
        role: "assistant",
        content: "",
        token_count: 0,
        meta: {},
        created_at: null,
        streaming: true,
        toolNotes: [],
      },
    ]);

    try {
      await streamChatMessage(activeId, content, (ev) => {
        if (ev.event === "token") {
          const token = String(ev.data ?? "");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        } else if (ev.event === "tool_call" || ev.event === "tool_result") {
          const note = `${ev.event}: ${JSON.stringify(ev.data)}`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, toolNotes: [...(m.toolNotes ?? []), note] }
                : m
            )
          );
        } else if (ev.event === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m
            )
          );
        }
      });
      loadSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Chat"
        description="Ask questions over ingested documents with streaming agent responses."
        action={
          <button
            type="button"
            onClick={newSession}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral"
          >
            New session
          </button>
        }
      />
      {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

      <div
        data-tour="chat-panel"
        className="flex h-[calc(100vh-12rem)] min-h-[420px] overflow-hidden rounded-xl border-[2.5px] border-ink/15 bg-paper shadow-sm"
      >
        <aside className="w-56 shrink-0 border-r border-ink/10 bg-paper-warm/80 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Sessions
          </p>
          <ul className="space-y-1 overflow-y-auto">
            {sessions.map((s) => (
              <li key={s.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`flex-1 truncate rounded-lg px-2 py-2 text-left text-sm ${
                    activeId === s.id
                      ? "bg-coral/15 font-medium text-coral-dark"
                      : "text-ink-soft hover:bg-sky-soft"
                  }`}
                >
                  {s.title}
                  <span className="block truncate text-[10px] text-ink-muted">
                    {formatDate(s.updated_at)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(s.id)}
                  className="rounded p-1 text-xs text-ink-muted opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  aria-label="Delete session"
                >
                  ×
                </button>
              </li>
            ))}
            {!sessions.length ? (
              <li className="text-xs text-ink-muted">No sessions — create one.</li>
            ) : null}
          </ul>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {!activeId ? (
              <p className="text-sm text-ink-muted">Select or create a chat session.</p>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-coral text-white"
                    : "mr-auto border-[2.5px] border-ink/15 bg-paper-warm/60 text-ink"
                }`}
              >
                {m.role === "assistant" ? (
                  <>
                    {m.toolNotes?.length ? (
                      <ul className="mb-2 space-y-0.5 font-mono text-[10px] text-ink-muted">
                        {m.toolNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                    {m.content ? (
                      <MarkdownView content={m.content} />
                    ) : m.streaming ? (
                      <span className="text-ink-muted">Thinking…</span>
                    ) : null}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={onSend}
            className="flex gap-2 border-t border-ink/10 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!activeId || sending}
              placeholder={activeId ? "Message the commerce agent…" : "Create a session first"}
              className="flex-1 rounded-lg border-[2.5px] border-ink/15 px-3 py-2 text-sm outline-none focus:border-coral disabled:bg-paper-warm/60"
            />
            <button
              type="submit"
              disabled={!activeId || sending || !input.trim()}
              className="rounded-xl border-[2.5px] border-ink bg-coral px-4 py-2 text-sm font-extrabold text-white shadow-comic hover:bg-coral-dark disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
