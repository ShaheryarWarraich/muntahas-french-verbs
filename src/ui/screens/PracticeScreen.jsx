import React, { useRef, useState } from 'react';
import QuestionView from '../components/QuestionView.jsx';
import { TopBar } from '../components/Bits.jsx';
import { createGenerator } from '../../core/questions.js';
import { makeRecord } from '../../core/scoring.js';

export default function PracticeScreen({ ctx, store, go }) {
  const gen = useRef(null);
  if (!gen.current) gen.current = createGenerator(ctx.content, { mode: 'practice', seed: Date.now() });
  const [q, setQ] = useState(() => gen.current.next());
  const onAnswer = (res) => {
    store.savePractice(makeRecord(q, res)).catch(() => {});
    if (!res.correct) gen.current.markMissed(q);
  };
  return (
    <div className="screen fade">
      <TopBar title="Practice" onBack={() => go('home')} />
      <QuestionView key={q.id} q={q} mode="practice" onAnswer={onAnswer} onNext={() => setQ(gen.current.next())} />
    </div>
  );
}
