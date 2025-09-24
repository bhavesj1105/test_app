import { AppDataSource } from '../config/database';
import { Chat, Message, ChatSummary } from '../entities';
import { createSummarizer } from './summarizer';

type JobData = { chatId: string; limit?: number };

// Optional BullMQ worker (requires ioredis + bullmq). Fallback to inline if no REDIS_URL.
let enqueue: (data: JobData) => Promise<void> = async (data) => {
  await processJob(data); // inline fallback
};

export async function setupSummaryWorker(): Promise<void> {
  if (!process.env.REDIS_URL) return; // no queue
  try {
    const { Queue, Worker } = require('bullmq');
    const connection = { connection: { url: process.env.REDIS_URL } };
    const queue = new Queue('chat-summary', connection);
    enqueue = async (data: JobData) => { await queue.add('summarize', data, { removeOnComplete: true, removeOnFail: true }); };
    new Worker('chat-summary', async (job: any) => processJob(job.data), connection);
  } catch (e) {
    console.warn('BullMQ not available; running summaries inline.', e);
  }
}

export async function enqueueSummary(chatId: string, limit = 100): Promise<void> {
  return enqueue({ chatId, limit });
}

export async function processJob({ chatId, limit = 100 }: JobData): Promise<{ summaryId: string }> {
  const messageRepo = AppDataSource.getRepository(Message);
  const summaryRepo = AppDataSource.getRepository(ChatSummary);
  const chatRepo = AppDataSource.getRepository(Chat);
  const chat = await chatRepo.findOne({ where: { id: chatId } });
  if (!chat) throw new Error('Chat not found');

  const messages = await messageRepo.find({ where: { chatId }, order: { createdAt: 'DESC' }, take: limit });
  const summarizer = createSummarizer();
  const result = await summarizer.summarize(messages.map(m => ({ content: m.content, senderId: m.senderId, createdAt: m.createdAt })), { maxWords: 60 });
  const modelVersion = result.modelVersion ?? null;
  const entity = summaryRepo.create({ chatId, summaryText: result.summary, modelVersion });
  const saved = await summaryRepo.save(entity);
  return { summaryId: saved.id };
}
