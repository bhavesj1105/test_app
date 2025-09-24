import { Platform } from 'react-native';

export interface PinChatParams {
  baseUrl: string;
  token: string;
  chatId: string;
}

const api = (baseUrl: string) => `${baseUrl.replace(/\/$/, '')}/api`;

export async function pinChat({ baseUrl, token, chatId }: PinChatParams) {
  const res = await fetch(`${api(baseUrl)}/chats/${encodeURIComponent(chatId)}/pin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to pin chat');
  return res.json();
}

export async function unpinChat({ baseUrl, token, chatId }: PinChatParams) {
  const res = await fetch(`${api(baseUrl)}/chats/${encodeURIComponent(chatId)}/pin`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to unpin chat');
  return res.json();
}

export interface GetChatsParams { baseUrl: string; token: string; page?: number; limit?: number }
export async function getChats({ baseUrl, token, page = 1, limit = 20 }: GetChatsParams) {
  const res = await fetch(`${api(baseUrl)}/chats?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to get chats');
  return res.json();
}
