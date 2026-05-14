import type { ZenodoMetadataPayload } from './metadata';

type ZenodoLinks = {
  bucket?: string;
  self?: string;
  latest_draft?: string;
  publish?: string;
  edit?: string;
  html?: string;
};

export type ZenodoDeposition = {
  id: number;
  conceptrecid?: string;
  record_id?: number;
  doi?: string;
  doi_url?: string;
  record_url?: string;
  submitted?: boolean;
  state?: string;
  links: ZenodoLinks;
  files?: Array<{
    id?: string;
    filename?: string;
    key?: string;
    checksum?: string;
    filesize?: number;
    size?: number;
    links?: { self?: string };
  }>;
};

export type ZenodoUploadedFile = {
  key: string;
  checksum?: string;
  size?: number;
  links?: { self?: string };
};

export function zenodoEnabled(): boolean {
  return Boolean(process.env.ZENODO_ACCESS_TOKEN?.trim());
}

function zenodoBaseUrl(): string {
  return (process.env.ZENODO_API_BASE_URL || 'https://zenodo.org/api').replace(/\/$/, '');
}

function zenodoToken(): string {
  const token = process.env.ZENODO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('ZENODO_ACCESS_TOKEN is not set');
  return token;
}

async function zenodoRequest<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${zenodoBaseUrl()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${zenodoToken()}`,
      ...(init?.body && !(init.body instanceof Blob) ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers as Record<string, string>),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Zenodo ${url}: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function createDeposition(): Promise<ZenodoDeposition> {
  return zenodoRequest<ZenodoDeposition>('/deposit/depositions', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getDeposition(id: string): Promise<ZenodoDeposition> {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${encodeURIComponent(id)}`);
}

export async function updateDepositionMetadata(id: string, metadata: ZenodoMetadataPayload): Promise<ZenodoDeposition> {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ metadata }),
  });
}

export async function publishDeposition(id: string): Promise<ZenodoDeposition> {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${encodeURIComponent(id)}/actions/publish`, {
    method: 'POST',
  });
}

export async function editDeposition(id: string): Promise<ZenodoDeposition> {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${encodeURIComponent(id)}/actions/edit`, {
    method: 'POST',
  });
}

export async function uploadFileToBucket(
  bucketUrl: string,
  filename: string,
  body: ArrayBuffer,
): Promise<ZenodoUploadedFile> {
  const safeFilename = encodeURIComponent(filename || 'document.pdf');
  return zenodoRequest<ZenodoUploadedFile>(`${bucketUrl.replace(/\/$/, '')}/${safeFilename}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/pdf' },
    body,
  });
}
