/**
 * Shared helpers for /api/sessions/mm/* endpoints.
 * All MM session data lives in Redis under the mm: namespace.
 *
 * Redis key schema
 * ─────────────────
 * mm:{CODE}:config                  JSON — session config incl. subjectTokenHash
 * mm:{CODE}:evals                   JSON array — evaluator records (incl. inviteToken)
 * mm:{CODE}:response:{evalId}       JSON — that evaluator's answers
 * mm:{CODE}:self                    JSON — subject's self-survey answers
 * mm:{CODE}:report                  JSON — generated synthesis report
 * mm:{CODE}:rtok:{sha256(token)}    "1"  — marks a valid results-link token
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

export const redis = Redis.fromEnv();
export const TTL = 60 * 60 * 24 * 180; // 180 days in seconds

// ── Token helpers ────────────────────────────────────────────────────────────
export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
export function randomToken() {
  return crypto.randomBytes(24).toString('hex');
}
export function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// ── Redis helpers ────────────────────────────────────────────────────────────
export async function loadConfig(code) {
  const raw = await redis.get(`mm:${code}:config`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
export async function loadEvals(code) {
  const raw = await redis.get(`mm:${code}:evals`);
  if (!raw) return [];
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
export async function saveEvals(code, evals) {
  await redis.set(`mm:${code}:evals`, JSON.stringify(evals), { ex: TTL });
}
export async function refreshTTL(code) {
  // Refresh TTL on all live keys so active sessions don't expire mid-use
  const keys = [
    `mm:${code}:config`,
    `mm:${code}:evals`,
    `mm:${code}:self`,
    `mm:${code}:report`,
  ];
  await Promise.allSettled(keys.map(k => redis.expire(k, TTL)));
}

// ── Auth ──────────────────────────────────────────────────────────────────────
/** Returns true if the request carries a valid subject bearer token. */
export function isSubject(req, config) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  return sha256(auth.slice(7).trim()) === config.subjectTokenHash;
}
/** Finds the evaluator whose inviteToken matches the given raw token. */
export function findEvaluatorByToken(evals, token) {
  if (!token) return null;
  return evals.find(e => e.inviteToken === token) || null;
}

// ── Email (Resend) ───────────────────────────────────────────────────────────
const FROM = process.env.RESEND_FROM || 'Many Mirrors <noreply@inciteu.com>';

export async function sendInviteEmail({ toEmail, toName, subjectName, inviteURL }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return;
  }
  const firstName = (subjectName || '').trim().split(/\s+/)[0] || subjectName;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#142B5C;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;color:#F0EBDB;">
    <p style="font-family:-apple-system,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#E8D9A8;margin:0 0 32px;">Many Mirrors · InciteU</p>
    <h1 style="font-size:28px;font-weight:400;line-height:1.3;color:#F0EBDB;margin:0 0 28px;">${escHtml(firstName)} is asking for your honest feedback</h1>
    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Hi ${escHtml(toName || 'there')},</p>
    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">${escHtml(subjectName)} is doing a Many Mirrors session — a free 360-style reflection tool — and they've asked you to be one of the people who reflects back what you see.</p>
    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">You'll answer six short questions. It takes about 10–15 minutes. You can type or speak each answer.</p>
    <p style="font-size:16px;line-height:1.7;margin:0 0 32px;"><strong>Your responses will be anonymous to ${escHtml(firstName)}.</strong> They'll see a synthesis and a few selected quotes, lightly scrubbed of identifying detail. No individual response is shown and no quote is attributed.</p>
    <a href="${inviteURL}" style="display:inline-block;padding:14px 32px;background:#E8D9A8;color:#142B5C;text-decoration:none;font-family:-apple-system,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">Begin →</a>
    <p style="font-family:-apple-system,sans-serif;font-size:12px;color:#9E9C97;margin:48px 0 0;line-height:1.6;">This is a one-time email. We don't store your email address after sending.<br>If you did not expect this, you can ignore it.</p>
  </div>
</body>
</html>`.trim();

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: FROM,
      to: [toEmail],
      subject: `${subjectName} is asking for your honest feedback`,
      html,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    console.error('Resend error:', r.status, text.slice(0, 300));
  }
}

function escHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function sendDashboardLinkEmail({ toEmail, subjectName, dashboardURL }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn('RESEND_API_KEY not set — skipping dashboard link email'); return; }
  const firstName = (subjectName || '').trim().split(/\s+/)[0] || subjectName;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#142B5C;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;color:#F0EBDB;">
    <p style="font-family:-apple-system,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#E8D9A8;margin:0 0 32px;">Many Mirrors · InciteU</p>
    <h1 style="font-size:26px;font-weight:400;line-height:1.3;color:#F0EBDB;margin:0 0 24px;">Your Many Mirrors dashboard</h1>
    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Hi ${escHtml(firstName)},</p>
    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Your Many Mirrors session is live. Use the link below to check who has responded, take your self-survey, and generate your report when you're ready.</p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 32px;color:#B5A878;"><strong>Keep this email</strong> — it's the easiest way back to your dashboard. If your browser data is cleared you'll need it.</p>
    <a href="${dashboardURL}" style="display:inline-block;padding:14px 32px;background:#E8D9A8;color:#142B5C;text-decoration:none;font-family:-apple-system,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">Go to dashboard →</a>
    <p style="font-family:-apple-system,sans-serif;font-size:12px;color:#9E9C97;margin:48px 0 0;line-height:1.6;">You're receiving this because you created a Many Mirrors session on InciteU.</p>
  </div>
</body>
</html>`.trim();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to: [toEmail], subject: 'Your Many Mirrors dashboard link', html }),
  });
  if (!r.ok) { const text = await r.text(); console.error('Resend dashboard email error:', r.status, text.slice(0, 300)); }
}
