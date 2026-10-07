import crypto from 'crypto';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map(); // ip -> { count, resetAt }

const digest = (v) => crypto.createHash('sha256').update(String(v)).digest();

export function adminAuth(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILS) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }

  const expected = process.env.ADMIN_KEY;
  const given = req.get('x-admin-key') || '';
  // Constant-time comparison of fixed-length hashes
  const ok = Boolean(expected) && crypto.timingSafeEqual(digest(given), digest(expected));

  if (!ok) {
    const cur = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    cur.count += 1;
    fails.set(ip, cur);
    return res.status(401).json({ message: 'Wrong password.' });
  }
  fails.delete(ip);
  next();
}
