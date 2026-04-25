/**
 * Upload a PDF buffer to Directus (`POST /files`). Requires DIRECTUS_URL and
 * DIRECTUS_TOKEN on the server.
 */

export async function uploadPdfBufferToDirectus(
  buffer: ArrayBuffer,
  filename: string,
): Promise<{ id: string }> {
  const base = process.env.DIRECTUS_URL?.replace(/\/$/, '');
  const token = process.env.DIRECTUS_TOKEN;
  if (!base || !token) {
    throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required for file upload');
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'application/pdf' }), filename || 'document.pdf');

  const res = await fetch(`${base}/files`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Directus file upload failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: { id?: string } };
  const id = json.data?.id;
  if (!id) {
    throw new Error('Directus file upload returned no file id');
  }
  return { id };
}
