import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { fieldInput } from '../styles.js';

// ── Feather Icons thumbs (MIT licence) ────────────────────────────────────
function ThumbIcon({ up, color }) {
  const d = up
    ? 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zm-7 11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
    : 'M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round"
         style={{ width: 17, height: 17, display: 'block', flexShrink: 0 }}
         aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ============================================================================
// ToolFeedback — end-of-tool micro-survey
//
// Props:
//   formspreeId     — Formspree form ID (e.g. 'mzdwwygz')
//   toolName        — sent as hidden field; used to segment Formspree results
//   role            — 'subject' | 'evaluator' (also a hidden field)
//   initialQuestion — top-line prompt shown to user
//   positivePrompt  — follow-up text after thumbs-up
//   negativePrompt  — follow-up text after thumbs-down
//
// Renders nothing if formspreeId is missing or a placeholder.
// ============================================================================
export default function ToolFeedback({
  formspreeId,
  toolName,
  role = 'subject',
  initialQuestion = 'Did this tool help?',
  positivePrompt = 'What made it useful?',
  negativePrompt = 'What could have made it more useful?',
}) {
  const [vote, setVote] = useState(null);       // null | 'up' | 'down'
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!formspreeId || formspreeId.includes('REPLACE')) return null;

  const followUpPrompt = vote === 'up' ? positivePrompt : negativePrompt;

  function handleVote(v) {
    setVote(prev => (prev === v ? null : v));
    setComment('');
    setError('');
  }

  function handleSubmit() {
    if (!vote) return;
    setSubmitting(true);
    setError('');
    const payload = { tool: toolName, role, vote };
    if (comment.trim()) payload.comment = comment.trim();
    fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (res.ok) setSubmitted(true);
        else throw new Error('failed');
      })
      .catch(() => {
        setError('Something went wrong — please try again.');
        setSubmitting(false);
      });
  }

  if (submitted) {
    return (
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
        <p style={{
          fontFamily: F.sans, fontSize: 12, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.sage, margin: 0,
        }}>
          Thank you for the feedback.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
      <p style={{
        fontFamily: F.sans, fontSize: 12, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: C.creamMuted,
        marginTop: 0, marginBottom: 14,
      }}>
        {initialQuestion}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: vote ? 20 : 0 }}>
        {[{ v: 'up', label: 'Yes' }, { v: 'down', label: 'Not quite' }].map(({ v, label }) => {
          const active = vote === v;
          return (
            <button
              key={v}
              onClick={() => handleVote(v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: active ? 'rgba(197,212,155,0.10)' : 'transparent',
                border: `1px solid ${active ? C.sageMuted : C.line}`,
                borderRadius: 2,
                padding: '8px 16px',
                cursor: 'pointer',
                color: active ? C.sage : C.creamMuted,
                fontFamily: F.sans, fontSize: 12,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                transition: 'all 0.2s ease',
              }}
            >
              <ThumbIcon up={v === 'up'} color={active ? C.sage : C.creamMuted} />
              {label}
            </button>
          );
        })}
      </div>

      {vote && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <p style={{
            fontFamily: F.sans, fontSize: 12,
            color: C.creamMuted, marginTop: 0, marginBottom: 10,
          }}>
            {followUpPrompt}{' '}
            <span style={{ opacity: 0.55, fontStyle: 'italic', letterSpacing: 0, textTransform: 'none' }}>
              (optional)
            </span>
          </p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Your thoughts…"
            style={{
              ...fieldInput,
              fontSize: 14,
              background: 'rgba(240,235,219,0.04)',
              display: 'block',
              maxWidth: 520,
              marginBottom: 12,
            }}
          />
          {error && (
            <p style={{ fontFamily: F.sans, fontSize: 13, color: '#D88A7A', margin: '0 0 10px' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: 'transparent',
                border: `1px solid ${submitting ? C.line : C.sageMuted}`,
                borderRadius: 2,
                padding: '8px 20px',
                color: submitting ? C.creamMuted : C.sage,
                fontFamily: F.sans, fontSize: 12,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
            <button
              onClick={() => setSubmitted(true)}
              style={{
                background: 'none', border: 'none', padding: '8px 4px',
                color: C.creamMuted, fontFamily: F.sans, fontSize: 12,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', opacity: 0.5,
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
