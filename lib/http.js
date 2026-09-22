export async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    return JSON.parse(body || '{}');
  } catch {
    return {};
  }
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function authorizeDump(req) {
  const secret = process.env.WAITLIST_DUMP_SECRET;
  if (!secret) return false;
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const query = req.url?.includes('?')
    ? new URL(req.url, 'http://localhost').searchParams.get('secret')
    : null;
  return bearer === secret || query === secret;
}
