/**
 * Client-side PDF text extraction via pdfjs-dist.
 *
 * Only text-layer extraction is handled here. Scanned / image-only PDFs
 * return an empty string, which the caller renders as an "abstract could
 * not be extracted" hint — the editor will fill it in on review.
 *
 * Runs exclusively on the client (pdfjs needs window/DOM). The worker is
 * loaded from the bundle to avoid remote CDN dependencies.
 */

export interface ExtractResult {
  text: string;
  numPages: number;
  warning?: string;
}

let workerConfigured = false;

async function ensureWorker(): Promise<void> {
  if (workerConfigured) return;
  const pdfjs = await import('pdfjs-dist');
  // @ts-expect-error — pdfjs-dist has no type for the worker module subpath.
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  workerConfigured = true;
}

export async function extractPdfText(file: File, maxPages = 30): Promise<ExtractResult> {
  await ensureWorker();
  const pdfjs = await import('pdfjs-dist');
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const parts: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item as { str?: string }).str ?? '')
      .join(' ');
    parts.push(pageText);
    if (parts.join(' ').split(/\s+/).length > 3000) break;
  }
  const text = parts.join('\n\n').trim();
  return {
    text,
    numPages: pdf.numPages,
    warning: text.length === 0 ? 'no_text_layer' : undefined,
  };
}
