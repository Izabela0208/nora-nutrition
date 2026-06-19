import { useState } from 'react';
import Head from 'next/head';

const G  = '#2D4A3E';
const GOLD = '#C9A96E';
const BG = '#F5F0E8';
const CARD = '#FDFAF5';
const MUTED = '#7A8C86';
const BORDER = '#E2DAD0';
const serif = '"Playfair Display", Georgia, serif';
const sans  = '"Inter", system-ui, sans-serif';

const CONCEPT_FIELDS = [
  { name:'id',       label:'ID',        type:'text',     hint:'e.g. c036' },
  { name:'title',    label:'Title',     type:'text',     required:true },
  { name:'slug',     label:'Slug',      type:'text',     hint:'e.g. ketosis' },
  { name:'level',    label:'Level',     type:'select',   opts:['beginner','intermediate','advanced'] },
  { name:'category', label:'Category',  type:'text',     hint:'e.g. Metabolism' },
  { name:'summary',  label:'Summary',   type:'textarea', hint:'1-2 sentences' },
  { name:'body',     label:'Body',      type:'textarea', hint:'Full explanation (3-6 sentences)' },
  { name:'key_points',label:'Key Points',type:'textarea',hint:'One point per line' },
  { name:'tags',     label:'Tags',      type:'text',     hint:'comma-separated: sleep, hormones' },
];

const BOOK_FIELDS = [
  { name:'id',          label:'ID',           type:'text',     hint:'e.g. b041' },
  { name:'title',       label:'Title',        type:'text',     required:true },
  { name:'author',      label:'Author',       type:'text',     required:true },
  { name:'category',    label:'Category',     type:'text',     hint:'e.g. Nutrition' },
  { name:'level',       label:'Level',        type:'select',   opts:['beginner','intermediate','advanced'] },
  { name:'year',        label:'Year',         type:'number' },
  { name:'pages',       label:'Pages',        type:'number' },
  { name:'rating',      label:'Rating (0-5)', type:'number',   hint:'e.g. 4.7' },
  { name:'description', label:'Description',  type:'textarea', required:true },
  { name:'key_takeaway',label:'Key Takeaway', type:'textarea' },
  { name:'amazon_url',  label:'Amazon URL',   type:'url' },
  { name:'tags',        label:'Tags',         type:'text',     hint:'comma-separated' },
];

const PODCAST_FIELDS = [
  { name:'id',          label:'ID',           type:'text',     hint:'e.g. p026' },
  { name:'title',       label:'Title',        type:'text',     required:true },
  { name:'host',        label:'Host',         type:'text',     required:true },
  { name:'category',    label:'Category',     type:'text',     hint:'e.g. Longevity & Nutrition' },
  { name:'level',       label:'Level',        type:'select',   opts:['beginner','intermediate','advanced'] },
  { name:'description', label:'Description',  type:'textarea', required:true },
  { name:'frequency',   label:'Frequency',    type:'text',     hint:'e.g. Weekly' },
  { name:'avg_duration',label:'Avg Duration', type:'text',     hint:'e.g. 1.5h' },
  { name:'spotify_url', label:'Spotify URL',  type:'url' },
  { name:'apple_url',   label:'Apple URL',    type:'url' },
  { name:'top_episodes',label:'Top Episodes', type:'textarea', hint:'One episode per line' },
  { name:'tags',        label:'Tags',         type:'text',     hint:'comma-separated' },
];

const SCHEMAS = {
  concepts: CONCEPT_FIELDS,
  books:    BOOK_FIELDS,
  podcasts: PODCAST_FIELDS,
};

