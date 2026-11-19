// Read-only Jira Cloud client (REST API v3). Only GET requests are made.
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const KEY_RE = /^[A-Z][A-Z0-9_]+-\d+$/;

export function normalizeKey(raw) {
  const key = String(raw || '').trim().toUpperCase();
  if (!key) throw new HttpError(400, 'Enter a Jira issue ID, for example AM-123.');
  if (!KEY_RE.test(key)) throw new HttpError(400, `"${raw}" is not a valid Jira issue ID (expected PROJECT-123).`);
  return key;
}

async function jiraGet(cfg, apiPath) {
  const missing = [['JIRA_BASE_URL', cfg.jiraBaseUrl], ['JIRA_EMAIL', cfg.jiraEmail], ['JIRA_TOKEN', cfg.jiraToken]]
    .filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new HttpError(400, `Jira is not configured. Missing in .env: ${missing.join(', ')}.`);
  const auth = Buffer.from(`${cfg.jiraEmail}:${cfg.jiraToken}`).toString('base64');
  let res;
  try {
    res = await fetch(cfg.jiraBaseUrl + apiPath, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(502, 'Could not reach Jira. Check JIRA_BASE_URL and your network.');
  }
  if (res.ok) return res.json();
  if (res.status === 401) throw new HttpError(401, 'Jira authentication failed. Check JIRA_EMAIL and JIRA_TOKEN.');
  if (res.status === 403) throw new HttpError(403, 'Jira denied access for this account.');
  if (res.status === 404) throw new HttpError(404, 'Not found in Jira, or the account cannot view it.');
  throw new HttpError(502, `Jira returned HTTP ${res.status}.`);
}

export async function testJira(cfg) {
  const me = await jiraGet(cfg, '/rest/api/3/myself');
  return `Connected as ${me.displayName || 'the configured account'}.`;
}

// Atlassian Document Format -> plain text.
function adf(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  const kids = (node.content || []).map(adf);
  switch (node.type) {
    case 'text': return node.text || '';
    case 'hardBreak': return '\n';
    case 'paragraph': return kids.join('') + '\n';
    case 'heading': return '#'.repeat(node.attrs?.level || 2) + ' ' + kids.join('') + '\n';
    case 'listItem': return '- ' + kids.join('').trim() + '\n';
    case 'tableRow': return '| ' + kids.map((k) => k.trim()).join(' | ') + ' |\n';
    default: return kids.join('');
  }
}
const text = (v) => (!v ? '' : typeof v === 'string' ? v : v.type === 'doc' ? adf(v).trim() : v.value || v.name || '');

export async function fetchIssue(cfg, rawKey) {
  const key = normalizeKey(rawKey);
  let d;
  try {
    d = await jiraGet(cfg, `/rest/api/3/issue/${encodeURIComponent(key)}?expand=names`);
  } catch (e) {
    if (e.status === 404) throw new HttpError(404, `Issue ${key} was not found, or the account cannot view it.`);
    throw e;
  }
  const f = d.fields || {};
  const names = d.names || {};
  const ac = Object.keys(f).filter((id) => /acceptance criteria/i.test(names[id] || '') && f[id])
    .map((id) => text(f[id])).join('\n');
  return {
    key: d.key,
    url: `${cfg.jiraBaseUrl}/browse/${d.key}`,
    summary: f.summary || '',
    issueType: f.issuetype?.name || '',
    priority: f.priority?.name || '',
    labels: f.labels || [],
    description: text(f.description),
    acceptanceCriteria: ac,
  };
}
