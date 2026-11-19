# Jira Test Plan Generator

Enter a Jira ID, get a test plan following `src/backend/TestPlan_Template.md`.

## Run
```
npm install
npm start        # http://localhost:3000
```
Needs Node 18+. The frontend is React loaded from a CDN (no build step), so the browser needs internet access.

## Config
The backend reads `.env` from this folder or the nearest parent (see `.env.example`):
`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, and `GROQ_API_KEY` (or use local Ollama).
Secrets stay on the server; the Settings page can override values in server memory only (never stored, never shown).

## Notes
- Jira is read-only (GET requests only).
- Missing info is marked "Insufficient information to determine." by the prompt; the LLM output should still be reviewed.
- Not verified against live Jira/LLM unless you test with your own credentials (use the Settings test buttons).
