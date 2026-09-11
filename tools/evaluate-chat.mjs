import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterQuestion } from '../server/filter.mjs';
import { commonPhrases, groups } from '../tests/fixtures/common-phrases.mjs';
import { unrelatedPhrases } from '../tests/fixtures/unrelated-phrases.mjs';

export function evaluateFilter() {
  assert.equal(commonPhrases.length, 500, 'Exactly 500 common phrases');
  assert.equal(unrelatedPhrases.length, 500, 'Exactly 500 unrelated phrases');
  assert.equal(new Set(commonPhrases.map(x => x.message.toLowerCase())).size, 500, 'Common phrases must be unique');
  assert.equal(new Set(unrelatedPhrases.map(x => x.message.toLowerCase())).size, 500, 'Unrelated phrases must be unique');
  const contexts = [false, true].map(context => {
    const missed = commonPhrases.filter(x => !filterQuestion(x.message, context).ok);
    const leaked = unrelatedPhrases.filter(x => filterQuestion(x.message, context).ok);
    return { context, accepted: 500 - missed.length, rejected: 500 - leaked.length, missed: missed.map(x => x.message), leaked: leaked.map(x => x.message) };
  });
  return { common: 500, unrelated: 500, categories: Object.fromEntries(Object.entries(groups).map(([name, rows]) => [name, rows.length])), contexts };
}
if (process.argv[1]?.endsWith('evaluate-chat.mjs')) {
  const report = evaluateFilter();
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--write')) {
    const destination = new URL('../tests/reports/filter-evaluation.json', import.meta.url);
    fs.mkdirSync(new URL('./', destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify({ ...report, commonPhrases, unrelatedPhrases }, null, 2) + '\n');
  }
}
