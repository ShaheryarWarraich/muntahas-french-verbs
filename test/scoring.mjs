import { content, ok, done } from './_load.mjs';
import { summarizeRun, readiness, runQualifies, bestPerDuration, weakestForms, perVerbAccuracy, accuracyTrend, lastRuns, makeRecord } from '../src/core/scoring.js';

const rec = (verb, pronoun, correct, extra = {}) => ({ key: `${verb}:${pronoun}`, verb, pronoun, full: `${pronoun} x`, type: 'type', correct, ms: 1500, prompt: 'p', reveal: 'r', en: 'e', ...extra });
const mk = (n, wrong = 0, verbs = ['etre', 'avoir']) => Array.from({ length: n }, (_, i) => rec(verbs[i % verbs.length], 'je', i >= wrong));

// summary
const items = [rec('etre', 'je', true), rec('etre', 'tu', true), rec('avoir', 'il', false), rec('avoir', 'il', true, { skipped: true, correct: false }), rec('etre', 'il', true), rec('etre', 'il', true), rec('avoir', 'nous', true)];
const s = summarizeRun(items, { durationSec: 60 });
ok(s.correct === 5 && s.attempted === 6 && s.skipped === 1, `counts ${JSON.stringify([s.correct, s.attempted, s.skipped])}`);
ok(s.accuracy === 83, `accuracy ${s.accuracy}`);
ok(s.pace === 5, `pace ${s.pace}`);
ok(s.bestStreak === 3, `best streak ${s.bestStreak}`); // 2, then a miss (skip is neutral), then 3
ok(s.missed.length === 2 && s.missed.some(m => m.skipped), 'missed list has the wrong and the skipped item');
const early = summarizeRun(items, { durationSec: 120, elapsedSec: 30 });
ok(early.pace === 10, 'pace uses elapsed time if the run ended early');
ok(summarizeRun([], { durationSec: 60 }).accuracy === 0, 'empty run');

// readiness
const V = ['etre', 'avoir'];
const run = (t, items, d = 120) => ({ ts: new Date(t).toISOString(), tsMs: t, durationSec: d, items, summary: summarizeRun(items, { durationSec: d }) });
const good = (t) => run(t, mk(30, 1)); // 29/30 = 97%
const bad = (t) => run(t, mk(30, 8));
const few = (t) => run(t, mk(15, 0), 60);
const oneVerb = (t) => run(t, mk(30, 0, ['etre']));
ok(runQualifies(good(1).summary, V), 'good run qualifies');
ok(!runQualifies(bad(1).summary, V), 'low accuracy does not');
ok(!runQualifies(few(1).summary, V), 'under 20 attempted does not');
ok(!runQualifies(oneVerb(1).summary, V), 'one verb only does not');
ok(!readiness([], V).ready, 'no runs not ready');
ok(!readiness([good(1)], V).ready && readiness([good(1)], V).streak === 1, 'one good run: 1 of 2');
ok(readiness([good(1), good(2)], V).ready, 'two in a row: ready');
ok(!readiness([good(1), bad(2), good(3)], V).ready, 'a bad run in between breaks it');
ok(readiness([bad(1), good(2), good(3)], V).ready, 'earlier bad run does not matter');
ok(!readiness([good(1), good(2), bad(3)], V).ready, 'latest bad run un-readies');
ok(readiness([good(2), good(1)], V).ready, 'order by timestamp');
const r89 = run(3, mk(20, 2)); // 18/20 = 90 exactly
ok(r89.summary.accuracy === 90 && runQualifies(r89.summary, V), '90% exactly qualifies');
ok(!runQualifies(run(3, mk(21, 3)).summary, V), '18/21 = 86 no');

// numbers
const runs = [good(1), run(2, mk(10, 5), 60), run(3, mk(40, 4), 180), run(4, mk(30, 0), 120)];
const best = bestPerDuration(runs);
ok(best[60].correct === 5 && best[120].correct === 30 && best[180].correct === 36, 'best per duration');
ok(lastRuns(runs, 2).map(r => r.tsMs).join() === '3,4', 'last runs');
ok(accuracyTrend(runs).length === 4, 'trend');
const att = [...Array(5)].map((_, i) => rec('etre', 'je', i < 2)).concat([...Array(4)].map((_, i) => rec('avoir', 'tu', i < 4)), [rec('etre', 'es', false), rec('etre', 'es', false)]);
const w = weakestForms(att, { minAttempts: 3 });
ok(w.length === 2 && w[0].key === 'etre:je' && w[0].accuracy === 40, 'weakest forms, min 3 attempts (es with 2 is excluded)');
const pv = perVerbAccuracy(att, V);
ok(pv.etre.attempted === 7 && pv.avoir.accuracy === 100, 'per verb accuracy');
ok(makeRecord({ key: 'k', verbId: 'etre', pronoun: 'je', full: 'je suis', type: 'type', prompt: 'p', reveal: 'r', en: 'I am' }, { correct: true, ms: 1234.6 }).ms === 1235, 'makeRecord');
done('scoring');
