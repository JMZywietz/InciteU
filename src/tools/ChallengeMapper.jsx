import React, { useState, useRef } from 'react';
import { C as baseC, F } from '../theme.js';
import { useAppNavigate } from '../lib/useAppNavigate.js';
import SEO from '../components/SEO.jsx';
import ToolFeedback from '../components/ToolFeedback.jsx';

const C = { ...baseC, creamMuted: 'rgba(240,235,219,0.55)', sageMuted: 'rgba(197,212,155,0.35)', warmAccent: '#E8C87A', alert: '#D4785C' };

const DOMAINS = [
  { key: 'clear', label: 'Clear', color: C.cream,
    hint: 'Known solution. Follow the process.',
    action: 'Delegate it, outsource it, or follow the checklist. The answer is known \u2014 just execute.',
    guidance: 'In Clear, cause and effect are obvious. Best practices exist. The risk here is overthinking: applying complex-domain tools to something that just needs doing. Trust the process. If it can be delegated or automated, do that. Free your attention for the parts that actually need it.' },
  { key: 'complicated', label: 'Complicated', color: C.warmAccent,
    hint: 'Solvable with expertise. Needs analysis.',
    action: 'Research it, consult an expert, or schedule focused time to analyze properly.',
    guidance: 'In Complicated, there IS a right answer \u2014 you just can\'t see it without expertise or analysis. This is where you bring in specialists, do the research, build the spreadsheet, run the numbers. Good practice, not best practice. Multiple right approaches exist. The risk: assuming expertise alone will solve something that\'s actually complex.' },
  { key: 'complex', label: 'Complex', color: C.sage,
    hint: 'No clear answer. Depends on people/behavior.',
    action: 'Design a small, safe-to-fail experiment. Probe, then sense what happens.',
    guidance: 'In Complex, cause and effect are only visible in retrospect. No amount of analysis will give you the answer in advance. Instead: run small experiments that are safe to fail. Watch what happens. Amplify what works, dampen what doesn\'t. The key is learning speed, not planning precision. The risk: trying to analyze your way through when you need to experiment.' },
  { key: 'chaotic', label: 'Chaotic', color: C.alert,
    hint: 'No stability. Urgent action needed.',
    action: 'Find the most critical thing to stabilize and take one decisive step toward it.',
    guidance: 'In Chaotic, there is no cause and effect to discover \u2014 the system has no stability. Act first. Any action that creates stability is better than analysis. Once you\'ve stabilized, you can figure out which domain you\'re now in. The risk: freezing, or worse, treating chaos like a complicated problem that just needs more data.' },
];

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map(d => [d.key, d]));
const DOMAIN_ORDER = ['complex', 'complicated', 'chaotic', 'clear'];

const btnBase = { fontFamily: F.sans, fontSize: 14, fontWeight: 500, letterSpacing: '0.06em', padding: '14px 32px', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.3s ease' };
const primaryBtn = { ...btnBase, background: C.sage, color: C.bgDeep };
const secondaryBtn = { ...btnBase, background: 'transparent', color: C.cream, border: '1px solid rgba(255,255,255,0.15)' };
const inputStyle = { fontFamily: F.sans, fontSize: 15, color: C.cream, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '14px 16px', width: '100%', outline: 'none', transition: 'border-color 0.3s ease', lineHeight: 1.6 };
const eyebrowStyle = { fontFamily: F.sans, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.sage, marginBottom: 12 };

function DomainPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {DOMAINS.map(d => {
        const active = value === d.key;
        return (
          <button key={d.key} onClick={() => onChange(d.key)} style={{
            fontFamily: F.sans, fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            background: active ? d.color : 'transparent', color: active ? C.bgDeep : d.color,
            border: `1px solid ${active ? d.color : d.color + '44'}`, transition: 'all 0.25s ease', letterSpacing: '0.04em',
          }}>{d.label}</button>
        );
      })}
    </div>
  );
}

