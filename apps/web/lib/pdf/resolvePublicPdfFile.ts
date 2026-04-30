import type { DirectusFile, Document, DocumentFile } from '@/types/directus';

function readyOptimizedFile(attachment: DocumentFile): DirectusFile | null {
  if (attachment.optimization_status !== 'ready') return null;
  const o = attachment.optimized_file;
  if (!o || typeof o.id !== 'string' || typeof o.url !== 'string') return null;
  return o;
}

/**
 * Which `directus_files` row the public site should use for viewer + download
 * links, per documents.pdf_public_display (`auto` | `original` | `optimized`).
 */
export function resolvePublicPdfFile(doc: Document, attachment: DocumentFile): DirectusFile {
  if (doc.pdf_public_display === 'original') return attachment.file;

  const derived = readyOptimizedFile(attachment);
  if (derived) return derived;

  return attachment.file;
}
