# QA Test Case Generator

Enter a Jira issue ID, choose a generation type, and get test cases in the approved template (`01_plan/TestCase_Template.md`), based only on the Jira issue and the VWO Login Dashboard PRD.

## Setup
Requires Node.js 22+.

```bash
npm install
npm start          # builds the React UI and starts the server
```
Open http://localhost:4000 (set `TC_PORT` to change the port).

## Configuration
The server loads the nearest `.env` walking up from this folder (the repo root `.env`):

| Variable | Required | Notes |
|---|---|---|
| `JIRA_BASE_URL` | yes | e.g. `https://your-domain.atlassian.net` |
| `JIRA_EMAIL` | yes | |
| `JIRA_TOKEN` | yes | Jira API token |
| `GROQ_API_KEY` | yes | |
| `GROQ_MODEL` | no | default `openai/gpt-oss-120b` |

Credentials stay on the server and are never sent to the browser. Jira is only read, never modified.

## Sources used for generation
- Template: `../../01_plan/TestCase_Template.md` (read at request time).
- PRD: `src/backend/PRD_VWO_Login_Dashboard.md`, a text copy of `PRD_Doc/Product Requirements Document_ VWO Login Dashboard.pdf`.
- Jira issue: summary, description, acceptance criteria, type, priority, labels.

## Structure
```
src/backend/   server.js (API + static), jira.js, generate.js (Groq + prompt), PRD text
src/frontend/  React UI (Generate Test Cases / Connection Details tabs)
```

## Known limitations
- Output is LLM-generated (temperature 0, fixed seed); small variations are still possible. Review before use.
- Design 3 mentions "n8n credentials"; no n8n is used. Credentials come from `.env`.
