// Everything the app knows comes from public/content/verbs.json. This file only derives handy views of it.
export function indexContent(content) {
  const verbs = content.verbs;
  const verbById = Object.fromEntries(verbs.map(v => [v.id, v]));
  const pronounEn = Object.fromEntries(content.pronouns.map(p => [p.fr, p]));
  const items = [];
  for (const v of verbs) for (const f of v.forms) {
    items.push({
      key: `${v.id}:${f.pronoun}`, verbId: v.id, infinitive: v.infinitive, verbEn: v.en, color: v.color,
      pronoun: f.pronoun, form: f.form, full: f.full, en: f.en, contracted: !!f.contracted,
      lead: f.full.slice(0, f.full.length - f.form.length),
    });
  }
  const itemByKey = Object.fromEntries(items.map(i => [i.key, i]));
  const itemByFull = Object.fromEntries(items.map(i => [i.full.toLowerCase(), i]));

  const sentences = [];
  for (const v of verbs) for (const s of v.sentences) {
    const item = itemByKey[`${v.id}:${s.pronoun}`];
    const lead = item.lead;
    const tail = s.fr.slice(lead.length + s.form.length);
    sentences.push({ ...s, verbId: v.id, key: item.key, color: v.color, infinitive: v.infinitive, lead: s.fr.slice(0, lead.length), tail });
  }

  // Trap pairs between two single forms (ils sont / ils ont). Others are sentence traps (age).
  const formTraps = []; const sentenceTraps = [];
  for (const t of content.traps || []) {
    const a = itemByFull[t.a.toLowerCase()], b = itemByFull[t.b.toLowerCase()];
    if (a && b) formTraps.push({ ...t, formA: a.form, formB: b.form, itemA: a, itemB: b });
    else sentenceTraps.push(t);
  }
  const partnerOf = {}; // form -> Set of forms it is confused with
  for (const t of formTraps) {
    (partnerOf[t.formA] ||= new Set()).add(t.formB);
    (partnerOf[t.formB] ||= new Set()).add(t.formA);
  }
  // Split any French phrase that starts with a known "pronoun + form" (e.g. "ils sont", "j'ai dix ans") into coloured parts.
  const fullsLongestFirst = items.slice().sort((a, b) => b.full.length - a.full.length);
  const splitPhrase = (text) => {
    const low = text.toLowerCase();
    const it = fullsLongestFirst.find(i => low.startsWith(i.full.toLowerCase()) && (low.length === i.full.length || /[\s.!?]/.test(low[i.full.length])));
    if (!it) return null;
    return { lead: text.slice(0, it.lead.length), form: text.slice(it.lead.length, it.full.length), rest: text.slice(it.full.length), color: it.color, item: it };
  };
  return { splitPhrase, content, verbs, verbById, pronounEn, items, itemByKey, itemByFull, sentences, formTraps, sentenceTraps, partnerOf };
}

// Returns a list of problems (empty = fine). Used by the test and as a runtime sanity check.
export function validateContent(c) {
  const errs = []; const err = m => errs.push(m);
  if (!c || typeof c !== 'object') return ['content is not an object'];
  if (!c.learner?.name) err('learner.name missing');
  if (!Array.isArray(c.pronouns) || c.pronouns.length !== 8) err('pronouns must be 8 entries');
  const prons = new Set((c.pronouns || []).map(p => p.fr));
  for (const p of c.pronouns || []) { if (!p.fr || !p.en) err(`pronoun incomplete: ${JSON.stringify(p)}`); }
  if (!Array.isArray(c.verbs) || c.verbs.length < 2) err('need at least two verbs');
  const ids = new Set();
  for (const v of c.verbs || []) {
    if (!v.id || !v.infinitive || !v.en || !v.color) err(`verb incomplete: ${v.id}`);
    if (ids.has(v.id)) err(`duplicate verb id ${v.id}`); ids.add(v.id);
    if (!['purple', 'teal'].includes(v.color)) err(`verb ${v.id}: colour must be purple or teal`);
    const fp = new Set();
    for (const f of v.forms || []) {
      for (const k of ['pronoun', 'form', 'full', 'en']) if (!f[k]) err(`${v.id}: form missing ${k}`);
      if (!prons.has(f.pronoun)) err(`${v.id}: unknown pronoun ${f.pronoun}`);
      if (fp.has(f.pronoun)) err(`${v.id}: duplicate pronoun ${f.pronoun}`); fp.add(f.pronoun);
      if (f.full && f.form && !f.full.endsWith(f.form)) err(`${v.id}: full "${f.full}" must end with form "${f.form}"`);
      if (f.full && f.form && f.full.length === f.form.length) err(`${v.id}: full has no pronoun lead: ${f.full}`);
    }
    if (fp.size !== 8) err(`${v.id}: needs all 8 pronouns, has ${fp.size}`);
    for (const t of v.spelling || []) {
      if (!t.word || !t.tip || !Array.isArray(t.highlight)) err(`${v.id}: bad spelling tip ${JSON.stringify(t)}`);
      else { const n = Array.from(t.word).length; if (t.highlight.some(i => !Number.isInteger(i) || i < 0 || i >= n)) err(`${v.id}: highlight out of range for ${t.word}`); }
    }
    const sp = new Set();
    for (const s of v.sentences || []) {
      for (const k of ['fr', 'en', 'form', 'pronoun', 'rest']) if (!s[k]) err(`${v.id}: sentence missing ${k}: ${s.fr}`);
      const f = (v.forms || []).find(x => x.pronoun === s.pronoun);
      if (!f) { err(`${v.id}: sentence pronoun unknown: ${s.fr}`); continue; }
      if (f.form !== s.form) err(`${v.id}: sentence form ${s.form} does not match table (${f.form}): ${s.fr}`);
      const lead = f.full.slice(0, f.full.length - f.form.length);
      if (s.fr.slice(0, f.full.length).toLowerCase() !== f.full.toLowerCase()) err(`${v.id}: sentence should start with "${f.full}": ${s.fr}`);
      if (!s.fr.includes(s.rest)) err(`${v.id}: rest "${s.rest}" not in "${s.fr}"`);
      sp.add(s.pronoun);
      void lead;
    }
  }
  if (!Array.isArray(c.traps) || c.traps.length < 1) err('traps missing');
  for (const t of c.traps || []) for (const k of ['a', 'aEn', 'b', 'bEn', 'tip']) if (!t[k]) err(`trap missing ${k}`);
  if (!Array.isArray(c.vocabulary)) err('vocabulary missing');
  for (const w of c.vocabulary || []) if (!w.fr || !w.en) err(`vocabulary incomplete ${JSON.stringify(w)}`);
  return errs;
}

// Gentle notes (not errors): content gaps the app copes with, e.g. a form with no example sentence.
export function contentWarnings(c) {
  const out = [];
  for (const v of c.verbs) for (const f of v.forms) if (!v.sentences.some(s => s.pronoun === f.pronoun)) out.push(`${v.id}: no sentence for "${f.full}" (sentence-based questions skip it)`);
  return out;
}
