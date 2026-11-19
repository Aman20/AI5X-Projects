// Copies 01_plan/*TestCase*.md into src/backend/templates so they ship with the Vercel deployment.
// Skipped when 01_plan is not present (e.g. during the Vercel build), keeping the existing copies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(app, '../../01_plan');
const dest = path.join(app, 'src/backend/templates');

if (!fs.existsSync(src)) {
  console.log('01_plan not found; using bundled templates.');
} else {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const files = fs.readdirSync(src).filter((f) => /testcase.*\.md$/i.test(f));
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dest, f));
  console.log(`Synced templates: ${files.join(', ') || '(none)'}`);
}
