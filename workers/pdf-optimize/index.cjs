'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const PgBoss = require('pg-boss');

const QUEUE = 'pdf-optimize';
const DATABASE_URL = process.env.DATABASE_URL;
const DIRECTUS_URL = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';
const SWEEP_MS = Math.max(30_000, Number(process.env.PDF_OPTIMIZE_SWEEP_MS || 120_000));

function isPdfSlot(fileLike) {
  if (!fileLike || typeof fileLike !== 'object') return false;
  const mime = fileLike.mime_type;
  const name = fileLike.filename || '';
  return mime === 'application/pdf' || /\.pdf$/i.test(String(name));
}

function needsOptimization(slot) {
  if (!slot || typeof slot !== 'object') return false;
  if (!isPdfSlot(slot.file)) return false;
  if (slot.optimization_status === 'skipped') return false;
  if (slot.optimization_status === 'processing') return false;
  if (slot.optimization_status === 'ready' && slot.optimized_file && slot.optimized_file.id) return false;
  return true;
}

async function dReq(path, init = {}) {
  const headers = {
    ...(init.headers || {}),
    'content-type': 'application/json',
  };
  if (DIRECTUS_TOKEN) headers.authorization = `Bearer ${DIRECTUS_TOKEN}`;
  const res = await fetch(`${DIRECTUS_URL}${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Directus ${init.method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 500)}`);
    throw err;
  }
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return null;
}

async function listPublishedDocumentsPage(offset, limit) {
  const search = new URLSearchParams({
    fields: 'id,files',
    'filter[status][_eq]': 'published',
    limit: String(limit),
    offset: String(offset),
    sort: 'id',
  });
  const raw = await dReq(`/items/documents?${search.toString()}`);
  const data = raw && raw.data ? raw.data : [];
  return Array.isArray(data) ? data : [];
}

async function fetchDocument(docId) {
  const raw = await dReq(`/items/documents/${encodeURIComponent(docId)}?fields=id,files`);
  return raw?.data ?? null;
}

async function patchDocumentFiles(docId, filesArray) {
  await dReq(`/items/documents/${encodeURIComponent(docId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: filesArray }),
  });
}

async function downloadPdfBuffer(url) {
  const headers = {};
  if (DIRECTUS_TOKEN) headers.authorization = `Bearer ${DIRECTUS_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${await res.text()}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function uploadPdfDerived(buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'application/pdf' }), filename || 'optimized.pdf');

  const headers = {};
  if (DIRECTUS_TOKEN) headers.authorization = `Bearer ${DIRECTUS_TOKEN}`;

  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST',
    headers,
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /files failed ${res.status}: ${text}`);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  const id = json?.data?.id;
  if (!id) throw new Error('Upload returned no id');
  return {
    id: String(id),
    filename: json?.data?.filename_download || filename || 'optimized.pdf',
  };
}

function runQpdf(inPath, outPath) {
  const r = spawnSync('qpdf', ['--stream-data=compress', inPath, outPath], { encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `qpdf exit ${r.status}`);
  }
}

async function processJob(data) {
  const { documentId, slotIndex } = data;
  if (!documentId || typeof slotIndex !== 'number') return;

  const doc = await fetchDocument(documentId);
  if (!doc) return;
  const files = Array.isArray(doc.files) ? [...doc.files] : [];
  const slot = files[slotIndex];
  if (!needsOptimization(slot)) return;

  const next = { ...slot, optimization_status: 'processing', optimization_error: null };
  files[slotIndex] = next;
  await patchDocumentFiles(documentId, files);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-opt-'));
  const inPath = path.join(tmp, 'in.pdf');
  const outPath = path.join(tmp, 'out.pdf');
  try {
    const originalUrl = slot.file.url;
    const buf = await downloadPdfBuffer(originalUrl);
    fs.writeFileSync(inPath, buf);
    runQpdf(inPath, outPath);
    const outBuf = fs.readFileSync(outPath);
    const baseName = `${(slot.file.filename || 'document').replace(/\.pdf$/i, '')}-optimized.pdf`;
    const uploaded = await uploadPdfDerived(outBuf, baseName);
    const url = `${DIRECTUS_URL}/assets/${uploaded.id}`;
    const fresh = await fetchDocument(documentId);
    const f2 = Array.isArray(fresh?.files) ? [...fresh.files] : files;
    const s2 = { ...f2[slotIndex] };
    s2.optimization_status = 'ready';
    s2.optimization_error = null;
    s2.optimized_at = new Date().toISOString();
    s2.optimized_file = {
      id: uploaded.id,
      url,
      filename: uploaded.filename,
      mime_type: 'application/pdf',
    };
    f2[slotIndex] = s2;
    await patchDocumentFiles(documentId, f2);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const fresh = await fetchDocument(documentId);
    const f2 = Array.isArray(fresh?.files) ? [...fresh.files] : files;
    const s2 = { ...f2[slotIndex] };
    s2.optimization_status = 'failed';
    s2.optimization_error = msg.slice(0, 500);
    f2[slotIndex] = s2;
    try {
      await patchDocumentFiles(documentId, f2);
    } catch {
      // best-effort
    }
    throw e;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function sweep(boss) {
  const limit = 100;
  let offset = 0;
  for (;;) {
    const page = await listPublishedDocumentsPage(offset, limit);
    if (!page.length) break;
    for (const doc of page) {
      const files = Array.isArray(doc.files) ? doc.files : [];
      for (let i = 0; i < files.length; i++) {
        if (!needsOptimization(files[i])) continue;
        try {
          await boss.send(QUEUE, { documentId: doc.id, slotIndex: i }, {
            singletonKey: `${doc.id}:${i}`,
            singletonSeconds: 3600,
          });
        } catch {
          // duplicate singleton / transient — ignore
        }
      }
    }
    offset += page.length;
    if (page.length < limit) break;
  }
}

async function main() {
  if (!DATABASE_URL) {
    console.error('pdf-optimize-worker: DATABASE_URL is required');
    process.exit(1);
  }
  if (!DIRECTUS_URL) {
    console.error('pdf-optimize-worker: DIRECTUS_URL is required');
    process.exit(1);
  }
  if (!DIRECTUS_TOKEN) {
    console.error(
      'pdf-optimize-worker: DIRECTUS_TOKEN is required (static token on a user with documents update + files create)',
    );
    process.exit(1);
  }

  const boss = new PgBoss({ connectionString: DATABASE_URL });
  boss.on('error', (err) => console.error('pg-boss error', err));
  await boss.start();
  await boss.createQueue(QUEUE);

  await boss.work(QUEUE, { batchSize: 1, localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) {
      try {
        await processJob(job.data || {});
      } catch (err) {
        console.error(`Job ${job.id} failed`, err);
      }
    }
  });

  console.log(`pdf-optimize-worker up; sweeping every ${SWEEP_MS}ms`);
  await sweep(boss);
  setInterval(() => {
    sweep(boss).catch((e) => console.error('sweep failed', e));
  }, SWEEP_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
