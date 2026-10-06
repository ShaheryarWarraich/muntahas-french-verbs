import React, { useEffect, useRef, useState } from 'react';
import { checkAnswer, isTyped } from '../../core/check.js';
import { TYPE_NAMES } from '../../core/questions.js';
import Keyboard from './Keyboard.jsx';
import { Mascot } from './Art.jsx';
import { Speaker } from './Bits.jsx';
import { playFr } from '../audio.js';

// One question. mode: 'practice' (gentle, manual Next, retry) | 'quiz' (clock running, auto-advance).
// onAnswer({correct, nearly, ms}) fires once, for the first try only. onNext() moves on.
export default function QuestionView({ q, mode, onAnswer, onNext }) {
  const timed = mode === 'quiz';
  const [phase, setPhase] = useState('ask'); // ask | right | notyet
  const [nearly, setNearly] = useState(false);
  const [text, setText] = useState('');
  const [wrongPicks, setWrongPicks] = useState([]);
  const [placed, setPlaced] = useState([]); // tile ids in order
  const [shown, setShown] = useState(q.type === 'spell');
  const t0 = useRef(performance.now());
  const answered = useRef(false);
  const inputRef = useRef(null);
  const typed = isTyped(q);
  const col = q.color ? `c-${q.color}` : '';

  useEffect(() => { // spell: hear it and see it briefly
    if (q.type !== 'spell') return;
    playFr(q.reveal);
    const id = setTimeout(() => setShown(false), q.showMs);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => { if (typed && phase === 'ask') inputRef.current?.focus({ preventScroll: true }); }, [phase, typed]);
  useEffect(() => { // quiz: move on by itself
    if (!timed || phase === 'ask') return;
    const id = setTimeout(onNext, phase === 'right' ? 450 : 1700);
    return () => clearTimeout(id);
  }, [phase, timed]);

  const submit = (answer) => {
    const res = checkAnswer(q, answer);
    if (res.status === 'empty') return;
    const correct = res.status === 'correct';
    if (!answered.current) { answered.current = true; onAnswer({ correct, nearly: res.status === 'nearly', ms: performance.now() - t0.current }); }
    setNearly(res.status === 'nearly');
    if (correct) { setPhase('right'); if (!timed) playFr(q.reveal); } else setPhase('notyet');
  };
  const retry = () => { setText(''); setPlaced([]); setWrongPicks([]); setPhase('ask'); };
  const pick = (value) => { if (locked) return; if (checkAnswer(q, value).status !== 'correct') setWrongPicks(w => [...w, value]); submit(value); };
  const place = (id) => {
    if (phase !== 'ask') return;
    const next = [...placed, id]; setPlaced(next);
    if (next.length === q.tiles.length) submit(next.map(i => q.tiles.find(t => t.id === i).text));
  };

  const onKey = (ch) => setText(t => (t + ch).slice(0, 24));
  const onBack = () => setText(t => Array.from(t).slice(0, -1).join(''));
  const optClass = (o) => `chip ${phase !== 'ask' && o === q.answer && phase === 'right' ? 'right' : ''} ${wrongPicks.includes(o) ? 'miss' : ''}`;
  const locked = phase === 'right' || (timed && phase === 'notyet');

  const input = (
    <input ref={inputRef} className={`blank-input ${q.type === 'spell' ? 'wideinput' : ''}`} value={text} disabled={locked}
      inputMode="none" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} aria-label="your answer"
      onChange={(e) => setText(e.target.value.slice(0, 24))} onKeyDown={(e) => { if (e.key === 'Enter') submit(text); }}
      style={q.type === 'spell' ? undefined : { width: `${Math.max(5, Array.from(text).length + 1.5)}ch` }} />
  );

  return (
    <div className={`qwrap ${col}`} key={q.id}>
      <span className="tag">{TYPE_NAMES[q.type]}</span>

      {(q.type === 'type' || q.type === 'choose') && <>
        <div className="qline"><span><span className="pn">{q.lead}</span>{q.type === 'type' ? input : <span className="blank">{phase === 'right' ? q.answer : '   '}</span>}</span><span className="inf">({q.infinitive})</span></div>
        <div className="qen">{q.en} · <b>{q.infinitive}</b> = {q.verbEn}</div>
      </>}
      {q.type === 'trap' && <>
        <div className="qline"><span className="pn">{q.lead}</span><span className="blank">{phase === 'right' ? q.answer : '   '}</span><span className="rest">{q.tail}</span></div>
        <div className="qen">{q.en}</div>
      </>}
      {q.type === 'translate' && <>
        <div className="qline"><span>{q.prompt}</span></div>
        <div className="qen">in French?</div>
      </>}
      {q.type === 'build' && <>
        <div className="qline" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}><span>{q.prompt}</span></div>
        <div className="slot" aria-label="your sentence">
          {placed.map(id => { const t = q.tiles.find(x => x.id === id); return <button key={id} className="chip tile" onClick={() => phase === 'ask' && setPlaced(p => p.filter(x => x !== id))}>{t.text}</button>; })}
        </div>
        <div className="tiles">{q.tiles.filter(t => !placed.includes(t.id)).map(t => <button key={t.id} className="chip tile" onClick={() => place(t.id)}>{t.text}</button>)}</div>
      </>}
      {q.type === 'spell' && <>
        <div className="spellbox">
          {shown ? <div className="big">{q.reveal}</div> : <div className="hidden">· · ·</div>}
        </div>
        <div className="qen">{q.en}</div>
        <div className="qline" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>{input}</div>
        <div className="row">
          {!shown && !locked && <button className="btn" onClick={() => { setShown(true); playFr(q.reveal); setTimeout(() => setShown(false), q.showMs); }}>Look again</button>}
        </div>
      </>}
      {q.type === 'which' && <>
        <div className="qline"><span>{q.prompt}</span></div>
        <div className="qen">{q.en}</div>
      </>}

      {(q.type === 'choose' || q.type === 'translate') && (
        <div className="opts">{q.options.map(o => <button key={o} className={optClass(o)} disabled={locked || wrongPicks.includes(o)} onClick={() => pick(o)}>{o}</button>)}</div>
      )}
      {q.type === 'trap' && (
        <div className="opts two">{q.options.map(o => <button key={o} className={optClass(o)} disabled={locked || wrongPicks.includes(o)} onClick={() => pick(o)}>{o}</button>)}</div>
      )}
      {q.type === 'which' && (
        <div className="opts two">{q.options.map(o => <button key={o.id} className={`${optClass(o.id)} c-${o.color} vcfill`} disabled={locked || wrongPicks.includes(o.id)} onClick={() => pick(o.id)}>{o.infinitive}</button>)}</div>
      )}

      {typed && !locked && <Keyboard onKey={onKey} onBack={onBack} onEnter={() => submit(text)} disabled={locked} />}

      <div className="feedback" aria-live="polite">
        {phase === 'right' && <><Mascot mood="cheer" size={72} /><div><div className="big">Yes!</div>{q.tip && <div className="why">{q.tip}</div>}</div></>}
        {phase === 'notyet' && <>
          <Mascot mood="think" size={72} />
          <div>
            <div className="big">{nearly ? 'Nearly! Watch the accent.' : 'Not yet.'}</div>
            <div className={`ans ${q.color === 'teal' ? 'teal' : ''}`}>{q.reveal}</div>
            <div className="why">{q.en}{q.tip ? ` · ${q.tip}` : ''}</div>
          </div>
          <Speaker text={q.reveal} size={46} />
        </>}
      </div>

      {!timed && phase === 'notyet' && <div className="row"><button className="btn" onClick={retry}>Try again</button><button className="btn purple" onClick={onNext}>Next</button></div>}
      {!timed && phase === 'right' && <button className="btn purple big" onClick={onNext}>Next</button>}
    </div>
  );
}
