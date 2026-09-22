import { authorizeDump, sendJson } from '../lib/http.js';
import { readLeadRecords } from '../lib/leads-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end('Method Not Allowed');
  }

  if (!authorizeDump(req)) {
    return sendJson(res, 401, { ok: false, error: 'unauthorized' });
  }

  try {
    const records = await readLeadRecords();
    const url = new URL(req.url, 'http://localhost');
    const format = url.searchParams.get('format') || 'summary';

    if (format === 'jsonl') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/x-ndjson');
      res.end(`${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
      return;
    }

    const byKind = records.reduce((acc, record) => {
      const key = record.kind || (record.intent ? `waitlist:${record.intent}` : 'waitlist');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return sendJson(res, 200, {
      ok: true,
      brand: 'Powerhouse',
      count: records.length,
      byKind,
      latestAt: records.length ? records[records.length - 1].at : null,
    });
  } catch (error) {
    console.error('waitlist dump failed', error);
    return sendJson(res, 503, { ok: false, error: 'storage unavailable' });
  }
}
