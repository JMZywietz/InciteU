/**
 * Shared helpers for /api/sessions/mm/* endpoints.
 * All MM session data lives in Redis under the mm: namespace.
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

export const redis = Redis.fromEnv();
export const TTL = 60 * 60 * 24 * 180;

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
  const keys = [
    `mm:${code}:config`,
    `mm:${code}:evals`,
    `mm:${code}:self`,
    `mm:${code}:report`,
  ];
  await Promise.allSettled(keys.map(k => redis.expire(k, TTL)));
}

export function isSubject(req, config) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  return sha256(auth.slice(7).trim()) === config.subjectTokenHash;
}
export function findEvaluatorByToken(evals, token) {
  if (!token) return null;
  return evals.find(e => e.inviteToken === token) || null;
}

const FROM = process.env.RESEND_FROM || 'Many Mirrors <noreply@inciteu.com>';

export async function sendInviteEmail({ toEmail, toName, subjectName, inviteURL}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn('RESEND_API_KEY not set'); return; }
  const firstName = (subjectName || '').trim().split(/\s+/)[0] || subjectName;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#142B5C"><div style="max-width:600px;margin:0 auto;padding:48px 32px;color:#F0EBDB"><p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#E8D9A8">Many Mirrors</p><h1 style="font-size:28px;font-weight:400;color:#F0EBDB">${escHtml(firstName)} is asking for your honest feedback</h1><p>Hi ${escHtml(toName || 'there')},</p><p>${escHtml(subjectName)} is doing a Many Mirrors session and has asked you to be one of the people who reflects back what you see.</p><p>You'll answer six short questions (10-15 minutes). <strong>Your responses will be anonymous to ${escHtml(firstName)}.</strong></p><a href="${inviteURL}" style="display:inline-block;padding:14px 32px;background:#E8D9A8;color:#142B5C;text-decoration:none">Begin →</a><p style="font-size:12px;color:#9E9C97">This is a one-time email. We don't store your email after sending.</p></div></body></html>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to: [toEmail], subject: `${subjectName} is asking for your honest feedback`, html }),
  });
  if (!r.ok) { const t = await r.text(); console.error('Resend error:', t.slice(0,300)); }
}

function escHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}