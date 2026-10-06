import 'fake-indexeddb/auto';
import { content, ok, done } from './_load.mjs';
import { openDB } from '../src/core/db.js';
import { createStorage } from '../src/core/storage.js';
import { createGenerator } from '../src/core/questions.js';
import { makeRecord } from '../src/core/scoring.js';

const db = await openDB(globalThis.indexedDB, 'test-fv-' + Math.random());
let t = Date.UTC(2026, 9, 6, 10, 0, 0);
const store = createStorage(db, () => new Date(t));
const V = content.verbs.map(v => v.id);

// simulate quiz runs by a pupil who answers (almost) everything right
const gen = createGenerator(content, { mode: 'timed', seed: 11 });
async function play(durationSec, wrongEvery) {
  const items = []; const n = durationSec / 4;
  for (let i = 0; i < n; i++) { const q = gen.next(); items.push(makeRecord(q, { correct: !(wrongEvery && i % wrongEvery === 0), ms: 3800 })); }
  t += 3600_000; return store.saveRun({ durationSec, elapsedSec: durationSec, items });
}
let n0 = await store.numbers(V);
ok(n0.runs === 0 && n0.total === 0 && !n0.readiness.ready, 'fresh start is empty');
const r1 = await play(120, 0); // 30 attempted, 100%
ok(r1.id && r1.ts && r1.summary.accuracy === 100 && r1.items.length === 30, 'run saved with id, timestamp, summary, items');
ok(r1.items[0].verb && r1.items[0].pronoun && r1.items[0].type && 'correct' in r1.items[0] && r1.items[0].ms === 3800, 'per-item record fields');
let n1 = await store.numbers(V);
ok(n1.readiness.streak === 1 && !n1.readiness.ready, 'one good run: not ready yet');
await play(60, 3); // low accuracy
let n2 = await store.numbers(V);
ok(n2.runs === 2 && n2.readiness.streak === 0, 'a poor run resets the meter');
await play(120, 0); await play(180, 0);
const n3 = await store.numbers(V);
ok(n3.readiness.ready, 'two good runs in a row: ready');
ok(n3.best[60] && n3.best[120] && n3.best[180] && n3.last.length === 4 && n3.trend.length === 4, 'best, last, trend');
ok(n3.total === 15 + 30 + 30 + 45 && n3.total === 120, `total answered ${n3.total}`);
ok(n3.verbs.etre.accuracy !== null && n3.verbs.avoir.accuracy !== null, 'per-verb accuracy');
// practice attempts
const q = gen.next(); await store.savePractice(makeRecord(q, { correct: false, ms: 900 }));
ok((await store.numbers(V)).total === 121, 'practice answers count too');
const ex = await store.exportAll();
ok(ex.results.length === 4 && ex.attempts.length === 1 && ex.exportedAt, 'export has results and attempts');
ok(JSON.parse(JSON.stringify(ex)).results[0].summary.attempted === 30, 'export is valid JSON');
done('storage');
