import { factories } from '@strapi/strapi';

type GeneratedTask = {
  title?: unknown;
  description?: unknown;
};

function toBlocks(text: string): any[] {
  const trimmed = text?.trim();
  if (!trimmed) return [];
  return [{ type: 'paragraph', children: [{ type: 'text', text: trimmed }] }];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseJsonFromText(rawText: string): any {
  const text = (rawText ?? '').trim();
  if (!text) throw new Error('Empty AI response');

  try {
    return JSON.parse(text);
  } catch {}

  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    return JSON.parse(text.slice(objStart, objEnd + 1));
  }

  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    return JSON.parse(text.slice(arrStart, arrEnd + 1));
  }

  throw new Error('AI response was not valid JSON');
}

async function generateTasksWithOllama({
  baseUrl,
  model,
  prompt,
  timeoutMs,
}: {
  baseUrl: string;
  model: string;
  prompt: string;
  timeoutMs: number;
}): Promise<GeneratedTask[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await (globalThis as any).fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.6,
        },
      }),
      signal: controller.signal,
    });

    if (!res?.ok) {
      const maybeText = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res?.status}: ${maybeText || res?.statusText || 'Unknown error'}`);
    }

    const data = await res.json();
    const parsed = parseJsonFromText(data?.response ?? '');

    if (Array.isArray(parsed)) return parsed as GeneratedTask[];
    if (Array.isArray(parsed?.tasks)) return parsed.tasks as GeneratedTask[];

    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const tasks = await strapi.documents('api::task.task').findMany({
      filters: {
        user: {
          id: user.id,
        },
      },
    });

    return { data: tasks, meta: { pagination: {} } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const task = await strapi.documents('api::task.task').create({
      data: {
        ...(ctx.request.body?.data ?? {}),
        user: user.id,
      },
    });

    return { data: task };
  },

  async generateToday(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const requestBody = (ctx.request.body ?? {}) as any;
    const context = typeof requestBody.context === 'string' ? requestBody.context : '';
    const maxTasks = clamp(Number(requestBody.maxTasks ?? 6) || 6, 1, 12);

    const existingTasks = await strapi.documents('api::task.task').findMany({
      filters: {
        user: { id: user.id },
      },
    });
    const existingTitles = new Set<string>(
      (existingTasks ?? [])
        .map((t: any) => String(t?.title ?? '').trim().toLowerCase())
        .filter(Boolean)
    );

    const today = new Date();
    const dateLabel = today.toISOString().slice(0, 10);

    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

    const existingList =
      existingTitles.size > 0
        ? Array.from(existingTitles)
            .slice(0, 50)
            .map((t) => `- ${t}`)
            .join('\n')
        : '';

    const prompt = [
      `You are a personal productivity assistant.`,
      `Generate up to ${maxTasks} actionable todo tasks for today (${dateLabel}).`,
      ``,
      `User context (may be empty):`,
      context ? context : '(none)',
      ``,
      existingList ? `Existing tasks (do not repeat these titles):\n${existingList}` : '',
      ``,
      `Return ONLY valid JSON.`,
      `Schema: {"tasks":[{"title":"string","description":"string"}]}`,
      `Rules:`,
      `- titles must be short (<= 60 chars)`,
      `- descriptions can be empty string`,
      `- no markdown, no extra keys, no commentary`,
    ]
      .filter(Boolean)
      .join('\n');

    let generated: GeneratedTask[] = [];
    try {
      generated = await generateTasksWithOllama({
        baseUrl,
        model,
        prompt,
        timeoutMs: 25_000,
      });
    } catch (err: any) {
      strapi.log.error('[AI generateToday] ' + (err?.message || String(err)));
      ctx.throw(
        502,
        'AI is not reachable. Start Ollama and set OLLAMA_BASE_URL/OLLAMA_MODEL on the backend.'
      );
    }

    const candidates = (generated ?? [])
      .map((t) => ({
        title: String((t as any)?.title ?? '').trim(),
        description: String((t as any)?.description ?? '').trim(),
      }))
      .filter((t) => t.title.length > 0)
      .map((t) => ({
        ...t,
        title: t.title.slice(0, 60),
        description: t.description.slice(0, 500),
      }));

    const created: any[] = [];
    for (const t of candidates) {
      const key = t.title.toLowerCase();
      if (existingTitles.has(key)) continue;
      existingTitles.add(key);

      const doc = await strapi.documents('api::task.task').create({
        data: {
          title: t.title,
          description: toBlocks(t.description),
          completed: false,
          user: user.id,
        },
      });
      created.push(doc);

      if (created.length >= maxTasks) break;
    }

    return { data: created };
  },
}));