function CynefinGrid({ parts, showNextSteps = false, mini = false }) {
  return (
    <div style={{ position: 'relative', maxWidth: mini ? 600 : 720, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
        {DOMAIN_ORDER.map(dk => {
          const d = DOMAIN_MAP[dk];
          const items = parts.filter(p => p.domain === dk);
          return (
            <div key={dk} style={{ padding: mini ? 'clamp(16px, 2.5vw, 24px)' : 'clamp(20px, 3vw, 32px)', background: items.length > 0 ? `${d.color}0A` : 'transparent', borderBottom: (dk === 'complex' || dk === 'complicated') ? '1px solid rgba(255,255,255,0.04)' : 'none', borderRight: (dk === 'complex' || dk === 'chaotic') ? '1px solid rgba(255,255,255,0.04)' : 'none', minHeight: mini ? 80 : 100 }}>
              <div style={{ fontFamily: F.serif, fontSize: mini ? 16 : 20, fontWeight: 600, color: d.color, marginBottom: items.length > 0 ? 8 : 0 }}>{d.label}</div>
              {items.map(p => (<div key={p.id} style={{ fontFamily: F.sans, fontSize: mini ? 11 : 12, color: C.cream, marginBottom: 4, lineHeight: 1.5 }}>\u2022 {p.text}{showNextSteps && p.nextStep && (<span style={{ color: C.creamMuted, fontStyle: 'italic' }}> \u2192 {p.nextStep}</span>)}</div>))}
              {items.length === 0 && (<div style={{ fontFamily: F.sans, fontSize: 11, color: C.creamMuted, opacity: 0.25, marginTop: 4 }}>\u2014</div>)}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontFamily: F.sans, fontSize: 8, letterSpacing: '0.2em', color: C.creamMuted, opacity: 0.35, whiteSpace: 'nowrap' }}>UNPREDICTABLE</div>
      <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontFamily: F.sans, fontSize: 8, letterSpacing: '0.2em', color: C.creamMuted, opacity: 0.35, whiteSpace: 'nowrap' }}>PREDICTABLE</div>
    </div>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48 }}>
      {Array.from({ length: total }, (_, i) => (<div key={i} style={{ width: i === current ? 32 : 8, height: 8, borderRadius: 4, background: i === current ? C.sage : i < current ? C.sage + '66' : 'rgba(255,255,255,0.1)', transition: 'all 0.4s ease' }} />))}
    </div>
  );
}

function Step1({ challenge, setChallenge }) {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Step 1 of 5</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Name your challenge.</h2>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, marginBottom: 32, maxWidth: 560 }}>Think of something adaptive and unpredictable \u2014 a challenge you don't know the answer to, that matters to you, and that would make a real difference if resolved.</p>
      <textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="e.g. We need to restructure our team while maintaining morale and hitting Q3 targets..." rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} onFocus={e => e.target.style.borderColor = C.sage} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      <p style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, marginTop: 12, opacity: 0.6 }}>Not sure? Good challenges are ones where "just follow the plan" won't work.</p>
    </div>
  );
}

function Step2({ parts, setParts }) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState('');
  const addPart = () => { const text = draft.trim(); if (!text) return; setParts([...parts, { id: Date.now(), text, domain: null, nextStep: '' }]); setDraft(''); setTimeout(() => inputRef.current?.focus(), 50); };
  const removePart = (id) => setParts(parts.filter(p => p.id !== id));
  const updateText = (id, text) => setParts(parts.map(p => p.id === id ? { ...p, text } : p));
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Step 2 of 5</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Break it into pieces.</h2>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, marginBottom: 8, maxWidth: 560 }}>List all the sub-parts of this challenge. Don't filter \u2014 just get them down.</p>
      <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, lineHeight: 1.65, marginBottom: 32, maxWidth: 560, opacity: 0.6, fontStyle: 'italic' }}>For example, "planning a family vacation" breaks into: choosing a location, booking flights and accommodation, getting everyone on board and excited, managing the budget...</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {parts.map((p, i) => (<div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontFamily: F.sans, fontSize: 12, color: C.creamMuted, opacity: 0.4, minWidth: 20 }}>{i + 1}.</span><input value={p.text} onChange={e => updateText(p.id, e.target.value)} style={{ ...inputStyle, padding: '10px 14px', fontSize: 14, flex: 1 }} onFocus={e => e.target.style.borderColor = C.sage} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /><button onClick={() => removePart(p.id)} style={{ background: 'transparent', border: 'none', color: C.creamMuted, cursor: 'pointer', fontSize: 18, padding: '4px 8px', opacity: 0.4, transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.4}>\u00d7</button></div>))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPart()} placeholder="Add a sub-part..." style={{ ...inputStyle, padding: '10px 14px', fontSize: 14, flex: 1 }} onFocus={e => e.target.style.borderColor = C.sage} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <button onClick={addPart} style={{ ...btnBase, padding: '10px 20px', background: C.sage, color: C.bgDeep, fontSize: 13 }}>Add</button>
      </div>
    </div>
  );
}