function buildPayload(table, form) {
  const out = { ...form };
  if (table === 'concepts') {
    out.key_points      = form.key_points ? form.key_points.split('\n').filter(Boolean) : [];
    out.related_concepts = [];
    out.tags = form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
  if (table === 'books') {
    out.year   = form.year   ? Number(form.year)   : null;
    out.pages  = form.pages  ? Number(form.pages)  : null;
    out.rating = form.rating ? Number(form.rating) : null;
    out.tags   = form.tags   ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
  if (table === 'podcasts') {
    out.top_episodes = form.top_episodes ? form.top_episodes.split('\n').filter(Boolean) : [];
    out.tags         = form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
  return out;
}

export default function AdminPage() {
  const [token,   setToken]   = useState('');
  const [authed,  setAuthed]  = useState(false);
  const [tab,     setTab]     = useState('concepts');
  const [form,    setForm]    = useState({});
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = e => {
    e.preventDefault();
    if (!token.trim()) return;
    setAuthed(true);
  };

  const handleChange = (name, value) => setForm(p => ({ ...p, [name]: value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const payload = buildPayload(tab, form);
      const res = await fetch(`/api/library/${tab}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`Error: ${data.error}`);
      } else {
        setStatus(`✓ Added "${data.title || data.id}" successfully`);
        setForm({});
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${BORDER}`, backgroundColor: CARD,
    fontSize: 13, fontFamily: sans, color: '#1A1A1A',
    outline: 'none', boxSizing: 'border-box',
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
        <Head><title>Nora Admin</title></Head>
        <div style={{ backgroundColor: CARD, borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <p style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: G, margin: '0 0 6px' }}>✦ Nora Admin</p>
          <p style={{ fontSize: 12, color: MUTED, margin: '0 0 24px', fontFamily: sans }}>Library management</p>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Admin password" value={token} onChange={e => setToken(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }} autoFocus />
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: G, color: '#FDFAF5', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fields = SCHEMAS[tab];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: sans }}>
      <Head><title>Nora Admin — Library</title></Head>

      {/* Header */}
      <div style={{ backgroundColor: G, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: '#FDFAF5', margin: 0 }}>✦ Nora Library Admin</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0', fontFamily: sans }}>Add content to Supabase</p>
        </div>
        <a href="/" style={{ fontSize: 12, color: GOLD, fontFamily: sans, textDecoration: 'none' }}>← Back to app</a>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Object.keys(SCHEMAS).map(t => (
            <button key={t} onClick={() => { setTab(t); setForm({}); setStatus(''); }}
              style={{ flex: 1, padding: '10px', border: `1px solid ${tab === t ? G : BORDER}`, borderRadius: 10, backgroundColor: tab === t ? G : CARD, color: tab === t ? '#FDFAF5' : MUTED, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: sans, textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ backgroundColor: CARD, borderRadius: 16, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <p style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: G, margin: '0 0 20px', textTransform: 'capitalize' }}>
            Add {tab.slice(0, -1)}
          </p>

          <form onSubmit={handleSubmit}>
            {fields.map(f => (
              <div key={f.name} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, fontFamily: sans }}>
                  {f.label}{f.required && <span style={{ color: '#E53E3E' }}> *</span>}
                </label>

                {f.type === 'select' ? (
                  <select value={form[f.name] || ''} onChange={e => handleChange(f.name, e.target.value)}
                    style={{ ...inputStyle }}>
                    <option value="">— select —</option>
                    {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.name] || ''} onChange={e => handleChange(f.name, e.target.value)}
                    rows={f.name === 'body' || f.name === 'description' ? 4 : 3}
                    placeholder={f.hint || ''}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                ) : (
                  <input type={f.type} value={form[f.name] || ''} onChange={e => handleChange(f.name, e.target.value)}
                    placeholder={f.hint || ''}
                    style={{ ...inputStyle }} />
                )}
              </div>
            ))}

            {status && (
              <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: status.startsWith('✓') ? '#D1FAE5' : '#FDECEA', color: status.startsWith('✓') ? '#065F46' : '#991B1B', fontSize: 13, fontFamily: sans, marginBottom: 16 }}>
                {status}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', backgroundColor: loading ? MUTED : GOLD, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: serif }}>
              {loading ? 'Saving…' : `Add to Library →`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
