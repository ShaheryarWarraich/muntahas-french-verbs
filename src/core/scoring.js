// Scoring, run summaries and the quiz-ready rule. Pure.
export const READY = { minAccuracy: 90, minAttempted: 20, runsInARow: 2 };

// One per-item record, as stored inside a run (verb, pronoun, type, correct, ms + display helpers).
export function makeRecord(q, { correct, nearly = false, skipped = false, ms = 0 }) {
  return { key: q.key, verb: q.verbId, pronoun: q.pronoun, full: q.full, type: q.type, correct: !!correct, nearly: !!nearly, skipped: !!skipped, ms: Math.round(ms), prompt: q.prompt, reveal: q.reveal, en: q.en };
}

export function summarizeRun(records, { durationSec, elapsedSec } = {}) {
  const attempted = records.filter(r => !r.skipped);
  const correct = attempted.filter(r => r.correct).length;
  const accuracy = attempted.length ? Math.round((correct / attempted.length) * 100) : 0;
  const secs = Math.max(1, elapsedSec ?? durationSec ?? 60);
  const pace = Math.round((correct / (secs / 60)) * 10) / 10;
  let best = 0, cur = 0;
  for (const r of records) { if (r.skipped) continue; if (r.correct) { cur++; best = Math.max(best, cur); } else cur = 0; }
  const verbs = {};
  for (const r of attempted) { const v = (verbs[r.verb] ||= { attempted: 0, correct: 0 }); v.attempted++; if (r.correct) v.correct++; }
  const missed = records.filter(r => !r.correct).map(r => ({ prompt: r.prompt, reveal: r.reveal, en: r.en, type: r.type, key: r.key, skipped: !!r.skipped, nearly: !!r.nearly }));
  return { correct, attempted: attempted.length, skipped: records.length - attempted.length, accuracy, pace, bestStreak: best, verbs, missed };
}

// A run counts toward "quiz-ready" when accuracy >= 90 with >= 20 attempted and both verbs were asked.
export function runQualifies(summary, verbIds) {
  const covered = verbIds.every(id => (summary.verbs?.[id]?.attempted || 0) > 0);
  return summary.accuracy >= READY.minAccuracy && summary.attempted >= READY.minAttempted && covered;
}
// runs: oldest first. Ready = the latest two runs both qualify.
export function readiness(runs, verbIds) {
  const sorted = runs.slice().sort((a, b) => a.tsMs - b.tsMs);
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) { if (runQualifies(sorted[i].summary, verbIds)) streak++; else break; }
  return { ready: streak >= READY.runsInARow, streak: Math.min(streak, READY.runsInARow), needed: READY.runsInARow, runs: sorted.length };
}

// ---- numbers screen ----
export const DURATIONS = [60, 120, 180];
export const durationLabel = (s) => (s % 60 === 0 ? `${s / 60} min` : `${s} s`);
export const bestPerDuration = (runs) => Object.fromEntries(DURATIONS.map(d => {
  const rs = runs.filter(r => r.durationSec === d);
  const best = rs.reduce((b, r) => (!b || r.summary.correct > b.summary.correct ? r : b), null);
  return [d, best ? { correct: best.summary.correct, accuracy: best.summary.accuracy, ts: best.ts } : null];
}));
export const lastRuns = (runs, n = 10) => runs.slice().sort((a, b) => a.tsMs - b.tsMs).slice(-n);
export const accuracyTrend = (runs, n = 10) => lastRuns(runs, n).map(r => ({ ts: r.ts, accuracy: r.summary.accuracy }));

// attempts: flat list of records ({key, verb, pronoun, full, correct, skipped}) from runs and practice.
export function flattenAttempts(runs, practice = []) {
  return [...runs.flatMap(r => r.items || []), ...practice].filter(r => !r.skipped);
}
export function weakestForms(attempts, { minAttempts = 3, n = 5 } = {}) {
  const by = {};
  for (const a of attempts) { const x = (by[a.key] ||= { key: a.key, verb: a.verb, pronoun: a.pronoun, full: a.full, attempted: 0, correct: 0 }); x.attempted++; if (a.correct) x.correct++; }
  return Object.values(by).filter(x => x.attempted >= minAttempts).map(x => ({ ...x, accuracy: Math.round((x.correct / x.attempted) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted).slice(0, n);
}
export function perVerbAccuracy(attempts, verbIds) {
  return Object.fromEntries(verbIds.map(id => {
    const a = attempts.filter(x => x.verb === id); const c = a.filter(x => x.correct).length;
    return [id, { attempted: a.length, correct: c, accuracy: a.length ? Math.round((c / a.length) * 100) : null }];
  }));
}