function Step3({ parts, setParts }) {
  const setDomain = (id, domain) => setParts(parts.map(p => p.id === id ? { ...p, domain } : p));
  const [draft, setDraft] = useState('');
  const addPart = () => { const text = draft.trim(); if (!text) return; setParts([...parts, { id: Date.now(), text, domain: null, nextStep: '' }]); setDraft(''); };
  const hasMapped = parts.some(p => p.domain);
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Step 3 of 5</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Map each piece to a domain.</h2>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, marginBottom: 12, maxWidth: 560 }}>For each sub-part, ask: <em style={{ color: C.cream }}>Do I know how to solve this, or am I navigating uncertainty?</em></p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>{DOMAINS.map(d => (<div key={d.key} style={{ fontSize: 12, fontFamily: F.sans, color: d.color, opacity: 0.7 }}><strong>{d.label}:</strong> <span style={{ color: C.creamMuted }}>{d.hint}</span></div>))}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {parts.map(p => (<div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: p.domain ? `3px solid ${DOMAIN_MAP[p.domain].color}` : '3px solid rgba(255,255,255,0.06)', borderRadius: '0 10px 10px 0', padding: '16px 20px', transition: 'all 0.3s ease' }}><p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, marginBottom: 10, fontWeight: 500 }}>{p.text}</p><DomainPicker value={p.domain} onChange={(d) => setDomain(p.id, d)} /></div>))}
      </div>
      {hasMapped && (<div style={{ marginTop: 40 }}><p style={{ fontFamily: F.sans, fontSize: 13, color: C.cream, marginBottom: 16, textAlign: 'center' }}>Your challenge, mapped:</p><CynefinGrid parts={parts} mini={true} /></div>)}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginBottom: 8 }}>Scan how you've classified so far. Are any domains missing that you feel you need to add?</p>
        <div style={{ display: 'flex', gap: 10 }}><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPart()} placeholder="Another piece of the puzzle..." style={{ ...inputStyle, padding: '10px 14px', fontSize: 13, flex: 1 }} onFocus={e => e.target.style.borderColor = C.sage} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /><button onClick={addPart} style={{ ...btnBase, padding: '10px 20px', background: C.sage, color: C.bgDeep, fontSize: 13 }}>Add</button></div>
      </div>
    </div>
  );
}

function Step4({ parts, setParts, reflection, setReflection }) {
  const setDomain = (id, domain) => setParts(parts.map(p => p.id === id ? { ...p, domain } : p));
  const prompts = {
    clear: "Are you certain this is clear AND executable? Sometimes something that sounds simple is not easy or clear \u2014 e.g., we all know we need to exercise and sleep better, but solving that is not a Clear challenge.",
    complicated: "Can this problem realistically be solved with enough time, money, and expertise? Or is it something you need to experiment with because no one really knows? (e.g., raising children \u2014 you can hire coaches, but no one knows for certain what will work for your specific situation)",
    complex: "Is this genuinely unpredictable, or are you avoiding the analysis it actually needs?",
    chaotic: "Is this truly chaotic right now, or does it just feel urgent? Could it actually be complex?",
  };
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Step 4 of 5</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Pressure test your map.</h2>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, marginBottom: 32, maxWidth: 560 }}>The most common mistake is treating complex challenges as complicated \u2014 assuming there's a "right answer" when you actually need to experiment. Look again at each piece.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {parts.map(p => { const d = p.domain ? DOMAIN_MAP[p.domain] : null; return (<div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: d ? `3px solid ${d.color}` : '3px solid rgba(255,255,255,0.06)', borderRadius: '0 10px 10px 0', padding: '16px 20px' }}><p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, marginBottom: 6, fontWeight: 500 }}>{p.text}</p>{d && <p style={{ fontFamily: F.sans, fontSize: 12, color: d.color, marginBottom: 10, fontStyle: 'italic' }}>{prompts[p.domain]}</p>}<DomainPicker value={p.domain} onChange={(dom) => setDomain(p.id, dom)} /></div>); })}
      </div>
      <div style={{ marginTop: 32 }}><p style={{ fontFamily: F.sans, fontSize: 13, color: C.cream, marginBottom: 8 }}>Any reflections on what shifted?</p><textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What did you notice? What surprised you?" rows={3} style={{ ...inputStyle, resize: 'vertical', fontSize: 14 }} onFocus={e => e.target.style.borderColor = C.sage} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
    </div>
  );
}

