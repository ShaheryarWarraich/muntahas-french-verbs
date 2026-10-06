// What the app saves. UI-free; takes an opened db wrapper.
import { summarizeRun, readiness, flattenAttempts, bestPerDuration, lastRuns, accuracyTrend, weakestForms, perVerbAccuracy } from './scoring.js';

export function createStorage(db, now = () => new Date()) {
  return {
    // run: { durationSec, elapsedSec, items: [records] } -> saved with timestamp and summary
    async saveRun({ durationSec, elapsedSec, items }) {
      const d = now();
      const run = { ts: d.toISOString(), tsMs: d.getTime(), durationSec, elapsedSec, items, summary: summarizeRun(items, { durationSec, elapsedSec }) };
      run.id = await db.add('results', run);
      return run;
    },
    async listRuns() { return (await db.all('results')).sort((a, b) => a.tsMs - b.tsMs); },
    async savePractice(rec) { const d = now(); return db.add('attempts', { ...rec, ts: d.toISOString(), tsMs: d.getTime(), mode: 'practice' }); },
    async listPractice() { return db.all('attempts'); },
    async numbers(verbIds) {
      const runs = await this.listRuns(); const practice = await this.listPractice();
      const attempts = flattenAttempts(runs, practice);
      return {
        runs: runs.length,
        total: attempts.length,
        best: bestPerDuration(runs),
        last: lastRuns(runs, 10),
        trend: accuracyTrend(runs, 10),
        weakest: weakestForms(attempts, { minAttempts: 3, n: 5 }),
        verbs: perVerbAccuracy(attempts, verbIds),
        readiness: readiness(runs, verbIds),
      };
    },
    async exportAll() { return { exportedAt: now().toISOString(), app: 'muntahas-french-verbs', ...(await db.dump()) }; },
  };
}
