import { ok, done } from './_load.mjs';
import { checkText, checkAnswer } from '../src/core/check.js';

const s = (i, a) => checkText(i, a).status;
ok(s('sommes', ['sommes', 'nous sommes']) === 'correct', 'exact form');
ok(s('  Nous Sommes ', ['sommes', 'nous sommes']) === 'correct', 'case and spaces');
ok(s('nous sommes', ['sommes', 'nous sommes']) === 'correct', 'full phrase also accepted for the form');
ok(s('etes', ['êtes', 'vous êtes']) === 'nearly', 'missing accent is only nearly');
ok(s('ÊTES', ['êtes', 'vous êtes']) === 'correct', 'capital with accent is fine');
ok(s('vous etes', ['êtes', 'vous êtes']) === 'nearly', 'full phrase, missing accent: nearly');
ok(s('etre', 'être') === 'nearly', 'être without hat is nearly');
ok(s('êtré', 'être') === 'nearly', 'accent in the wrong place is still only nearly');
ok(s('soeur', 'sœur') === 'nearly', 'oe for ligature is nearly');
ok(s('sont', ['ont', 'ils ont']) === 'wrong', 'sont is not ont');
ok(s('es', ['est', 'il est']) === 'wrong', 'es is not est');
ok(s('', 'est') === 'empty', 'empty input');
// apostrophes
for (const t of ["j'ai", 'j’ai', 'jai', 'j ai', "J'AI", "j`ai"]) ok(s(t, ['ai', "j'ai"]) === 'correct', `apostrophe-insensitive: ${t}`);
ok(s("j'ai", ["j'ai"]) === 'correct', 'spell full j\'ai');
ok(s("j'a", ["j'ai"]) === 'wrong', "j'a is wrong");
// checkAnswer by type
ok(checkAnswer({ type: 'type', accept: ['est', 'il est'] }, 'est').status === 'correct', 'type question');
ok(checkAnswer({ type: 'choose', answer: 'sont' }, 'ont').status === 'wrong', 'choose wrong');
ok(checkAnswer({ type: 'build', tokensInOrder: ['Nous', 'avons', 'un', 'chat.'] }, ['Nous', 'avons', 'un', 'chat.']).status === 'correct', 'build right');
ok(checkAnswer({ type: 'build', tokensInOrder: ['Nous', 'avons', 'un', 'chat.'] }, ['avons', 'Nous', 'un', 'chat.']).status === 'wrong', 'build wrong');
done('check');
