// Records the client's IP for the attendance record (informational only — no IP-based blocking).
const normalize = (ip = '') => ip.replace(/^::ffff:/, '');

export function resolveClientIp(req, _res, next) {
  req.clientIp = normalize(req.ip);
  next();
}
