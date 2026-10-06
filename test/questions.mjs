import { content, ok, done } from './_load.mjs';
import { createGenerator, TYPES } from '../src/core/questions.js';
import { checkAnswer } from '../src/core/check.js';

for (const mode of ['practice', 'timed']) {
  for (const seed of [1, 7, 42]) {
    const gen = createGenerator(content, { mode, seed, retry: false });
    const N = 500; const qs = []; for (let i = 0; i < N; i++) qs.push(gen.next());
    const tag = `${mode}/seed${seed}`;
    // never the same item twice in a row
    let repeats = 0; for (let i = 1; i < N; i++) if (qs[i].key === qs[i - 1].key) repeats++;
    ok(repeats === 0, `${tag}: no repeated item in a row (${repeats})`);
    // balance: verbs and every item within 1 of each other
    const byVerb = {}, byItem = {}, byPron = {}, byType = {};
    for (const q of qs) { byVerb[q.verbId] = (byVerb[q.verbId] || 0) + 1; byItem[q.key] = (byItem[q.key] || 0) + 1; byPron[q.pronoun] = (byPron[q.pronoun] || 0) + 1; byType[q.type] = (byType[q.type] || 0) + 1; }
    const iv = Object.values(byItem);
    ok(iv.length === 16, `${tag}: all 16 items appear`);
    ok(Math.max(...iv) - Math.min(...iv) <= 1, `${tag}: items balanced (${Math.min(...iv)}..${Math.max(...iv)})`);
    ok(Math.abs(byVerb.etre - byVerb.avoir) <= 1, `${tag}: verbs balanced`);
    const pv = Object.values(byPron); ok(Math.max(...pv) - Math.min(...pv) <= 2, `${tag}: pronouns balanced`);
    for (const t of TYPES) ok((byType[t] || 0) > 0, `${tag}: type ${t} appears`);
    if (mode === 'timed') ok((byType.type + byType.trap) / N > 0.45, `${tag}: timed weighted to typing and traps (${((byType.type + byType.trap) / N).toFixed(2)})`);
    // no type twice in a row
    let sameType = 0; for (let i = 1; i < N; i++) if (qs[i].type === qs[i - 1].type) sameType++;
    ok(sameType === 0, `${tag}: type changes every question`);
    // shape checks
    const trapPairs = new Set(); let age = 0;
    for (const q of qs) {
      if (q.options) { ok(new Set(q.options.map(o => o.id || o)).size === q.options.length, `${tag}: options unique (${q.type})`); }
      if (q.type === 'choose') ok(q.options.length === 4 && q.options.includes(q.answer), 'choose: 4 options incl. answer');
      if (q.type === 'translate') {
        ok(q.options.length === 4 && q.options.includes(q.answer), 'translate: 4 options incl. answer');
        const ens = q.options.map(o => content.verbs.flatMap(v => v.forms).find(f => f.full === o).en);
        ok(ens.filter(e => e === q.prompt).length === 1, `translate: only one option means "${q.prompt}"`);
      }
      if (q.type === 'trap') { ok(q.options.length === 2 && q.options.includes(q.answer), 'trap: pair incl. answer'); trapPairs.add([...q.options].sort().join('/')); ok(q.prompt.includes('___'), 'trap has blank'); }
      if (q.type === 'build') { ok(q.tiles.map(t => t.text).sort().join('|') === q.tokensInOrder.slice().sort().join('|'), 'build tiles match'); ok(checkAnswer(q, q.tokensInOrder).status === 'correct', 'build solvable'); ok(q.tiles.length < 2 || q.tiles.some((t, i) => t.id !== i), 'build is shuffled'); }
      if (q.type === 'type') { ok(checkAnswer(q, q.reveal).status === 'correct', 'type: reveal is accepted'); ok(q.prompt.includes('___'), 'type has blank'); }
      if (q.type === 'spell') ok(checkAnswer(q, q.reveal).status === 'correct', 'spell: reveal accepted');
      if (q.type === 'which') { ok(q.options.length === 2 && q.options.some(o => o.id === q.answer), 'which: both verbs offered'); if (q.tip) age++; }
      ok(q.reveal && q.prompt && q.verbId && q.pronoun, 'common fields present');
    }
    ok(trapPairs.size === 3, `${tag}: all three trap pairs appear (${[...trapPairs].join(', ')})`);
    ok(age >= 5, `${tag}: age trap shown in "which verb" (${age})`);
    // sentence blanks: sont/ont questions always built from a sentence with that form
    for (const q of qs.filter(x => x.type === 'trap')) ok(q.options.includes(q.answer) && q.sentence.toLowerCase().includes(' ' + q.answer + ' ') || q.sentence.toLowerCase().includes(q.answer), 'trap sentence contains answer');
  }
}
// Gentle repeat: a missed item comes back within a few questions, never immediately.
const gen = createGenerator(content, { mode: 'practice', seed: 3, retry: true });
let backs = 0, gaps = [];
for (let round = 0; round < 40; round++) {
  const q = gen.next(); gen.markMissed(q);
  for (let i = 1; i <= 8; i++) { const nq = gen.next(); if (nq.key === q.key) { gaps.push(i); backs++; break; } }
  // drain: ignore
}
ok(backs >= 30, `missed items come back (${backs}/40)`);
ok(gaps.every(g => g >= 2), 'never straight away');
// retry mode keeps the no-repeat rule too
const g2 = createGenerator(content, { mode: 'practice', seed: 9, retry: true }); let prev = null, rep = 0;
for (let i = 0; i < 500; i++) { const q = g2.next(); if (i % 3 === 0) g2.markMissed(q); if (prev && prev.key === q.key) rep++; prev = q; }
ok(rep === 0, 'retry mode: still no repeats in a row');
done('questions');
