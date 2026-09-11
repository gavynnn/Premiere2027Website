import fs from 'node:fs';
import path from 'node:path';
import { PRIVATE, documents, documentFingerprint, manifest, saveJSON } from '../server/config.mjs';
import { openAI } from '../server/openai.mjs';

async function sync() {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error('Add OPENAI_API_KEY to .env first. No document was uploaded.');
  const docs = documents();
  if (!docs.length) throw new Error('Configure at least one PDF in content.js first.');
  if (!process.argv.includes('--force') && manifest()) {
    console.log('The document index is already up to date.'); return;
  }
  fs.mkdirSync(PRIVATE, { recursive: true, mode: 0o700 });
  const lock = path.join(PRIVATE, 'sync.lock');
  const handle = fs.openSync(lock, 'wx');
  const uploaded = [];
  let store;
  try {
    store = await openAI('vector_stores', { body: { name: 'The Premiere 2027 - event documents' } });
    for (const doc of docs) {
      const form = new FormData();
      form.append('purpose', 'assistants');
      form.append('file', new Blob([fs.readFileSync(doc.filename)], { type: 'application/pdf' }), path.basename(doc.filename));
      const file = await openAI('files', { form, timeout: 90000 });
      uploaded.push({ ...doc, fileId: file.id });
      await openAI('vector_stores/' + store.id + '/files', { body: {
        file_id: file.id, chunking_strategy: { type: 'static', static: { max_chunk_size_tokens: 600, chunk_overlap_tokens: 100 } }
      } });
      let completed = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        const state = await openAI('vector_stores/' + store.id + '/files/' + file.id, { method: 'GET' });
        if (state.status === 'completed') { completed = true; break; }
        if (state.status === 'failed' || state.status === 'cancelled') throw new Error('Indexing failed for ' + path.basename(doc.filename));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (!completed) throw new Error('Indexing timed out. Run sync-docs again later.');
      console.log('Indexed ' + path.basename(doc.filename));
    }
    const previousFile = path.join(PRIVATE, 'documents.json');
    const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, 'utf8')) : null;
    saveJSON(previousFile, {
      fingerprint: documentFingerprint(docs), vectorStoreId: store.id,
      files: uploaded.map(({ kind, language, url, hash, fileId }) => ({ kind, language, url, hash, fileId }))
    });
    console.log('Document index ready. Restart npm start to load it.');
    // Retire only resources recorded as belonging to this application's old index.
    if (previous?.vectorStoreId) {
      try {
        await openAI('vector_stores/' + previous.vectorStoreId, { method: 'DELETE' });
        for (const file of previous.files) await openAI('files/' + file.fileId, { method: 'DELETE' });
      } catch { console.warn('Old index cleanup was incomplete; check the OpenAI dashboard for unused storage.'); }
    }
  } catch (error) {
    if (store?.id) {
      try {
        await openAI('vector_stores/' + store.id, { method: 'DELETE' });
        for (const file of uploaded) await openAI('files/' + file.fileId, { method: 'DELETE' });
      } catch { console.warn('Check the OpenAI dashboard for incomplete document uploads.'); }
    }
    throw error;
  } finally {
    fs.closeSync(handle); fs.unlinkSync(lock);
  }
}
sync().catch(error => { console.error(error.message); process.exitCode = 1; });
