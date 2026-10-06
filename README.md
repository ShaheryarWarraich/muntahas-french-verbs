# Muntaha's French Verbs

A small offline app (PWA) for learning and quizzing **être** and **avoir** (present tense, grade 5). Purple is être, teal is avoir.
It looks like a pencil-drawn notebook page, with a little fluffy friend. All words on screen are English; every French word shows its English meaning.

## How she uses it

- **Learn** – pick être or avoir. *Table*: tap a row to hear it and flip it into a spelling card (the tricky letters glow, plus a tip). Tap the speaker to hear without flipping. *Sentences*: pronoun grey, verb coloured, English underneath. *Traps*: sont/ont, es/est, as/a, and the age trap (j'ai dix ans).
- **Practice** – no clock, no pressure. Seven kinds of question, mixed: type the form, choose the form, trap pick (sont / ont), translate, build the sentence, spell it, and "être or avoir?". Typing questions have an on-screen keyboard with é è ê à ç œ '. A wrong answer says "Not yet", shows the right one, lets her try again, and the item comes back a few questions later. A missing accent says "Nearly! Watch the accent."
- **Timed Quiz** – 60 s, 2 min or 3 min. One question at a time, big countdown, skip allowed, mostly typing and traps (the school quiz is written). At the end: correct, tried, accuracy, correct per minute, best streak, what she missed with the right answers, and the **quiz-ready** meter. A missing accent counts as wrong in the quiz but shows the fix.
- **My numbers** – best score per length, last 10 runs, accuracy trend (dashed line = 90%), weakest forms (3+ tries), accuracy per verb, questions answered, quiz-ready meter, and **Export JSON**.
- **Song** – plays `public/video/song.mp4` (and `public/video/final.mp4` as "Full lesson"). If a file is missing it shows a friendly "Coming soon" card.

**Quiz-ready** = two timed runs in a row, each with accuracy of at least 90%, at least 20 questions tried, and both verbs asked.

Everything she does is saved on the device (IndexedDB: `results` = every timed run with per-question records, `attempts` = practice answers). Nothing leaves the device.

## Changing the content

All content lives in `public/content/verbs.json` (pronouns, forms, spelling tips with highlight positions, sentences, traps, vocabulary). Never edit the code for content. After editing it:

```
npm run test:sim     # validates the JSON shape and re-runs all checks
npm run audio        # makes clips for any new French text (existing files are skipped)
```

Note: `avoir` has no sentence for *elles ont*, so sentence-based questions simply skip that form. Add a sentence to the JSON to include it.

## Run it

```
export PATH=~/.local/node22/bin:$PATH
npm install
npm run dev          # http://localhost:5182 (also on the network address, for the tablet)
npm run test:sim     # headless tests (node + fake-indexeddb)
npm run build        # production build in dist/
npm run deploy       # build and publish dist/ to the gh-pages branch
```

`npm run deploy` pushes to the git remote named `origin`, so this folder needs `git init` and `git remote add origin <repo-url>` first (as with the other apps). Then turn on GitHub Pages for the `gh-pages` branch. Open the page once with internet, then it works offline. It uses relative paths (`base: './'`), so it works under any sub-folder.

## Audio

`npm run audio` (`scripts/gen-audio.mjs`) makes one clip per French item: each infinitive, each form ("nous sommes"), each sentence, and the trap phrases, named by a slug of the text (`nous_sommes.mp3`, see `src/core/audio.js`).
It uses ElevenLabs (voice `pFZP5JQG7iQjIQuC4Bku`, model `eleven_multilingual_v2`) with the key `ELEVENLABS_API_KEY` read from `~/Apps/video-factory/.env` (never printed). With no key, or with `--say`, it falls back to the macOS voice Thomas (`.m4a`). Existing clips are skipped. If a clip is missing the app uses the device's French speech voice.

## Song and lesson videos

Drop a 1920x1080 `song.mp4` (and optionally `final.mp4`) into `public/video/` and rebuild. If every video present is under 25 MB it is included in the offline cache; if any is bigger, the videos are streamed normally and are not cached (the app still works offline, just without the video).

## Icons

`npm run icons` redraws `public/icons/icon.svg` and renders `icon-192.png` / `icon-512.png` (macOS `sips`).

## Code map

- `src/core/` – no UI: `content.js` (derived views + validation), `questions.js` (balanced generator), `check.js` (answer checker, accent and apostrophe rules), `scoring.js` (summary, readiness, numbers), `storage.js` + `db.js` (IndexedDB), `audio.js` (slug + map), `rng.js`.
- `src/ui/` – React screens and components, `styles.css` (notebook look in CSS/SVG).
- `test/` – `content.mjs`, `check.mjs`, `questions.mjs` (500 questions: balance, no repeats), `scoring.mjs`, `storage.mjs`.
