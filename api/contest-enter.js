import { readJsonBody, sendJson } from '../lib/http.js';
import { normalizeEmail } from '../lib/waitlist-entry.js';
import { appendLeadRecord } from '../lib/leads-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  const data = await readJsonBody(req);
  const email = normalizeEmail(data.email);
  const handle = String(data.handle || '').trim();
  const repo = String(data.repo || '').trim();
  const runtime = String(data.runtime || '').trim();

  if (!email) {
    return sendJson(res, 400, { ok: false, error: 'email required' });
  }
  if (!handle || handle.length < 2) {
    return sendJson(res, 400, { ok: false, error: 'handle required' });
  }

  const entry = {
    kind: 'PGC-0-ENTER',
    matchday: 'PGC-0',
    brand: 'Powerhouse',
    email,
    handle,
    repo,
    runtime,
    status: 'REGISTERED_PREP',
    at: new Date().toISOString(),
  };

  console.log('POWERHOUSE_CONTEST_ENTER', JSON.stringify(entry));

  const hook = process.env.CONTEST_ENTER_WEBHOOK_URL || process.env.WAITLIST_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('contest enter webhook failed', error);
    }
  }

  try {
    await appendLeadRecord(entry);
  } catch (error) {
    console.error('contest enter storage failed', error);
    // ENTERABLE must not hard-fail on Blob — log + still register prep
  }

  return sendJson(res, 200, {
    ok: true,
    matchday: 'PGC-0',
    status: 'REGISTERED_PREP',
    next: 'Prep STACK.yaml + verify bundle. Hammer date posts on Matchday page when Julius locks it.',
  });
}