function Step5({ parts, setParts }) {
  const setNextStep = (id, text) => setParts(parts.map(p => p.id === id ? { ...p, nextStep: text } : p));
  const [expanded, setExpanded] = useState({});
  const toggleGuidance = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const grouped = DOMAINS.map(d => ({ ...d, items: parts.filter(p => p.domain === d.key) })).filter(g => g.items.length > 0);
  const unmapped = parts.filter(p => !p.domain);
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Step 5 of 5</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>Choose your next move.</h2>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.creamMuted, lineHeight: 1.75, marginBottom: 32, maxWidth: 600 }}>Pick one of the pieces in each domain, and choose a domain-appropriate next step. You don't need a whole plan \u2014 just something to move you forward. If you need a reminder on domain-appropriate actions, <strong style={{ color: C.cream }}>click the domain header</strong>.</p>
      {grouped.map(g => (
        <div key={g.key} style={{ marginBottom: 32 }}>
          <div onClick={() => toggleGuidance(g.key)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            <span style={{ fontFamily: F.serif, fontSize: 22, color: g.color, fontWeight: 600 }}>{g.label}</span>
            <span style={{ fontSize: 12, color: g.color, opacity: 0.5, transition: 'transform 0.3s ease', transform: expanded[g.key] ? 'rotate(90deg)' : 'rotate(0deg)' }}>\u25b6</span>
          </div>
          <div style={{ maxHeight: expanded[g.key] ? 300 : 0, opacity: expanded[g.key] ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.5s cubic-bezier(.22,1,.36,1), opacity 0.4s ease' }}>
            <div style={{ background: `${g.color}0A`, border: `1px solid ${g.color}22`, borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}><p style={{ fontFamily: F.sans, fontSize: 13, color: C.cream, lineHeight: 1.7, margin: 0 }}>{g.guidance}</p></div>
          </div>
          <p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted, marginBottom: 16, fontStyle: 'italic' }}>{g.action}</p>
          {g.items.map(p => (<div key={p.id} style={{ background: `${g.color}08`, border: `1px solid ${g.color}22`, borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}><p style={{ fontFamily: F.sans, fontSize: 14, color: C.cream, fontWeight: 500, marginBottom: 8 }}>{p.text}</p><input value={p.nextStep} onChange={e => setNextStep(p.id, e.target.value)} placeholder="My next step for this..." style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, background: 'rgba(0,0,0,0.15)', borderColor: `${g.color}22` }} onFocus={e => e.target.style.borderColor = g.color} onBlur={e => e.target.style.borderColor = `${g.color}22`} /></div>))}
        </div>
      ))}
      {unmapped.length > 0 && (<div style={{ opacity: 0.5 }}><p style={{ fontFamily: F.sans, fontSize: 13, color: C.creamMuted }}>{unmapped.length} sub-part{unmapped.length > 1 ? 's' : ''} not yet mapped to a domain.</p></div>)}
    </div>
  );
}

