import { readJsonBody, sendJson } from '../lib/http.js';
import { buildWaitlistEntry } from '../lib/waitlist-entry.js';
import { appendLeadRecord } from '../lib/leads-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  const data = await readJsonBody(req);
  const built = buildWaitlistEntry({
    email: data.email,
    runtime: data.runtime,
    intent: data.intent,
  });
  if (!built.ok) {
    return sendJson(res, 400, { ok: false, error: built.error });
  }

  console.log('POWERHOUSE_WAITLIST', JSON.stringify(built.entry));

  const hook = process.env.WAITLIST_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(built.entry),
      });
    } catch (error) {
      console.error('waitlist webhook failed', error);
    }
  }

  try {
    await appendLeadRecord(built.entry);
  } catch (error) {
    console.error('waitlist storage failed', error);
    // Still accept signup even if Blob write fails (log remains)
  }

  return sendJson(res, 200, { ok: true });
}
