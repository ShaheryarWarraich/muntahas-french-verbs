import React from 'react';
import { Back, SpeakerIcon } from './Art.jsx';
import { playFr } from '../audio.js';

export const TopBar = ({ title, onBack, children }) => (
  <div className="topbar">
    <button className="back" onClick={onBack} aria-label="Back"><Back /></button>
    <h2>{title}</h2>
    {children}
  </div>
);

export const Speaker = ({ text, color, size = 54, onPlay }) => (
  <button className={`btn round ${color ? `c-${color} vcfill` : ''}`} style={{ width: size, height: size }} aria-label={`Hear ${text}`}
    onClick={(e) => { e.stopPropagation(); onPlay?.(); playFr(text); }}>
    <SpeakerIcon size={Math.round(size * 0.5)} />
  </button>
);

// word shown as separate letter boxes; highlighted ones glow in the verb colour
export const Letters = ({ word, highlight = [], color }) => (
  <div className={`letters ${color ? `c-${color}` : ''}`}>
    {Array.from(word).map((ch, i) => <div key={i} className={`lt ${highlight.includes(i) ? 'hl' : ''}`}>{ch}</div>)}
  </div>
);

// pronoun grey, verb form in verb colour, rest black
export const Phrase = ({ lead, form, rest, color }) => (
  <span className={color ? `c-${color}` : ''}><span className="pn">{lead}</span><span className="vb">{form}</span><span className="rest">{rest}</span></span>
);

export const Meter = ({ readiness }) => {
  const { streak, needed, ready } = readiness;
  return (
    <div className="meter">
      <div className="dots">{Array.from({ length: needed }, (_, i) => <div key={i} className={`dot ${i < streak ? 'on' : ''}`} />)}</div>
      <div className={`lbl ${ready ? 'ready' : ''}`}>{ready ? 'Quiz-ready!' : `Quiz-ready: ${streak} of ${needed}`}</div>
    </div>
  );
};
