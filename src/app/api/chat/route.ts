import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { newsletterTools } from '@/lib/ai/tools';

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: SYSTEM_PROMPT,
    messages,
    tools: newsletterTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
