// Audio map: every French item in verbs.json gets one clip, named by a slug of its text.
// Pure (no DOM), so the generator script, the app and the tests all share it.
export const slug = (t) => String(t)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
  .toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '_');

// Ordered, de-duplicated (by slug) list of everything that needs a clip.
export function audioItems(content) {
  const seen = new Map();
  const add = (text) => { if (text && !seen.has(slug(text))) seen.set(slug(text), text); };
  for (const v of content.verbs) add(v.infinitive);
  for (const v of content.verbs) for (const f of v.forms) add(f.full);
  for (const v of content.verbs) for (const s of v.sentences) add(s.fr);
  for (const t of content.traps || []) { add(t.a); add(t.b); }
  return [...seen.entries()].map(([s, text]) => ({ slug: s, text }));
}

// slug -> relative path (extension is chosen by the player: .mp3 first, .m4a for the offline fallback voice)
export function audioMap(content) {
  const map = {};
  for (const it of audioItems(content)) map[it.slug] = `audio/${it.slug}`;
  return map;
}
// Path for any French text, or null if that text has no clip (the app then falls back to speech synthesis).
export const audioPath = (text, map) => map[slug(text)] || null;
