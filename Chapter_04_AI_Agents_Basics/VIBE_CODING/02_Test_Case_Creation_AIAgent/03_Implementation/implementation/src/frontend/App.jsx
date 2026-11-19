import React, { useEffect, useMemo, useState } from 'react';
import { Marked } from 'marked';

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Raw HTML from the model is escaped, except <br> used for line breaks in table cells.
const md = new Marked({ renderer: { html: ({ text }) => (/^<br\s*\/?>$/i.test(text.trim()) ? '<br>' : esc(text)) } });

async function api(url, body) {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
  return data;
}

const TYPES = [
  { id: 'all', icon: '☰', title: 'All Relevant Scenarios', sub: 'Complete coverage based on Jira requirements.',
    desc: 'Includes functional, negative, boundary, validation, integration and regression scenarios wherever applicable.' },
  { id: 'functional', icon: '✓', title: 'Functional + Negative', sub: 'Validate expected behaviour and failure conditions.',
    desc: 'Includes positive flows, negative inputs, validations, error handling and business rules.' },
  { id: 'regression', icon: '⟳', title: 'Regression Test Cases', sub: 'Identify existing functionality potentially impacted.',
    desc: 'Includes impacted workflows, existing feature validation, integration and backward compatibility scenarios.' },
];

function Generate() {
  const [issueId, setIssueId] = useState('');
  const [type, setType] = useState('all');
  const [instructions, setInstructions] = useState('');
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState('');
  useEffect(() => {
    api('/api/templates').then(({ templates: t }) => { setTemplates(t); setTemplate(t[0] || ''); })
      .catch((e) => setError(e.message));
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => (result ? md.parse(result.markdown) : ''), [result]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      setResult(await api('/api/generate', { issueId, type, instructions, template }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([result.markdown], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${result.issue.key}_TestCases.md` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form onSubmit={submit}>
      <h2>1. Jira Epic or Task Details</h2>
      <label htmlFor="issue">Jira Id</label>
      <input id="issue" className="input" placeholder="Type epic or task number like AM-123" value={issueId} autoFocus
        onChange={(e) => setIssueId(e.target.value)} disabled={busy} />

      <h2>2. Select Test Case Generation Type</h2>
      <p className="muted">Choose the testing scope for the AI agent.</p>
      <div role="radiogroup">
        {TYPES.map((t) => (
          <button type="button" key={t.id} role="radio" aria-checked={type === t.id} disabled={busy}
            className={`card option ${type === t.id ? 'selected' : ''}`} onClick={() => setType(t.id)}>
            <div className="row">
              <span className="icon">{t.icon}</span>
              <div className="grow">
                <div className="title">{t.title}</div>
                <div className="sub">{t.sub}</div>
              </div>
              <span className={`radio ${type === t.id ? 'on' : ''}`} />
            </div>
            <div className="desc">{t.desc}</div>
          </button>
        ))}
      </div>

      <h2>3. Test Case Template</h2>
      <label htmlFor="template">User-provided test case template</label>
      <select id="template" className="input" value={template} disabled={busy || !templates.length}
        onChange={(e) => setTemplate(e.target.value)}>
        {!templates.length && <option value="">No templates found in 01_plan</option>}
        {templates.map((t) => (
          <option key={t} value={t}>{t}{t === 'TestCase_Template.md' ? ' (Original approved template)' : ''}</option>
        ))}
      </select>

      <h2>4. Additional Instructions (Optional)</h2>
      <textarea className="input" rows={3} maxLength={2000} placeholder="Any additional testing instructions..."
        value={instructions} onChange={(e) => setInstructions(e.target.value)} disabled={busy} />

      <button className="primary" type="submit" disabled={busy || !issueId.trim() || !template}>
        {busy ? 'Generating test cases…' : '✦ Generate Test Cases'}
      </button>

      {error && <div className="alert" role="alert">{error}</div>}
      {result && (
        <section className="result">
          <div className="row">
            <div className="grow muted">
              Source: <a href={result.issue.url} target="_blank" rel="noreferrer">{result.issue.key}</a> — {result.issue.summary}
              {' · '}Model: {result.model}
            </div>
            <button type="button" className="ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            <button type="button" className="ghost" onClick={download}>Download .md</button>
          </div>
          <div className="doc" dangerouslySetInnerHTML={{ __html: html }} />
        </section>
      )}
    </form>
  );
}

function Connection({ name, icon, desc, endpoint }) {
  const [state, setState] = useState({ status: 'Not tested', msg: '' });
  async function test() {
    setState({ status: 'Testing…', msg: '' });
    try {
      const { message } = await api(endpoint, {});
      setState({ status: 'Connected', msg: message });
    } catch (e) {
      setState({ status: 'Failed', msg: e.message });
    }
  }
  const cls = state.status === 'Connected' ? 'ok' : state.status === 'Failed' ? 'bad' : '';
  return (
    <div className="card">
      <div className="row">
        <span className="icon">{icon}</span>
        <div className="grow title">{name}</div>
        <span className={`badge ${cls}`}>{state.status}</span>
      </div>
      <p className="desc">{desc}</p>
      <button type="button" className="ghost wide" onClick={test} disabled={state.status === 'Testing…'}>
        Test {name.split(' ')[0]} Connection
      </button>
      {state.msg && <p className={`desc ${cls}`}>{state.msg}</p>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('generate');
  const [health, setHealth] = useState(null);
  useEffect(() => { api('/api/health').then(setHealth).catch(() => setHealth({ jira: false, groq: false })); }, []);
  const ready = health && health.jira && health.groq;

  return (
    <main className="app">
      <header className="row">
        <div className="logo">📋</div>
        <div className="grow">
          <h1>QA Test Case Generator</h1>
          <div className="muted">Intelligent Jira QA Assistant</div>
        </div>
        {health && <span className={`badge ${ready ? 'ok' : 'bad'}`}>{ready ? 'Agent ready' : 'Not configured'}</span>}
      </header>

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'generate'} className={tab === 'generate' ? 'active' : ''}
          onClick={() => setTab('generate')}>Generate Test Cases</button>
        <button role="tab" aria-selected={tab === 'conn'} className={tab === 'conn' ? 'active' : ''}
          onClick={() => setTab('conn')}>Connection Details</button>
      </nav>

      <div hidden={tab !== 'generate'}><Generate /></div>
      <div hidden={tab !== 'conn'}>
        <h2>Integration Health</h2>
        <Connection name="Jira Software API" icon="⫶" endpoint="/api/test/jira"
          desc="Authentication, Jira connectivity and issue retrieval." />
        <Connection name="Groq LLM" icon="✺" endpoint="/api/test/groq"
          desc="API authentication and model inference." />
        <div className="note">
          <div className="title">🛡 Secure credential management</div>
          <p className="desc">API keys are kept on the server. They are never exposed in the UI.</p>
        </div>
      </div>
    </main>
  );
}
