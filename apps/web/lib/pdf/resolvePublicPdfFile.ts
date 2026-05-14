import type { DirectusFile, Document, DocumentFile, PublicPdfSource } from '@/types/directus';

export type PublicPdfResolution = {
  url: string;
  filename?: string;
  source: PublicPdfSource;
  embeddable: boolean;
  download: boolean;
  recordUrl?: string | null;
};

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
export function resolveDirectusPublicPdfFile(doc: Document, attachment: DocumentFile): DirectusFile {
  if (doc.pdf_public_display === 'original') return attachment.file;

  const derived = readyOptimizedFile(attachment);
  if (derived) return derived;

  return attachment.file;
}

/**
 * Public delivery policy for PDFs. Directus is always the safe fallback:
 * Zenodo fields are additive and never remove the local/offline copy.
 */
export function resolvePublicPdfFile(
  doc: Document,
  attachment: DocumentFile,
  source: PublicPdfSource = 'directus',
): PublicPdfResolution {
  const directus = resolveDirectusPublicPdfFile(doc, attachment);

  if (source === 'zenodo') {
    const zenodoFileUrl = attachment.zenodo_file_url?.trim();
    if (zenodoFileUrl) {
      return {
        url: zenodoFileUrl,
        filename: attachment.zenodo_file_key ?? directus.filename,
        source: 'zenodo',
        embeddable: true,
        download: false,
        recordUrl: doc.zenodo_record_url,
      };
    }

    const recordUrl = doc.zenodo_record_url?.trim();
    if (recordUrl) {
      return {
        url: recordUrl,
        filename: directus.filename,
        source: 'zenodo',
        embeddable: false,
        download: false,
        recordUrl,
      };
    }
  }

  return {
    url: directus.url,
    filename: directus.filename,
    source: 'directus',
    embeddable: true,
    download: true,
    recordUrl: doc.zenodo_record_url,
  };
}
