import React, { useEffect, useRef, useState } from 'react';
import QuestionView from '../components/QuestionView.jsx';
import { TopBar, Meter } from '../components/Bits.jsx';
import { Mascot, SkipIcon } from '../components/Art.jsx';
import { createGenerator } from '../../core/questions.js';
import { makeRecord, summarizeRun, readiness, DURATIONS, durationLabel } from '../../core/scoring.js';

export default function QuizScreen({ ctx, store, go }) {
  const [phase, setPhase] = useState('setup'); // setup | run | done
  const [result, setResult] = useState(null);
  const start = (durationSec) => { setResult({ durationSec }); setPhase('run'); };
  const finish = async ({ durationSec, elapsedSec, items }) => {
    const verbIds = ctx.verbs.map(v => v.id);
    let run;
    try { run = await store.saveRun({ durationSec, elapsedSec, items }); } catch { run = { summary: summarizeRun(items, { durationSec, elapsedSec }), durationSec, tsMs: Date.now(), items }; }
    let ready = null;
    try { ready = readiness(await store.listRuns(), verbIds); } catch { /* keep going without the meter */ }
    setResult({ ...run, readiness: ready }); setPhase('done');
  };
  if (phase === 'setup') return (
    <div className="screen fade">
      <TopBar title="Timed Quiz" onBack={() => go('home')} />
      <Mascot mood="cheer" size={120} />
      <div className="durs">
        {DURATIONS.map(d => <button key={d} className="btn yellow" onClick={() => start(d)}>{d === 60 ? '60' : d / 60}<small>{d === 60 ? 'seconds' : 'minutes'}</small></button>)}
      </div>
    </div>
  );
  if (phase === 'run') return <Run ctx={ctx} durationSec={result.durationSec} onFinish={finish} onQuit={() => setPhase('setup')} />;
  return <Results ctx={ctx} run={result} onAgain={() => setPhase('setup')} go={go} />;
}

function Run({ ctx, durationSec, onFinish, onQuit }) {
  const gen = useRef(createGenerator(ctx.content, { mode: 'timed', seed: Date.now() }));
  const records = useRef([]);
  const t0 = useRef(Date.now());
  const qStart = useRef(performance.now());
  const [q, setQ] = useState(() => gen.current.next());
  const [left, setLeft] = useState(durationSec);
  const [correct, setCorrect] = useState(0);
  const ended = useRef(false);
  const answeredThis = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const l = Math.max(0, durationSec - (Date.now() - t0.current) / 1000);
      setLeft(l);
      if (l <= 0 && !ended.current) { ended.current = true; clearInterval(id); onFinish({ durationSec, elapsedSec: durationSec, items: records.current }); }
    }, 200);
    return () => clearInterval(id);
  }, []);

  const next = () => { answeredThis.current = false; qStart.current = performance.now(); setQ(gen.current.next()); };
  const onAnswer = (res) => {
    answeredThis.current = true;
    records.current.push(makeRecord(q, res));
    if (res.correct) setCorrect(c => c + 1);
  };
  const skip = () => { if (!answeredThis.current) records.current.push(makeRecord(q, { correct: false, skipped: true, ms: performance.now() - qStart.current })); next(); };
  const secs = Math.ceil(left);
  const label = durationSec > 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : String(secs);
  return (
    <div className="screen">
      <div className="clock">
        <div className={`time ${left <= 10 ? 'low' : ''}`}>{label}</div>
        <div className="bar"><i style={{ width: `${(left / durationSec) * 100}%` }} /></div>
        <div className="score">{correct}</div>
      </div>
      <QuestionView key={q.id} q={q} mode="quiz" onAnswer={onAnswer} onNext={next} />
      <div className="row">
        <button className="btn" onClick={skip}><SkipIcon /> Skip</button>
        <button className="btn link" onClick={() => { ended.current = true; onQuit(); }}>Stop</button>
      </div>
    </div>
  );
}

function Results({ ctx, run, onAgain, go }) {
  const s = run.summary;
  return (
    <div className="screen fade">
      <TopBar title={`${durationLabel(run.durationSec)} quiz`} onBack={() => go('home')} />
      <div className="card tint c-purple" style={{ '--vcl': '#f6f1fd' }}>
        <div className="stats">
          <div className="stat main"><div className="n">{s.correct}</div><div className="l">correct</div></div>
          <div className="stat"><div className="n">{s.attempted}</div><div className="l">tried</div></div>
          <div className="stat"><div className="n">{s.accuracy}%</div><div className="l">right</div></div>
          <div className="stat"><div className="n">{s.pace}</div><div className="l">per minute</div></div>
          <div className="stat"><div className="n">{s.bestStreak}</div><div className="l">best streak</div></div>
        </div>
      </div>
      {run.readiness && <div className="card"><Meter readiness={run.readiness} /></div>}
      <div className="card">
        <h3 style={{ textAlign: 'left', marginBottom: 6 }}>{s.missed.length ? 'Come back to these' : 'All clear'}</h3>
        {s.missed.length > 0 && <div className="missed">
          {s.missed.map((m, i) => <div className="m" key={i}><div className="q">{m.prompt}</div><div className="a">{m.reveal}</div><div className="e">{m.en}{m.skipped ? ' · skipped' : ''}</div></div>)}
        </div>}
      </div>
      <div className="row">
        <button className="btn yellow big" onClick={onAgain}>Again</button>
        <button className="btn" onClick={() => go('numbers')}>My numbers</button>
        <button className="btn" onClick={() => go('home')}>Home</button>
      </div>
    </div>
  );
}
