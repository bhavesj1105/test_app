export async function getSummary(params: { baseUrl: string; token: string; chatId: string }) {
  const res = await fetch(`${params.baseUrl}/api/summarize/${params.chatId}`, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) throw new Error(`Get summary failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: true; summary: null | { text: string; createdAt: string; modelVersion?: string } }>;
}

export async function refreshSummary(params: { baseUrl: string; token: string; chatId: string; limit?: number; queue?: boolean }) {
  const res = await fetch(`${params.baseUrl}/api/summarize/${params.chatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({ limit: params.limit ?? 100, mode: params.queue ? 'queue' : 'inline' }),
  });
  if (!res.ok) throw new Error(`Refresh summary failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean; queued: boolean; summary?: { text: string; createdAt: string; modelVersion?: string } | null }>;
}
