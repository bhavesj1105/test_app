export async function uploadPoster(params: { baseUrl: string; token: string; posterUri: string; posterSvg?: string; posterTheme?: any }) {
  const form = new FormData();
  // Convert data URI or file URI to blob
  let file: any;
  if (params.posterUri.startsWith('data:')) {
    // RN fetch can handle data URIs
    const res = await fetch(params.posterUri);
    const blob = await res.blob();
    file = { uri: params.posterUri, name: 'poster.png', type: 'image/png' } as any;
  } else {
    file = { uri: params.posterUri, name: 'poster.png', type: 'image/png' } as any;
  }
  form.append('poster', file as any);
  if (params.posterSvg) form.append('posterSvg', params.posterSvg);
  if (params.posterTheme) form.append('posterTheme', JSON.stringify(params.posterTheme));

  const res = await fetch(`${params.baseUrl}/api/profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return res.json();
}
