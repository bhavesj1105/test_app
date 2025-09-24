export async function toggleReaction(params: { baseUrl: string; token: string; messageId: string; emoji: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/${params.messageId}/reaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({ emoji: params.emoji }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reaction failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ success: boolean; action: 'added'|'removed'; counts: Record<string, number> }>;
}
