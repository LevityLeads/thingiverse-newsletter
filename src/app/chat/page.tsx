'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, status, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    sendMessage({ text });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col px-4">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl font-bold text-tv-dark mb-2">
              Newsletter Assistant
            </p>
            <p className="text-gray-500 max-w-md">
              Paste thing URLs or creator URLs and I&apos;ll build the
              newsletter, write the copy, send a test, and schedule it.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <p>
                &quot;Build The Build with thing:7340214, thing:531244,
                thing:6108508&quot;
              </p>
              <p>
                &quot;Creator Spotlight for EndlessDesignLab, Baeoniq,
                bamingodesign&quot;
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.role === 'user' && <UserMessage message={m} />}
            {m.role === 'assistant' && <AssistantMessage message={m} />}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner size={4} />
                Thinking...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error.message}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste thing URLs or describe what you need..."
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-tv-blue px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('');

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-tv-blue px-4 py-2.5 text-white text-sm">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const elements: ReactNode[] = [];

  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i];

    if (part.type === 'text' && part.text) {
      elements.push(
        <div
          key={`text-${i}`}
          className="rounded-2xl rounded-bl-md bg-white border border-gray-100 px-4 py-2.5 text-sm text-tv-dark shadow-sm whitespace-pre-wrap"
        >
          {part.text}
        </div>
      );
    } else if (part.type.startsWith('tool-')) {
      const toolPart = part as unknown as {
        type: string;
        toolCallId: string;
        state: string;
        output?: Record<string, unknown>;
      };
      const toolName = part.type.replace(/^tool-/, '');
      const isDone =
        toolPart.state === 'output-available' ||
        toolPart.state === 'output-error';

      elements.push(
        <div key={toolPart.toolCallId}>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            {isDone ? (
              <span className="text-green-600">&#10003;</span>
            ) : (
              <Spinner size={3} />
            )}
            <span>{toolDisplayName(toolName, isDone)}</span>
          </div>

          {toolName === 'renderNewsletter' &&
            toolPart.state === 'output-available' &&
            typeof toolPart.output?.html === 'string' && (
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Preview
                </p>
                <div className="flex justify-center">
                  <iframe
                    srcDoc={toolPart.output.html}
                    title="Newsletter preview"
                    className="border-0 bg-white rounded-lg"
                    style={{ width: 600, height: 700 }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
        </div>
      );
    }
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3">{elements}</div>
    </div>
  );
}

function Spinner({ size }: { size: number }) {
  return (
    <svg
      className={`h-${size} w-${size} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  );
}

function toolDisplayName(toolName: string, isDone: boolean): string {
  const activeMap: Record<string, string> = {
    pullThingData: 'Pulling thing data...',
    pullCreatorData: 'Pulling creator data...',
    renderNewsletter: 'Generating newsletter...',
    sendTestEmail: 'Sending test email...',
    scheduleNewsletter: 'Scheduling sends...',
  };
  const doneMap: Record<string, string> = {
    pullThingData: 'Thing data pulled',
    pullCreatorData: 'Creator data pulled',
    renderNewsletter: 'Newsletter generated',
    sendTestEmail: 'Test email sent',
    scheduleNewsletter: 'Sends scheduled',
  };
  if (isDone) return doneMap[toolName] || toolName;
  return activeMap[toolName] || toolName;
}
