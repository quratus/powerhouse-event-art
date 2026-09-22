import { list, put } from '@vercel/blob';
import { parseJsonLines } from './waitlist-entry.js';

export const WAITLIST_BLOB_PATH = 'powerhouse/waitlist.jsonl';

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || null;
}

async function readBlobText(blob, token) {
  const url = blob.downloadUrl || blob.url;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`leads blob download failed: ${res.status}`);
  }
  return res.text();
}

export async function appendLeadRecord(entry) {
  const token = blobToken();
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN not configured');
  }

  const line = `${JSON.stringify(entry)}\n`;
  const { blobs } = await list({ prefix: WAITLIST_BLOB_PATH, limit: 20, token });
  const existing = blobs.find((blob) => blob.pathname === WAITLIST_BLOB_PATH);

  let body = line;
  if (existing) {
    body = `${await readBlobText(existing, token)}${line}`;
  }

  await put(WAITLIST_BLOB_PATH, body, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/x-ndjson',
    token,
  });
}

export async function readLeadRecords() {
  const token = blobToken();
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN not configured');
  }

  const { blobs } = await list({ prefix: WAITLIST_BLOB_PATH, limit: 20, token });
  const existing = blobs.find((blob) => blob.pathname === WAITLIST_BLOB_PATH);
  if (!existing) return [];
  return parseJsonLines(await readBlobText(existing, token));
}
