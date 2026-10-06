import { content, ok, done } from './_load.mjs';
import { validateContent, contentWarnings, indexContent } from '../src/core/content.js';
import { audioItems, slug } from '../src/core/audio.js';

const errs = validateContent(content);
errs.forEach(e => ok(false, e));
contentWarnings(content).forEach(w => console.log('  note: ' + w));
const ctx = indexContent(content);
ok(ctx.items.length === 16, '16 verb x pronoun items');
ok(ctx.sentences.length >= 15, 'sentences present');
for (const s of ctx.sentences) ok(s.lead + s.form + s.tail === s.fr, `sentence splits cleanly: ${s.fr}`);
ok(ctx.formTraps.length >= 3, 'at least three form traps (sont/ont, es/est, as/a)');
ok(ctx.sentenceTraps.length >= 1, 'age trap present');
for (const f of ['sont', 'ont', 'es', 'est', 'as', 'a']) ok(ctx.partnerOf[f]?.size >= 1, `${f} has a trap partner`);
ok(ctx.verbById.etre.color === 'purple' && ctx.verbById.avoir.color === 'teal', 'etre purple, avoir teal');
const avoirJe = ctx.itemByKey['avoir:je'];
ok(avoirJe.contracted && avoirJe.lead === "j'", "j'ai lead is j'");
// every spelling tip word must be a form, a full or an infinitive of its verb
for (const v of content.verbs) for (const t of v.spelling) {
  const known = [v.infinitive, ...v.forms.map(f => f.form), ...v.forms.map(f => f.full)];
  ok(known.includes(t.word), `spelling word "${t.word}" belongs to ${v.id}`);
}
// audio: one clip per slug, no collisions with different text
const items = audioItems(content);
ok(new Set(items.map(i => i.slug)).size === items.length, 'audio slugs unique');
ok(items.length >= 30, `about 40 clips (got ${items.length})`);
ok(slug('être') === 'etre' && slug("j'ai") === 'jai' && slug('Nous sommes amis.') === 'nous_sommes_amis' && slug('sœur') === 'soeur', 'slug rules');
// a deliberately broken copy is rejected
const bad = JSON.parse(JSON.stringify(content)); bad.verbs[0].forms.pop();
ok(validateContent(bad).length > 0, 'validator catches a missing form');
done('content');
