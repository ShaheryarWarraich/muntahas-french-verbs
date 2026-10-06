import React, { useState } from 'react';
import { TopBar } from '../components/Bits.jsx';
import { Mascot } from '../components/Art.jsx';

const VIDEOS = [
  { id: 'song', label: 'Song', file: 'video/song.mp4' },
  { id: 'lesson', label: 'Full lesson', file: 'video/final.mp4' },
];

export default function SongScreen({ go }) {
  const [tab, setTab] = useState('song');
  const [missing, setMissing] = useState({});
  const v = VIDEOS.find(x => x.id === tab);
  return (
    <div className="screen fade">
      <TopBar title="Song" onBack={() => go('home')} />
      <div className="tabs">{VIDEOS.map(x => <button key={x.id} className={`tab ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>{x.label}</button>)}</div>
      {missing[v.id]
        ? <div className="card placeholder"><Mascot mood="sleepy" size={130} /><div className="hand">Coming soon</div><div className="muted">The {v.label.toLowerCase()} is not here yet.</div></div>
        : <div className="video"><video key={v.id} controls playsInline preload="metadata" onError={() => setMissing(m => ({ ...m, [v.id]: true }))} src={`${import.meta.env.BASE_URL}${v.file}`} /></div>}
    </div>
  );
}
