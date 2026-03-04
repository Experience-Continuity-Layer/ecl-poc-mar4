"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, SendHorizonal } from "lucide-react";
import { getLatestChannelHandoff, useAgentContextStore } from "@/core/agent-context/store";
import type { ConversationEntry } from "@/core/agent-context/types";
import { runAgentTurn } from "@/core/ai/agent-module";
import { HandoffBanner, PhoneFrame } from "@/components/shell/tooling/design-system/primitives";
import styles from "./whatsapp-window.module.css";

const CHANNEL_ID = "whatsapp";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function shouldShowTimestamp(
  current: ConversationEntry,
  previous: ConversationEntry | undefined,
) {
  if (!previous) return true;
  const gap =
    new Date(current.timestamp).getTime() -
    new Date(previous.timestamp).getTime();
  return gap > 5 * 60_000;
}

function maskPhone(phone: string): string {
  if (phone.length <= 8) return phone;
  return `${phone.slice(0, 6)} …`;
}

export function WhatsAppWindow() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationHistory = useAgentContextStore(
    (s) => s.context.conversationHistory,
  );
  const channelHistory = useAgentContextStore(
    (s) => s.context.channelHistory,
  );
  const channels = useAgentContextStore(
    (s) => s.context.agentConfig.channels,
  );
  const customer = useAgentContextStore((s) => s.context.customer);
  const contextSummary = useAgentContextStore((s) => s.context.contextSummary);

  const isEnabled = channels.includes(CHANNEL_ID);

  const messages = useMemo(
    () => conversationHistory.filter((e) => e.channel === CHANNEL_ID),
    [conversationHistory],
  );

  const latestHandoff = useMemo(
    () => getLatestChannelHandoff(CHANNEL_ID),
    [channelHistory],
  );

  const showHandoffBanner = latestHandoff !== null;
  const isAwaitingGreeting = showHandoffBanner && messages.length === 0;

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isSending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isSending || !isEnabled) return;

      setIsSending(true);
      setError(null);
      try {
        await runAgentTurn(CHANNEL_ID, trimmed);
        setInput("");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to send message.";
        setError(msg);
      } finally {
        setIsSending(false);
        inputRef.current?.focus();
      }
    },
    [input, isSending, isEnabled],
  );

  return (
    <PhoneFrame>
      <section className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>
              <MessageCircle size={16} />
            </div>
            <div className={styles.headerInfo}>
              <span className={styles.headerTitle}>Messaging</span>
              <span className={styles.headerSubtitle}>
                {isSending
                  ? "Typing…"
                  : customer.phoneNumber
                    ? `Aurelia Assistant · ${maskPhone(customer.phoneNumber)}`
                    : "Aurelia Assistant"}
              </span>
              <span className={styles.headerHint}>
                WhatsApp simulation · switch channels via taskbar
              </span>
            </div>
          </div>
        </header>

        {showHandoffBanner && latestHandoff && (
          <HandoffBanner
            fromChannel={latestHandoff.from}
            summary={contextSummary || latestHandoff.summary}
            timestamp={latestHandoff.timestamp}
          />
        )}

        <div ref={messagesRef} className={styles.messages}>
          {messages.length === 0 && !showHandoffBanner && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <MessageCircle size={20} />
              </div>
              <h3 className={styles.emptyTitle}>No messages yet</h3>
              <p className={styles.emptyBody}>
                Send a message to start a conversation, or switch from another
                channel to continue here.
              </p>
            </div>
          )}
          {isAwaitingGreeting && (
            <div className={styles.connectingState}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.connectingLabel}>Connecting…</span>
            </div>
          )}

          {messages.map((entry, i) => {
            const key = `${entry.timestamp}-${i}`;
            const prev = messages[i - 1];
            const isUser = entry.role === "user";

            return (
              <div key={key}>
                {shouldShowTimestamp(entry, prev) && (
                  <div className={styles.timestamp}>
                    {formatTime(entry.timestamp)}
                  </div>
                )}
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {entry.content}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className={styles.thinking}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!isEnabled && (
          <div className={styles.disabledNotice}>
            Messaging channel is disabled. Enable it in the Agent Control Center.
          </div>
        )}

        <form
          className={styles.inputBar}
          onSubmit={handleSend}
          autoComplete="off"
          data-1p-ignore
        >
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEnabled ? "Type a message…" : "Channel disabled"}
            disabled={isSending || !isEnabled}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={isSending || !input.trim() || !isEnabled}
          >
            <SendHorizonal size={16} />
          </button>
        </form>
      </section>
    </PhoneFrame>
  );
}
