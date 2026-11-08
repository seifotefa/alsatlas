import { aliceInstructions } from './agents.js';

const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

export function backboardConfigured() {
  return Boolean(process.env.BACKBOARD_API_KEY?.trim());
}

export function backboardModel() {
  return process.env.BACKBOARD_MODEL?.trim() || DEFAULT_MODEL;
}

export type BackboardReply = {
  answer: string;
  threadId: string | null;
  assistantId: string | null;
  provider: 'backboard';
  model: string;
  citations: string[];
};

let assistantId = process.env.BACKBOARD_ASSISTANT_ID?.trim() || '';

export async function askBackboard(input: { message: string; threadId?: string; facts: string[]; instructions?: string }): Promise<BackboardReply> {
  const key = process.env.BACKBOARD_API_KEY?.trim();
  if (!key) throw new Error('Backboard is not configured. Set BACKBOARD_API_KEY.');
  const base = (process.env.BACKBOARD_BASE_URL || 'https://app.backboard.io/api').replace(/\/$/, '');
  const model = backboardModel();
  const provider = process.env.BACKBOARD_LLM_PROVIDER?.trim() || 'openrouter';
  const facts = input.facts.map(fact => fact.trim()).filter(Boolean);
  const system = input.instructions?.trim() || aliceInstructions;
  const withFacts = `${system}\nRecorded facts:\n${facts.map((fact, index) => `[P${index + 1}] ${fact}`).join('\n')}`;

  if (!assistantId) {
    const created = await fetch(`${base}/assistants`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({
        name: 'ALS Atlas',
        system_prompt: aliceInstructions,
      }),
    });
    if (created.ok) {
      const assistant = await created.json() as { assistant_id?: string };
      assistantId = assistant.assistant_id || '';
    }
  }

  const response = await fetch(`${base}/threads/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-API-Key': key },
    body: JSON.stringify({
      content: input.message,
      assistant_id: assistantId || undefined,
      thread_id: input.threadId || undefined,
      system_prompt: withFacts,
      llm_provider: provider,
      model_name: model,
      stream: false,
      memory: 'off',
      openrouter: { sort: 'price' },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 280);
    throw new Error(`Backboard request failed (${response.status}). ${detail}`);
  }
  const data = await response.json() as { content?: string; thread_id?: string; assistant_id?: string; model?: string };
  if (data.assistant_id) assistantId = data.assistant_id;
  const answer = String(data.content || '').trim();
  if (!answer) throw new Error('Backboard returned an empty reply.');
  return {
    answer,
    threadId: data.thread_id || input.threadId || null,
    assistantId: data.assistant_id || assistantId || null,
    provider: 'backboard',
    model: data.model || model,
    citations: facts,
  };
}
