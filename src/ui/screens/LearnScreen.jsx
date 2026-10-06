import React, { useState } from 'react';
import { TopBar, Speaker, Letters, Phrase } from '../components/Bits.jsx';
import { playFr } from '../audio.js';

const sameWord = (a, b) => a.toLowerCase() === b.toLowerCase();

export default function LearnScreen({ ctx, params, go }) {
  const [verbId, setVerbId] = useState(params.verb || ctx.verbs[0].id);
  const [tab, setTab] = useState(params.tab || 'table');
  const v = ctx.verbById[verbId];
  return (
    <div className={`screen fade c-${v.color}`}>
      <TopBar title="Learn" onBack={() => go('home')} />
      <div className="tabs">
        {ctx.verbs.map(x => <button key={x.id} className={`tab vtab c-${x.color} ${x.id === verbId ? 'on' : ''}`} onClick={() => setVerbId(x.id)}>{x.infinitive}</button>)}
      </div>
      <div className="tabs">
        {[['table', 'Table'], ['sentences', 'Sentences'], ['traps', 'Traps']].map(([id, label]) => <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'table' && <Table key={verbId} ctx={ctx} v={v} />}
      {tab === 'sentences' && <Sentences key={verbId} ctx={ctx} v={v} />}
      {tab === 'traps' && <Traps ctx={ctx} />}
    </div>
  );
}

function Table({ ctx, v }) {
  const [flip, setFlip] = useState(null); // 'inf' or a pronoun
  const tipFor = (...words) => v.spelling.find(t => words.some(w => sameWord(t.word, w)));
  return (
    <div className="card vc" style={{ paddingTop: 14 }}>
      {flip === 'inf'
        ? <FlipCard word={v.infinitive} tip={tipFor(v.infinitive)} sub={v.en} audio={v.infinitive} color={v.color} onBack={() => setFlip(null)} />
        : <div className="vhead" role="button" tabIndex={0} onClick={() => { setFlip('inf'); playFr(v.infinitive); }}>
            <div><div className="inf">{v.infinitive}</div><div className="muted hand" style={{ fontSize: '1.3rem' }}>{v.en}</div></div>
            <Speaker text={v.infinitive} color={v.color} />
          </div>}
      <div className="convhead"><span>who</span><span>verb</span><span>English</span><span /></div>
      {v.forms.map(f => flip === f.pronoun
        ? <div key={f.pronoun} style={{ borderBottom: '2px dashed rgba(59,53,72,.18)' }}>
            <FlipCard word={(tipFor(f.form, f.full) || { word: f.form }).word} tip={tipFor(f.form, f.full)} sub={f.en} audio={f.full} color={v.color} onBack={() => setFlip(null)} />
          </div>
        : <div key={f.pronoun} className="convrow" role="button" tabIndex={0} onClick={() => { setFlip(f.pronoun); playFr(f.full); }}>
            <span className="p">{f.pronoun}</span><span className="f">{f.form}</span><span className="e">{f.en}</span>
            <Speaker text={f.full} color={v.color} size={48} />
          </div>)}
    </div>
  );
}

function FlipCard({ word, tip, sub, audio, color, onBack }) {
  return (
    <div className="flipcard" role="button" tabIndex={0} onClick={onBack}>
      <Letters word={word} highlight={tip?.highlight || []} color={color} />
      <div className="hand" style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 6 }}>{sub}</div>
      {tip && <div className="tipnote">{tip.tip}</div>}
      <div className="row" style={{ marginTop: 6 }}><Speaker text={audio} color={color} size={50} /></div>
    </div>
  );
}

function Sentences({ ctx, v }) {
  return (
    <>
      {ctx.sentences.filter(s => s.verbId === v.id).map(s => (
        <div key={s.fr} className={`card sent c-${s.color}`}>
          <div>
            <div className="fr"><Phrase lead={s.lead} form={s.form} rest={s.tail} color={s.color} /></div>
            <div className="en">{s.en}</div>
            {s.tip && <div className="tip">{s.tip}</div>}
          </div>
          <Speaker text={s.fr} color={s.color} />
        </div>
      ))}
    </>
  );
}

function Traps({ ctx }) {
  const side = (text, en) => {
    const p = ctx.splitPhrase(text);
    return (
      <div className="side" role="button" tabIndex={0} onClick={() => playFr(text)}>
        <div className="fr">{p ? <Phrase {...p} /> : text}</div>
        <div className="muted">{en}</div>
        <Speaker text={text} color={p?.color} size={44} />
      </div>
    );
  };
  return (
    <>
      {ctx.content.traps.map(t => (
        <div key={t.a + t.b} className="card trap">
          {side(t.a, t.aEn)}<div className="vs">or</div>{side(t.b, t.bEn)}
          <div className="tip">{t.tip}</div>
        </div>
      ))}
    </>
  );
}
