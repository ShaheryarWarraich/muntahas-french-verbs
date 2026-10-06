// Question generator. Pure: give it the content, get an endless balanced stream of questions.
//  Item-first: the next (verb, pronoun) is the least-used one that is not the one just asked, so verbs and
//  pronouns stay balanced and the same item never comes twice in a row. The type is then drawn by weight
//  among the types that make sense for that item.
import { indexContent } from './content.js';
import { mulberry32, pick, shuffle, weightedPick } from './rng.js';

export const TYPES = ['type', 'choose', 'trap', 'translate', 'build', 'spell', 'which'];
export const TYPE_NAMES = { type: 'Type it', choose: 'Choose', trap: 'Which one?', translate: 'Say it in French', build: 'Build it', spell: 'Spell it', which: 'Être or avoir?' };
export const WEIGHTS = {
  practice: { type: 2, choose: 2, trap: 2.2, translate: 1.6, build: 1.2, spell: 1.2, which: 1.4 },
  timed: { type: 4.5, choose: 1.4, trap: 3.5, translate: 1, build: 0.25, spell: 0.4, which: 1.2 },
};

export function createGenerator(content, { mode = 'practice', seed = Date.now(), retry = mode === 'practice' } = {}) {
  const ctx = indexContent(content);
  const rng = mulberry32(seed);
  const weights = WEIGHTS[mode] || WEIGHTS.practice;
  const counts = Object.fromEntries(ctx.items.map(i => [i.key, 0]));
  const queue = [];
  let last = null, lastType = null, n = 0, nextId = 1;

  const sentencesFor = (item) => ctx.sentences.filter(s => s.key === item.key);
  const pickSentence = (item, preferTip) => {
    const all = sentencesFor(item);
    const tipped = all.filter(s => s.tip);
    return preferTip && tipped.length && rng() < 0.7 ? pick(rng, tipped) : pick(rng, all);
  };

  function formDistractors(item) {
    const out = []; const used = new Set([item.form]);
    const add = (f) => { if (f && !used.has(f)) { used.add(f); out.push(f); } };
    for (const p of ctx.partnerOf[item.form] || []) add(p);
    add(ctx.items.find(i => i.pronoun === item.pronoun && i.verbId !== item.verbId)?.form);
    for (const i of shuffle(rng, ctx.items.filter(i => i.verbId === item.verbId))) add(i.form);
    for (const i of shuffle(rng, ctx.items)) add(i.form);
    return out.slice(0, 3);
  }
  function fullDistractors(item) {
    const out = []; const used = new Set([item.full]);
    const add = (i) => { if (i && !used.has(i.full) && i.en !== item.en) { used.add(i.full); out.push(i.full); } };
    add(ctx.items.find(i => i.pronoun === item.pronoun && i.verbId !== item.verbId));
    for (const i of shuffle(rng, ctx.items.filter(i => i.verbId === item.verbId))) add(i);
    for (const i of shuffle(rng, ctx.items)) add(i);
    return out.slice(0, 3);
  }

  function build(type, item) {
    const base = { id: nextId++, type, mode, key: item.key, verbId: item.verbId, pronoun: item.pronoun, full: item.full, en: item.en, color: item.color };
    switch (type) {
      case 'type':
        return { ...base, lead: item.lead, infinitive: item.infinitive, verbEn: item.verbEn, accept: [item.form, item.full], reveal: item.full, prompt: `${item.lead}___ (${item.infinitive})` };
      case 'choose':
        return { ...base, lead: item.lead, infinitive: item.infinitive, verbEn: item.verbEn, options: shuffle(rng, [item.form, ...formDistractors(item)]), answer: item.form, reveal: item.full, prompt: `${item.lead}___ (${item.infinitive})` };
      case 'trap': {
        const s = pickSentence(item, false);
        const partner = pick(rng, [...ctx.partnerOf[item.form]]);
        const trap = ctx.formTraps.find(t => (t.formA === item.form && t.formB === partner) || (t.formB === item.form && t.formA === partner));
        return { ...base, sentence: s.fr, lead: s.lead, tail: s.tail, en: s.en, options: shuffle(rng, [item.form, partner]), answer: item.form, reveal: s.fr, tip: trap?.tip, prompt: `${s.lead}___${s.tail}` };
      }
      case 'translate':
        return { ...base, options: shuffle(rng, [item.full, ...fullDistractors(item)]), answer: item.full, reveal: item.full, prompt: item.en };
      case 'build': {
        const s = pickSentence(item, false);
        const tokens = s.fr.split(' ');
        let tiles = shuffle(rng, tokens.map((text, i) => ({ id: i, text })));
        for (let tries = 0; tries < 5 && tokens.length > 1 && tiles.every((t, i) => t.id === i); tries++) tiles = shuffle(rng, tiles);
        return { ...base, en: s.en, sentence: s.fr, tiles, tokensInOrder: tokens, reveal: s.fr, prompt: s.en };
      }
      case 'spell':
        return { ...base, accept: [item.full], showMs: 2400, reveal: item.full, prompt: item.en };
      case 'which': {
        const s = pickSentence(item, true);
        return { ...base, sentence: s.fr, en: s.en, options: ctx.verbs.map(v => ({ id: v.id, infinitive: v.infinitive, en: v.en, color: v.color })), answer: item.verbId, reveal: item.infinitive, tip: s.tip, prompt: s.fr };
      }
      default: throw new Error('unknown type ' + type);
    }
  }

  function chooseItem() {
    const due = queue.findIndex(r => r.due <= n && r.key !== last);
    if (due >= 0) return ctx.itemByKey[queue.splice(due, 1)[0].key];
    const cands = ctx.items.filter(i => i.key !== last);
    const min = Math.min(...cands.map(i => counts[i.key]));
    const least = cands.filter(i => counts[i.key] === min);
    // tie-break toward the verb asked less so far, so être and avoir stay level
    const vTotal = (id) => ctx.items.filter(i => i.verbId === id).reduce((s, i) => s + counts[i.key], 0);
    const vMin = Math.min(...least.map(i => vTotal(i.verbId)));
    return pick(rng, least.filter(i => vTotal(i.verbId) === vMin));
  }
  const SENTENCE_TYPES = ['trap', 'build', 'which']; // need an example sentence for the item
  const feasible = (item) => TYPES.filter(t => (t !== 'trap' || ctx.partnerOf[item.form]) && (!SENTENCE_TYPES.includes(t) || sentencesFor(item).length));

  return {
    ctx, counts,
    next() {
      const item = chooseItem();
      let types = feasible(item);
      if (types.length > 1) types = types.filter(t => t !== lastType);
      // "Which verb?" is where the age trap (j'ai dix ans) lives, so it is much more likely for an item that has a tip sentence.
      const hasTip = sentencesFor(item).some(s => s.tip);
      const type = weightedPick(rng, types.map(t => [t, weights[t] * (t === 'which' && hasTip ? 6 : 1)]));
      counts[item.key]++; last = item.key; lastType = type; n++;
      return build(type, item);
    },
    // Gentle repeat: the item comes back a few questions later (practice only by default).
    markMissed(q) {
      if (!retry || queue.some(r => r.key === q.key)) return;
      queue.push({ key: q.key, due: n + 3 + Math.floor(rng() * 3) });
    },
  };
}
