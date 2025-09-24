export async function editMessage(params: { baseUrl: string; token: string; messageId: string; content: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/${params.messageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({ content: params.content }),
  });
  if (!res.ok) throw new Error(`Edit failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean; message: { id: string; content: string; isEdited: boolean; editedAt: string } }>;
}

export async function unsendMessage(params: { baseUrl: string; token: string; messageId: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/${params.messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean }>;
}

export async function listRecentlyDeleted(params: { baseUrl: string; token: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/recently-deleted`, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean; items: Array<any> }>;
}

export async function restoreMessage(params: { baseUrl: string; token: string; messageId: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/${params.messageId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) throw new Error(`Restore failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean }>;
}

export async function permanentDeleteMessage(params: { baseUrl: string; token: string; messageId: string }) {
  const res = await fetch(`${params.baseUrl}/api/messages/${params.messageId}/permanent-delete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) throw new Error(`Permanent delete failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ success: boolean }>;
}
