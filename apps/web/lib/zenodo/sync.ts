import { getDocumentById } from '@/lib/directus/documents';
import { getOpsSettings } from '@/lib/directus/opsSettings';
import type { Document, DocumentFile } from '@/types/directus';
import {
  createDeposition,
  editDeposition,
  getDeposition,
  publishDeposition,
  updateDepositionMetadata,
  uploadFileToBucket,
  zenodoEnabled,
  type ZenodoDeposition,
} from './client';
import { buildZenodoMetadata, zenodoMetadataHash } from './metadata';

export type ZenodoSyncResult = {
  ok: boolean;
  action: 'paused' | 'created' | 'metadata_updated' | 'unchanged' | 'failed';
  documentId: string;
  doi?: string | null;
  error?: string;
};

type DirectusPatch = Record<string, unknown>;

export async function syncDocumentToZenodo(documentId: string): Promise<ZenodoSyncResult> {
  const doc = await getDocumentById(documentId);
  if (!doc) return { ok: false, action: 'failed', documentId, error: 'Document not found' };

  const ops = await getOpsSettings();
  if (ops.public_pdf_source === 'directus') {
    await patchDocument(doc.id, { zenodo_sync_status: 'paused' });
    return { ok: true, action: 'paused', documentId: doc.id, doi: doc.zenodo_doi };
  }

  if (!zenodoEnabled()) {
    return fail(doc, 'ZENODO_ACCESS_TOKEN is not set');
  }

  try {
    if (doc.zenodo_sync_status === 'published' && doc.zenodo_deposition_id) {
      return await syncPublishedMetadata(doc);
    }
    return await publishNewDocument(doc);
  } catch (error) {
    return fail(doc, error instanceof Error ? error.message : 'Zenodo sync failed');
  }
}

async function publishNewDocument(doc: Document): Promise<ZenodoSyncResult> {
  await patchDocument(doc.id, { zenodo_sync_status: 'draft', zenodo_sync_error: null });
  const deposition = await createDeposition();
  const depositionId = String(deposition.id);
  await patchDocument(doc.id, {
    zenodo_deposition_id: depositionId,
    zenodo_concept_recid: deposition.conceptrecid ? String(deposition.conceptrecid) : null,
  });

  if (!deposition.links.bucket) throw new Error('Zenodo deposition did not return a bucket URL');

  await patchDocument(doc.id, { zenodo_sync_status: 'uploading' });
  const uploadedFiles = await uploadDocumentFiles(doc, deposition.links.bucket);
  const metadataHash = zenodoMetadataHash(doc);

  await updateDepositionMetadata(depositionId, buildZenodoMetadata(doc));
  const published = await publishDeposition(depositionId);
  const recordId = recordIdFromDeposition(published);
  const recordUrl = recordUrlFromDeposition(published);
  const doi = published.doi ?? doiFromDoiUrl(published.doi_url) ?? null;

  await patchDocument(doc.id, {
    zenodo_doi: doi,
    zenodo_record_id: recordId,
    zenodo_record_url: recordUrl,
    zenodo_deposition_id: String(published.id ?? depositionId),
    zenodo_concept_recid: published.conceptrecid ? String(published.conceptrecid) : doc.zenodo_concept_recid ?? null,
    zenodo_sync_status: 'published',
    zenodo_synced_at: new Date().toISOString(),
    zenodo_metadata_synced_at: new Date().toISOString(),
    zenodo_metadata_hash: metadataHash,
    zenodo_sync_error: null,
    files: withZenodoFileUrls(doc.files, uploadedFiles, recordId),
  });

  return { ok: true, action: 'created', documentId: doc.id, doi };
}

