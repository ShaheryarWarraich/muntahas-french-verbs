import React, { useEffect, useState } from 'react';
import { openDB, memoryDB } from './core/db.js';
import { createStorage } from './core/storage.js';
import { indexContent, validateContent } from './core/content.js';
import { PencilDefs, Mascot } from './ui/components/Art.jsx';
import { initAudio, primeAudio, stopAudio } from './ui/audio.js';
import HomeScreen from './ui/screens/HomeScreen.jsx';
import LearnScreen from './ui/screens/LearnScreen.jsx';
import PracticeScreen from './ui/screens/PracticeScreen.jsx';
import QuizScreen from './ui/screens/QuizScreen.jsx';
import NumbersScreen from './ui/screens/NumbersScreen.jsx';
import SongScreen from './ui/screens/SongScreen.jsx';

export default function App() {
  const [boot, setBoot] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState({ name: 'home', params: {} });

  useEffect(() => {
    (async () => {
      try {
        const content = await fetch(`${import.meta.env.BASE_URL}content/verbs.json`).then(r => r.json());
        const errs = validateContent(content);
        if (errs.length) console.warn('content problems', errs);
        initAudio(content);
        let db; try { db = await openDB(); } catch { db = memoryDB(); }
        setBoot({ ctx: indexContent(content), store: createStorage(db) });
      } catch (e) { setError(String(e)); }
    })();
    const f = () => { primeAudio(); window.removeEventListener('pointerdown', f); };
    window.addEventListener('pointerdown', f);
  }, []);

  const go = (name, params = {}) => { stopAudio(); setView({ name, params }); window.scrollTo(0, 0); };
  const body = (() => {
    if (error) return <div className="screen center"><h2>Something broke</h2><div className="muted">{error}</div></div>;
    if (!boot) return <div className="screen center"><Mascot mood="sleepy" size={110} /></div>;
    const p = { ctx: boot.ctx, store: boot.store, go, params: view.params };
    switch (view.name) {
      case 'learn': return <LearnScreen {...p} />;
      case 'practice': return <PracticeScreen {...p} />;
      case 'quiz': return <QuizScreen {...p} />;
      case 'numbers': return <NumbersScreen {...p} />;
      case 'song': return <SongScreen {...p} />;
      default: return <HomeScreen {...p} />;
    }
  })();
  return <><PencilDefs />{body}</>;
}
