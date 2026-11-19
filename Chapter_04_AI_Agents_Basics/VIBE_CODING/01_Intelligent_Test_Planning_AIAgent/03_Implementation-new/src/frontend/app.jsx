const { useState, useEffect } = React;

const call = async (url, body) => {
  try {
    const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Request failed (HTTP ${r.status}).`);
    return d;
  } catch (e) {
    throw new Error(e instanceof TypeError ? 'Cannot reach the backend. Is it running?' : e.message);
  }
};

function Main({ config }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState(null);

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true); setErr(''); setRes(null);
    try { setRes(await call('/api/generate', { issueKey: key, config })); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <>
      <div className="card plan">
        {busy && <p className="muted">Fetching the Jira issue and generating the test plan…</p>}
        {err && <p className="err">{err}</p>}
        {!busy && !err && !res && <p className="muted">Enter a Jira issue ID below to generate a test plan.</p>}
        {res && (
          <>
            <p className="muted">Source: <a href={res.source.url} target="_blank" rel="noreferrer">{res.source.key}</a> — {res.source.summary}</p>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(res.plan)) }} />
          </>
        )}
      </div>
      <form className="card row" onSubmit={submit}>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Jira ticket, e.g. QA-123" aria-label="Jira issue ID" />
        <button className="primary" disabled={busy}>{busy ? 'Generating…' : 'Generate'}</button>
      </form>
    </>
  );
}

function Settings({ s, setS }) {
  const [msg, setMsg] = useState({});

  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const test = async (name, url) => {
    setMsg((m) => ({ ...m, [name]: { text: 'Testing…' } }));
    try {
      const d = await call(url, { config: s });
      setMsg((m) => ({ ...m, [name]: { text: d.message, ok: true } }));
    } catch (e) { setMsg((m) => ({ ...m, [name]: { text: e.message } })); }
  };
  const Msg = ({ n }) => msg[n] ? <p className={msg[n].ok ? 'ok' : msg[n].text === 'Testing…' ? 'muted' : 'err'}>{msg[n].text}</p> : null;

  return (
    <>
      <div className="card">
        <h2>JIRA Connection</h2>
        <label>URL</label><input value={s.jiraUrl} onChange={set('jiraUrl')} placeholder="https://your-domain.atlassian.net" />
        <label>Email</label><input value={s.jiraEmail} onChange={set('jiraEmail')} />
        <label>API token</label><input type="password" value={s.jiraToken || ''} onChange={set('jiraToken')} placeholder={s.jiraTokenSet ? '•••••• (set — leave blank to keep)' : ''} />
        <button className="sec" onClick={() => test('jira', '/api/test/jira')}>Test Connection</button>
        <Msg n="jira" />
      </div>
      <div className="card">
        <h2>LLM Configuration</h2>
        <label>Provider</label>
        <select value={s.provider} onChange={set('provider')}>
          <option value="ollama">1. Ollama (local)</option>
          <option value="groq">2. Groq.com</option>
        </select>
        {s.provider === 'ollama' ? (
          <>
            <label>Ollama URL</label><input value={s.ollamaUrl} onChange={set('ollamaUrl')} />
            <label>Model</label><input value={s.ollamaModel} onChange={set('ollamaModel')} />
          </>
        ) : (
          <>
            <label><a href="https://groq.com" target="_blank" rel="noreferrer">Groq.com</a> API key</label>
            <input type="password" value={s.groqKey || ''} onChange={set('groqKey')} placeholder={s.groqKeySet ? '•••••• (set — leave blank to keep)' : ''} />
            <label>Model</label><input value={s.groqModel} onChange={set('groqModel')} />
          </>
        )}
        <button className="sec" onClick={() => test('llm', '/api/test/llm')}>Test {s.provider === 'groq' ? 'Groq.com' : 'Local LLM'}</button>
        <Msg n="llm" />
      </div>
    </>
  );
}

function App() {
  const [page, setPage] = useState('main');
  const [s, setS] = useState(null); // settings live in page memory only (never stored)
  const [loadErr, setLoadErr] = useState('');
  useEffect(() => { call('/api/settings').then(setS).catch((e) => setLoadErr(e.message)); }, []);
  return (
    <>
      <nav>
        <button className={page === 'main' ? 'on' : ''} onClick={() => setPage('main')}>Main page</button>
        <button className={page === 'settings' ? 'on' : ''} onClick={() => setPage('settings')}>Settings</button>
      </nav>
      <main>{loadErr ? <p className="err">{loadErr}</p> : !s ? <p className="muted">Loading…</p> : page === 'main' ? <Main config={s} /> : <Settings s={s} setS={setS} />}</main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
