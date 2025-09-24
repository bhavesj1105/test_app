import { Message } from '../entities';

export interface ISummarizer {
  summarize(messages: Pick<Message, 'content' | 'senderId' | 'createdAt'>[], opts?: { maxWords?: number }): Promise<{ summary: string; modelVersion?: string }>;
}

class LocalSummarizer implements ISummarizer {
  async summarize(messages: Pick<Message, 'content' | 'senderId' | 'createdAt'>[], opts?: { maxWords?: number }) {
    const maxWords = opts?.maxWords ?? 60;
    const text = messages
      .slice(-50)
      .map((m) => m.content)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text.split(' ').slice(0, maxWords).join(' ');
    const summary = words + (text.split(' ').length > maxWords ? '…' : '');
    return { summary, modelVersion: 'local/v1' };
  }
}

class ExternalLLMSummarizer implements ISummarizer {
  constructor(private apiKey: string, private model: string) {
    // placeholder to acknowledge apiKey usage (avoid unused var lint). In real impl, init SDK with apiKey.
    void this.apiKey;
  }
  async summarize(messages: Pick<Message, 'content' | 'senderId' | 'createdAt'>[], opts?: { maxWords?: number }) {
    // Placeholder: integrate your preferred LLM SDK here.
    // For now, fallback to LocalSummarizer behavior with model tag.
    const local = new LocalSummarizer();
    const result = await local.summarize(messages, opts);
    return { ...result, modelVersion: this.model };
  }
}

export function createSummarizer(): ISummarizer {
  const provider = process.env.SUMMARIZER_PROVIDER || 'local';
  if (provider === 'external' && process.env.LLM_API_KEY && process.env.LLM_MODEL) {
    return new ExternalLLMSummarizer(process.env.LLM_API_KEY, process.env.LLM_MODEL);
  }
  return new LocalSummarizer();
}
