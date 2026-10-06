// Answer checker. Pure.
const APOS = /[’‘ʼ`´]/g;
export const norm = (s) => String(s ?? '').replace(APOS, "'").replace(/\s+/g, ' ').trim().toLowerCase();
export const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
// Apostrophes (and the space after j') do not matter when the expected text has one: jai, j ai, j'ai, j’ai all match j'ai.
const key = (s, expected) => (expected.includes("'") ? s.replace(/['\s]/g, '') : s);

// accepted: string or array of strings (any one may be typed).
// -> { status: 'correct' | 'nearly' | 'wrong' | 'empty', matched? }
export function checkText(input, accepted) {
  const list = (Array.isArray(accepted) ? accepted : [accepted]).map(norm);
  const typed = norm(input);
  if (!typed) return { status: 'empty' };
  for (const acc of list) if (key(typed, acc) === key(acc, acc)) return { status: 'correct', matched: acc };
  for (const acc of list) if (stripAccents(key(typed, acc)) === stripAccents(key(acc, acc))) return { status: 'nearly', matched: acc };
  return { status: 'wrong' };
}

// Check a question's answer. `answer` depends on type:
//  type/spell: typed string · choose/trap/translate: chosen option string · which: chosen verb id · build: array of tokens
export function checkAnswer(q, answer) {
  switch (q.type) {
    case 'type': return checkText(answer, q.accept);
    case 'spell': return checkText(answer, q.accept);
    case 'build': {
      const built = (answer || []).join(' ');
      return { status: built === q.tokensInOrder.join(' ') ? 'correct' : 'wrong' };
    }
    default: return { status: answer === q.answer ? 'correct' : 'wrong' };
  }
}
export const isTyped = (q) => q.type === 'type' || q.type === 'spell';
