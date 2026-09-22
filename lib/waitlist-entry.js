const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTENTS = new Set(['waitlist', 'matchday0']);

export function normalizeEmail(raw) {
  const email = String(raw ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return null;
  return email;
}

export function normalizeIntent(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const intent = String(raw).trim().toLowerCase();
  if (!INTENTS.has(intent)) return undefined;
  return intent;
}

export function buildWaitlistEntry({ email, runtime, intent, at = new Date() }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { ok: false, error: 'email required' };
  }
  const entry = {
    email: normalizedEmail,
    runtime: String(runtime ?? '').trim(),
    brand: 'Powerhouse',
    at: at.toISOString(),
  };
  const normalizedIntent = normalizeIntent(intent);
  if (normalizedIntent) entry.intent = normalizedIntent;
  return { ok: true, entry };
}

export function parseJsonLines(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
