// Express API + static frontend. Credentials are read from the nearest .env and never sent to the browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { HttpError, fetchIssue, testJira } from './jira.js';
import { TYPES, generate, testGroq } from './generate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(here, '../..');

// Load the nearest .env walking up from the app folder.
for (let dir = APP_DIR; ; dir = path.dirname(dir)) {
  const f = path.join(dir, '.env');
  if (fs.existsSync(f)) { process.loadEnvFile(f); console.log(`Loaded config from ${f}`); break; }
  if (path.dirname(dir) === dir) { console.warn('No .env file found.'); break; }
}

const env = process.env;
const cfg = {
  jiraBaseUrl: (env.JIRA_BASE_URL || '').trim().replace(/\/+$/, ''),
  jiraEmail: env.JIRA_EMAIL || '',
  jiraToken: env.JIRA_TOKEN || '',
  groqApiKey: env.GROQ_API_KEY || '',
  groqModel: env.GROQ_MODEL || 'openai/gpt-oss-120b',
};

// Test case templates: every *TestCase*.md file in 01_plan (local), or the bundled
// copies in src/backend/templates (Vercel, where 01_plan is not deployed).
const SOURCE_DIR = path.resolve(APP_DIR, '../../01_plan');
const PLAN_DIR = fs.existsSync(SOURCE_DIR) ? SOURCE_DIR : path.join(here, 'templates');
const DEFAULT_TEMPLATE = 'TestCase_Template.md';
const listTemplates = () => (fs.existsSync(PLAN_DIR) ? fs.readdirSync(PLAN_DIR) : [])
  .filter((f) => /testcase.*\.md$/i.test(f))
  .sort((a, b) => (a === DEFAULT_TEMPLATE ? -1 : b === DEFAULT_TEMPLATE ? 1 : a.localeCompare(b)));
const PRD = path.join(here, 'PRD_VWO_Login_Dashboard.md');
const read = (f, label) => {
  if (!fs.existsSync(f)) throw new HttpError(500, `${label} not found at ${f}.`);
  return fs.readFileSync(f, 'utf8');
};

const app = express();
app.use(express.json({ limit: '100kb' }));

const route = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    res.status(status).json({ error: e instanceof HttpError ? e.message : 'Unexpected server error.' });
  }
};

app.get('/api/health', route(async () => ({
  jira: Boolean(cfg.jiraBaseUrl && cfg.jiraEmail && cfg.jiraToken),
  groq: Boolean(cfg.groqApiKey),
})));
app.get('/api/templates', route(async () => ({ templates: listTemplates() })));
app.post('/api/test/jira', route(async () => ({ message: await testJira(cfg) })));
app.post('/api/test/groq', route(async () => ({ message: await testGroq(cfg) })));

app.post('/api/generate', route(async (req) => {
  const { issueId, type = 'all', instructions = '', template: templateFile = DEFAULT_TEMPLATE } = req.body || {};
  if (!TYPES[type]) throw new HttpError(400, 'Unknown generation type.');
  if (String(instructions).length > 2000) throw new HttpError(400, 'Additional instructions must be 2000 characters or fewer.');
  if (!listTemplates().includes(templateFile)) throw new HttpError(400, `Test case template "${templateFile}" was not found in 01_plan.`);
  const template = read(path.join(PLAN_DIR, templateFile), 'Test case template');
  const prd = read(PRD, 'PRD');
  const issue = await fetchIssue(cfg, issueId);
  const markdown = await generate(cfg, { issue, type, instructions: String(instructions).trim(), template, prd });
  return { issue: { key: issue.key, url: issue.url, summary: issue.summary }, model: cfg.groqModel, markdown };
}));

const dist = path.join(APP_DIR, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

export default app;

// Local run (`node src/backend/server.js`); on Vercel the app is imported by api/index.js instead.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(env.TC_PORT) || 4000;
  app.listen(port, () => console.log(`QA Test Case Generator running at http://localhost:${port}`));
}
