import React, { useEffect, useState } from 'react';
import { TopBar, Meter } from '../components/Bits.jsx';
import { DURATIONS, durationLabel } from '../../core/scoring.js';

export default function NumbersScreen({ ctx, store, go }) {
  const [n, setN] = useState(null);
  const verbIds = ctx.verbs.map(v => v.id);
  useEffect(() => { store.numbers(verbIds).then(setN).catch(() => setN(false)); }, []);

  const exportJson = async () => {
    const data = await store.exportAll();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `muntahas-french-verbs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  if (n === null) return <div className="screen center"><div className="hand muted">…</div></div>;
  if (n === false) return <div className="screen"><TopBar title="My numbers" onBack={() => go('home')} /><div className="card hand">Numbers are not available here.</div></div>;

  return (
    <div className="screen fade">
      <TopBar title="My numbers" onBack={() => go('home')} />
      <div className="card"><Meter readiness={n.readiness} /></div>

      <div className="card">
        <div className="chart-t">Best score</div>
        <div className="best">
          {DURATIONS.map(d => (
            <div className="stat" key={d}>
              <div className="n">{n.best[d] ? n.best[d].correct : '–'}</div>
              <div className="l">{durationLabel(d)}{n.best[d] ? ` · ${n.best[d].accuracy}%` : ''}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="charts">
        <div className="card"><div className="chart-t">Last runs · correct</div><Bars runs={n.last} /></div>
        <div className="card"><div className="chart-t">Accuracy</div><Trend points={n.trend} /></div>
      </div>

      <div className="charts">
        <div className="card">
          <div className="chart-t">By verb</div>
          {ctx.verbs.map(v => {
            const x = n.verbs[v.id];
            return (
              <div className={`vbar c-${v.color}`} key={v.id}>
                <span style={{ color: 'var(--vc)' }}>{v.infinitive}</span>
                <div className="track"><i style={{ width: `${x.accuracy ?? 0}%`, background: 'var(--vc)' }} /></div>
                <span>{x.accuracy === null ? '–' : `${x.accuracy}%`}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="chart-t">Weakest</div>
          {n.weakest.length === 0 && <div className="muted hand" style={{ fontSize: '1.2rem' }}>Nothing yet</div>}
          {n.weakest.map(w => {
            const item = ctx.itemByKey[w.key];
            return (
              <div className={`weak c-${item?.color}`} key={w.key}>
                <div><span className="f"><span className="pn">{item?.lead}</span><span className="vb">{item?.form}</span></span> <span className="muted small">{item?.en}</span></div>
                <div className="s">{w.accuracy}% · {w.correct}/{w.attempted}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stats" style={{ maxWidth: 520 }}>
        <div className="card stat"><div className="n">{n.total}</div><div className="l">questions answered</div></div>
        <div className="card stat"><div className="n">{n.runs}</div><div className="l">timed quizzes</div></div>
      </div>
      <button className="btn" onClick={exportJson}>Export JSON</button>
    </div>
  );
}

function Bars({ runs }) {
  if (!runs.length) return <div className="muted hand" style={{ fontSize: '1.2rem' }}>No quizzes yet</div>;
  const W = 400, H = 170, pad = 26, max = Math.max(10, ...runs.map(r => r.summary.correct));
  const bw = Math.min(30, (W - 20) / runs.length - 8);
  const step = (W - 20) / runs.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="correct answers per run">
      <path d={`M8 ${H - pad} H${W - 8}`} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {runs.map((r, i) => {
        const h = Math.max(3, (r.summary.correct / max) * (H - pad - 26)); const x = 12 + i * step + (step - bw) / 2; const y = H - pad - h;
        return (
          <g key={r.id ?? i}>
            <rect x={x} y={y} width={bw} height={h} rx="4" fill="var(--purple)" stroke="var(--ink)" strokeWidth="2" />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="15" fontFamily="var(--hand)" fill="var(--ink)">{r.summary.correct}</text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">{r.durationSec / 60 >= 1 && r.durationSec % 60 === 0 ? `${r.durationSec / 60}m` : `${r.durationSec}s`}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Trend({ points }) {
  if (!points.length) return <div className="muted hand" style={{ fontSize: '1.2rem' }}>No quizzes yet</div>;
  const W = 400, H = 170, L = 34, R = 12, T = 14, B = 22;
  const x = (i) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (a) => T + (1 - a / 100) * (H - T - B);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.accuracy).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="accuracy over time">
      {[0, 50, 100].map(g => <g key={g}><path d={`M${L} ${y(g)} H${W - R}`} stroke="var(--rule)" strokeWidth="2" /><text x="2" y={y(g) + 4} fontSize="12" fill="var(--muted)">{g}</text></g>)}
      <path d={`M${L} ${y(90)} H${W - R}`} stroke="var(--teal)" strokeWidth="2.5" strokeDasharray="7 6" />
      <path d={d} fill="none" stroke="var(--purple)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.accuracy)} r="5.5" fill="#fff" stroke="var(--purple)" strokeWidth="3" />)}
    </svg>
  );
}
