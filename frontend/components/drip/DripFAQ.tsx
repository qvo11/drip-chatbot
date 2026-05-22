"use client";

import { useState, useRef, useEffect } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  onClose: () => void;
};

export default function DripFAQ({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask me anything about Impress Ink — print methods, apparel, turnaround times, you name it!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const latestAssist = messages[typingIndex]?.content ?? "";
  const { displayed, done } = useTypewriter(
    messages[typingIndex]?.role === "assistant" ? latestAssist : "",
    35
  )
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are Drip, the friendly mascot for Impress Ink — a custom apparel and print shop based in Orlando, FL.
                  Print methods we offer:
                  - Screen printing: best for 20+ pieces, max 7 colors, most cost-effective for bulk
                  - DTG (Direct-to-Garment): best for small runs or full-color designs, minimum 1 piece
                  - Embroidery: available on hats and polos, best for logos and text

                  Products we carry:
                  - T-shirts, hoodies, polos, hats, promo items (tote bags, mugs, etc.)

                  Turnaround: standard 7-10 business days. Rush orders available for an additional fee.
                  File formats: Vector, PDF, or PNG at 300dpi minimum.

                  Keep responses short and conversational, 2-3 sentences max. If asked about specific pricing or placing an order, tell them to use the Get a Quote button. Only answer questions about custom apparel, print methods, and Impress Ink.`,
            },
            ...updatedMessages,
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "Hmmm, try again!";

      setMessages((prev) => {
        const updated: Message[] = [...prev, { role: "assistant", content: reply }];
        setTypingIndex(updated.length - 1);
        return updated;
      });
      
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* Message history */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`text-brand-navy rounded-xl px-3 py-2 text-sm max-w-[85%] leading-snug ${
              m.role === "user"
                ? "bg-brand-red text-white"
                : "bg-white text-brand-navy"
            }`}>
              {m.role === "assistant" && i === typingIndex
                ? displayed
                : m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="text-brand-teal rounded-xl px-3 py-2 text-sm">
              Drip is thinking<span className="animate-wiggle">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about print methods, apparel..."
          className="flex-1 rounded-full px-4 py-2 text-sm outline-brand-navy focus:border-brand-red text-brand-navy bg-white placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !done}
          className="bg-brand-navy text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-40"
        >
          Send
        </button>
      </div>

      {/* Back button */}
      <button
        onClick={onClose}
        className="text-xs text-brand-navy underline text-center mt-1"
      >
        ← Back to quote
      </button>

    </div>
  );
}