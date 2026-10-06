import React from 'react';
import { Mascot, Squiggle } from '../components/Art.jsx';

export default function HomeScreen({ ctx, go }) {
  const name = ctx.content.learner.name;
  return (
    <div className="screen fade">
      <div className="hero">
        <Mascot mood="happy" size={110} />
        <div><h1>{name}</h1><Squiggle color="var(--purple)" width={200} /><div className="sub">French verbs</div></div>
      </div>
      <div className="verbcards">
        {ctx.verbs.map(v => (
          <button key={v.id} className={`card vc verbcard c-${v.color}`} onClick={() => go('learn', { verb: v.id })}>
            <div className="inf">{v.infinitive}</div>
            <div className="en">{v.en}</div>
            <div className="peek">{v.forms.slice(0, 3).map(f => f.full).join(' · ')} …</div>
          </button>
        ))}
      </div>
      <div className="mainbtns">
        <button className="btn purple big" onClick={() => go('learn')}>Learn</button>
        <button className="btn teal big" onClick={() => go('practice')}>Practice</button>
        <button className="btn yellow big" onClick={() => go('quiz')}>Timed Quiz</button>
      </div>
      <div className="links">
        <button className="btn link" onClick={() => go('numbers')}>My numbers</button>
        <button className="btn link" onClick={() => go('song')}>Song</button>
      </div>
    </div>
  );
}
