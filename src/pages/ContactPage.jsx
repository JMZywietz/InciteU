import React, { useState } from 'react';
import { C, F } from '../theme.js';
import { btn, btnHoverIn, btnHoverOut, heading, fieldLabel, fieldInput } from '../styles.js';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);

  function submit(e) {
    e.preventDefault();
    const FORMSPREE = 'https://formspree.io/f/REPLACE_WITH_YOUR_ID';
    if (FORMSPREE.includes('REPLACE_WITH')) {
      const subject = encodeURIComponent(`Message from ${name} via inciteu.com`);
      const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:jen@inciteu.com?subject=${subject}&body=${body}`;
      setStatus('Opening your email client to send.');
      setStatusError(false);
      return;
    }
    setStatus('Sending…');
    setStatusError(false);
    fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    }).then((res) => {
      if (res.ok) { setStatus("Thank you. I'll be in touch soon."); setName(''); setEmail(''); setMessage(''); }
      else throw new Error('failed');
    }).catch(() => { setStatus('Something went wrong. Please email jen@inciteu.com directly.'); setStatusError(true); });
  }

  return (
    <main style={{ animation: 'fadeIn 0.4s ease', minHeight: '80vh', padding: '80px 6vw', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ ...heading(72), fontSize: 'clamp(40px, 6vw, 72px)', marginBottom: 20 }}>
          Get in <em style={{ color: C.sage, fontStyle: 'italic' }}>touch</em>.
        </h1>
        <p style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 1.5, color: C.creamMuted, maxWidth: 540, margin: '0 auto' }}>
          For coaching, facilitation, speaking — or just to say hello.
        </p>
      </div>
      <form onSubmit={submit} style={{ background: C.bgCard, borderRadius: 4, padding: '44px 44px 36px', marginBottom: 36 }}>
        <div style={{ marginBottom: 22 }}>
          <label style={fieldLabel}>Your name</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={fieldLabel}>Your email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={fieldInput} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={fieldLabel}>What's on your mind?</label>
          <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...fieldInput, minHeight: 100 }} />
        </div>
        <button type="submit" style={btn('primary')} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>Send</button>
        <div style={{ fontSize: 14, color: statusError ? C.warning : C.sage, marginTop: 16, minHeight: 20 }}>{status}</div>
      </form>
      <div style={{ textAlign: 'center', padding: 24, color: C.creamMuted, fontSize: 15 }}>
        Or just email
        <a href="mailto:jen@inciteu.com" style={{ color: C.sage, textDecoration: 'none', fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, marginLeft: 6 }}>jen@inciteu.com</a>
      </div>
    </main>
  );
}
