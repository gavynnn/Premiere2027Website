// Test-only Node adapters for the platform import and bundled JSON assets.
// Production code is loaded unchanged; OpenAI and Durable Object storage are
// replaced at the test boundary, not the Worker handler or conversation policy.
import fs from 'node:fs/promises';
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:workers') return { url: 'test:cloudflare-workers', shortCircuit: true };
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url === 'test:cloudflare-workers') return { format: 'module', source: 'export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }', shortCircuit: true };
  if (url.startsWith('file:') && url.endsWith('.json')) return { format: 'module', source: 'export default ' + JSON.stringify(JSON.parse(await fs.readFile(new URL(url), 'utf8'))), shortCircuit: true };
  return nextLoad(url, context);
}
