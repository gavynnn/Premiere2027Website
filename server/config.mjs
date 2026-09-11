import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PRIVATE = path.join(ROOT, '.runtime');
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
export function setting(name, fallback, min = 1, max = 10000) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error('Invalid setting: ' + name);
  return value;
}
export function saveJSON(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = filename + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, filename);
}
export function documents() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8'), context, { timeout: 1000 });
  const result = [];
  for (const [kind, config] of Object.entries(context.window.PREMIERE_DOCUMENTS || {})) {
    const editions = config.en || config.id ? Object.entries(config) : [['shared', config]];
    for (const [language, entry] of editions) {
      if (!entry.url) continue;
      if (!/^assets\/documents\/[a-zA-Z0-9._ -]+\.pdf$/.test(entry.url)) throw new Error('Chat PDF URLs must be local files in assets/documents/.');
      const filename = path.join(ROOT, entry.url);
      if (!fs.existsSync(filename)) throw new Error('Configured PDF is missing: ' + entry.url);
      if (!fs.realpathSync(filename).startsWith(fs.realpathSync(path.join(ROOT, 'assets', 'documents')) + path.sep)) throw new Error('PDF path leaves the document directory.');
      const bytes = fs.readFileSync(filename);
      if (bytes.length > 40 * 1024 * 1024 || bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF: ' + entry.url);
      result.push({ kind, language, url: '/' + entry.url, filename, hash: crypto.createHash('sha256').update(bytes).digest('hex') });
    }
  }
  return result;
}
export function documentFingerprint(docs) {
  return crypto.createHash('sha256').update(JSON.stringify(docs.map(({ kind, language, url, hash }) => ({ kind, language, url, hash })))).digest('hex');
}
export function manifest() {
  const file = path.join(PRIVATE, 'documents.json');
  if (!fs.existsSync(file)) return null;
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  return saved.fingerprint === documentFingerprint(documents()) ? saved : null;
}