function ActionPlan({ challenge, parts, reflection }) {
  const handleDownload = () => {
    const esc = (s) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Action Plan</title><style>body{font-family:Georgia,serif;background:#1F3937;color:#F0EBDB;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7}h1{font-size:28px;margin-bottom:4px}.challenge{opacity:.7;margin-bottom:32px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px}.domain{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px}.domain-name{font-size:20px;font-weight:bold;margin-bottom:8px}.item{margin-bottom:10px;font-size:14px;font-family:'Helvetica Neue',sans-serif}.next{font-style:italic;opacity:.6}.reflection{padding:16px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:32px}.meta{font-size:12px;opacity:.4;margin-top:40px}</style></head><body><h1>Action Plan</h1><p class="challenge">${esc(challenge)}</p><div class="grid">${DOMAIN_ORDER.map(dk=>{const d=DOMAIN_MAP[dk];const items=parts.filter(p=>p.domain===dk);return`<div class="domain" style="border-color:${d.color}33;background:${d.color}0A"><div class="domain-name" style="color:${d.color}">${d.label}</div>${items.length>0?items.map(p=>`<div class="item">\u2022 ${esc(p.text)}${p.nextStep?`<div class="next">\u2192 ${esc(p.nextStep)}</div>`:''}</div>`).join(''):'<div class="item" style="opacity:0.3">\u2014</div>'}</div>`}).join('')}</div>${reflection?`<div class="reflection"><strong>Reflections:</strong><br/>${esc(reflection).replace(/\n/g,'<br/>')}</div>`:''}<p class="meta">Created with InciteU Challenge Mapper \u00b7 ${new Date().toLocaleDateString()}</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'action-plan.html'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={eyebrowStyle}>Your Action Plan</div>
      <h2 style={{ fontFamily: F.serif, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: 24 }}>Here's your action plan.</h2>
      <CynefinGrid parts={parts} showNextSteps={true} />
      {reflection && (<div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px', marginTop: 32 }}><p style={{ fontFamily: F.sans, fontSize: 12, color: C.sage, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Reflections</p><p style={{ fontFamily: F.sans, fontSize: 14, color: C.creamMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reflection}</p></div>)}
      <div style={{ marginTop: 32 }}><button onClick={handleDownload} style={primaryBtn} onMouseEnter={e => { e.target.style.background = C.cream; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.target.style.background = C.sage; e.target.style.transform = 'translateY(0)'; }}>Download Action Plan</button></div>
      <ToolFeedback
        formspreeId="mzdwwygz"
        toolName="Challenge Mapper"
        role="subject"
        initialQuestion="Did this tool help?"
        positivePrompt="What made it useful?"
        negativePrompt="What could have made it more useful?"
      />
    </div>
  );
}

export default function ChallengeMapper() {
  const navigate = useAppNavigate();
  const [step, setStep] = useState(0);
  const [challenge, setChallenge] = useState('');
  const [parts, setParts] = useState([]);
  const [reflection, setReflection] = useState('');
  const totalSteps = 5;
  const canAdvance = [() => challenge.trim().length > 10, () => parts.length >= 2, () => parts.filter(p => p.domain).length >= Math.ceil(parts.length * 0.5), () => true, () => true];
  const next = () => { if (step < totalSteps) setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => { if (step > 0) setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <div style={{ minHeight: '80vh' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 6vw 100px' }}>
        <SEO
          title="Cynefin Challenge Mapper: Decision-Making Tool for Leaders | InciteU"
          description="Map your decision through the Cynefin framework — Clear, Complicated, Complex, Chaotic. Free 5-step interactive tool from InciteU."
          path="/tools/team/challenge-mapper"
        />
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} style={{ display: 'inline-block', color: C.creamMuted, textDecoration: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 40, cursor: 'pointer' }}>\u2190 Back</a>
        {step < totalSteps && <StepIndicator current={step} total={totalSteps} />}
        {step === 0 && <Step1 challenge={challenge} setChallenge={setChallenge} />}
        {step === 1 && <Step2 parts={parts} setParts={setParts} />}
        {step === 2 && <Step3 parts={parts} setParts={setParts} />}
        {step === 3 && <Step4 parts={parts} setParts={setParts} reflection={reflection} setReflection={setReflection} />}
        {step === 4 && <Step5 parts={parts} setParts={setParts} />}
        {step === 5 && <ActionPlan challenge={challenge} parts={parts} reflection={reflection} />}
        {step < totalSteps && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, gap: 16 }}>
            {step > 0 ? (<button onClick={back} style={secondaryBtn} onMouseEnter={e => e.target.style.borderColor = C.sage} onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}>\u2190 Back</button>) : <div />}
            <button onClick={next} disabled={!canAdvance[step]()} style={{ ...primaryBtn, opacity: canAdvance[step]() ? 1 : 0.35, cursor: canAdvance[step]() ? 'pointer' : 'not-allowed' }} onMouseEnter={e => { if (canAdvance[step]()) { e.target.style.background = C.cream; e.target.style.transform = 'translateY(-2px)'; } }} onMouseLeave={e => { e.target.style.background = C.sage; e.target.style.transform = 'translateY(0)'; }}>{step === totalSteps - 1 ? 'See My Action Plan \u2192' : 'Continue \u2192'}</button>
          </div>
        )}
        {step === 5 && (<div style={{ marginTop: 32, textAlign: 'center' }}><button onClick={() => { setStep(0); setChallenge(''); setParts([]); setReflection(''); }} style={{ ...secondaryBtn, fontSize: 13 }}>Start a new challenge</button></div>)}
      </main>
    </div>
  );
}