async function syncPublishedMetadata(doc: Document): Promise<ZenodoSyncResult> {
  const nextHash = zenodoMetadataHash(doc);
  if (doc.zenodo_metadata_hash === nextHash) {
    return { ok: true, action: 'unchanged', documentId: doc.id, doi: doc.zenodo_doi };
  }

  const depositionId = doc.zenodo_deposition_id!;
  let editable: ZenodoDeposition;
  try {
    editable = await editDeposition(depositionId);
  } catch {
    editable = await getDeposition(depositionId);
  }

  const draftId = editable.links.latest_draft ? idFromUrl(editable.links.latest_draft) : String(editable.id ?? depositionId);
  await updateDepositionMetadata(draftId, buildZenodoMetadata(doc));
  await publishDeposition(draftId);
  await patchDocument(doc.id, {
    zenodo_sync_status: 'published',
    zenodo_metadata_synced_at: new Date().toISOString(),
    zenodo_metadata_hash: nextHash,
    zenodo_sync_error: null,
  });

  return { ok: true, action: 'metadata_updated', documentId: doc.id, doi: doc.zenodo_doi };
}

async function uploadDocumentFiles(doc: Document, bucketUrl: string) {
  const uploaded: Array<{ slotId: string; key: string; checksum?: string }> = [];
  for (const slot of doc.files) {
    const filename = slot.file.filename || `${doc.id}-${slot.kind}.pdf`;
    const buffer = await fetchDirectusFile(slot.file.url);
    const result = await uploadFileToBucket(bucketUrl, filename, buffer);
    uploaded.push({ slotId: slot.id, key: result.key || filename, checksum: result.checksum });
  }
  return uploaded;
}

async function fetchDirectusFile(url: string): Promise<ArrayBuffer> {
  const directusBase = process.env.DIRECTUS_URL?.replace(/\/$/, '');
  const absolute = url.startsWith('http') ? url : `${directusBase ?? ''}${url.startsWith('/') ? url : `/${url}`}`;
  const res = await fetch(absolute, {
    headers: process.env.DIRECTUS_TOKEN ? { authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Directus PDF download failed: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}

function withZenodoFileUrls(
  files: DocumentFile[],
  uploaded: Array<{ slotId: string; key: string; checksum?: string }>,
  recordId: string | null,
): DocumentFile[] {
  const bySlot = new Map(uploaded.map((f) => [f.slotId, f]));
  return files.map((slot) => {
    const file = bySlot.get(slot.id);
    if (!file) return slot;
    return {
      ...slot,
      zenodo_file_key: file.key,
      zenodo_file_checksum: file.checksum ?? null,
      zenodo_file_url: recordId ? zenodoPublicFileUrl(recordId, file.key) : slot.zenodo_file_url ?? null,
    };
  });
}

async function patchDocument(id: string, payload: DirectusPatch): Promise<void> {
  const base = process.env.DIRECTUS_URL?.replace(/\/$/, '');
  const token = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;
  if (!base || !token) throw new Error('DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN/DIRECTUS_TOKEN are required');
  const res = await fetch(`${base}/items/documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Directus document patch failed: ${res.status} ${await res.text()}`);
}

async function fail(doc: Document, error: string): Promise<ZenodoSyncResult> {
  try {
    await patchDocument(doc.id, { zenodo_sync_status: 'failed', zenodo_sync_error: error });
  } catch {
    // Preserve the original Zenodo error for the caller.
  }
  return { ok: false, action: 'failed', documentId: doc.id, doi: doc.zenodo_doi, error };
}

function recordIdFromDeposition(dep: ZenodoDeposition): string | null {
  return dep.record_id ? String(dep.record_id) : dep.id ? String(dep.id) : null;
}

function recordUrlFromDeposition(dep: ZenodoDeposition): string | null {
  if (dep.doi_url) return dep.doi_url;
  const recordId = recordIdFromDeposition(dep);
  return recordId ? `${zenodoWebBaseUrl()}/records/${recordId}` : dep.links.html ?? null;
}

function zenodoPublicFileUrl(recordId: string, key: string): string {
  return `${zenodoWebBaseUrl()}/records/${encodeURIComponent(recordId)}/files/${encodeURIComponent(key)}`;
}

function zenodoWebBaseUrl(): string {
  return (process.env.ZENODO_WEB_BASE_URL || (process.env.ZENODO_API_BASE_URL || 'https://zenodo.org/api').replace(/\/api\/?$/, '')).replace(
    /\/$/,
    '',
  );
}

function doiFromDoiUrl(url?: string): string | null {
  if (!url) return null;
  const marker = 'doi.org/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

function idFromUrl(url: string): string {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? url;
}
