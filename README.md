# Word Connect

A word connect puzzle — swipe letters on a wheel to fill a crossword grid. No ads, no timers, no lives, no energy meter. Levels generate in the browser, so it never runs out.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run preview --host
```

## Install it on your phone

It's a PWA, so there's no app store step:

1. `npm run build && npm run preview --host`, or deploy `dist/` anywhere (Vercel, Netlify, a static host).
2. Open the URL on your phone. It must be `https://` or `localhost` — service workers won't register over plain http.
3. iOS Safari: Share → Add to Home Screen. Android Chrome: menu → Install app.

After the first load everything is cached, including both word lists, so it plays fully offline.

## How a level is made

Levels come from a single global plan (`createPlanner` in `src/game/generate.js`) rather than being generated in isolation. That matters: generating each level independently produced anagram collisions, so levels 5 and 6 were meat/meta and 7 and 8 were post/spot — identical puzzles back to back. The planner tracks every letter set it has already used, so that can't happen.

1. Build a candidate pool of base words per difficulty band: 4–7 letters, top 3,500 by frequency, no plurals, no words with heavy letter repetition, deduplicated by letter signature so anagrams collapse to one entry.
2. Shuffle each pool with a fixed seed, then walk it. Level N takes the next base word whose letter signature is unused and that packs successfully.
3. Find every common word spellable from the base word's letters, filtered by a 26-bit letter mask before the full multiset check.
4. Choose targets, preferring singulars — a word and its plural never both appear, and plurals only fill in when singulars can't reach the word count.
5. Pack into an interlocking crossword (`src/game/pack.js`), scoring placements by crossings minus grid size.

The plan is still fully deterministic — it's always built from level 1 with fixed seeds, so level 42 is always the same puzzle. It's built lazily and cached, so resuming at level 40 costs one short burst (~50ms) rather than anything noticeable.

## Board styles

The same level can be played two ways, switchable any time from the gear menu:

- **Crossword** — words interlock in a packed grid. Shared letters leak information, so solving one word gives you footholds in its neighbours.
- **Word list** — one row of blanks per word, shortest first. You know how many words there are and how long each is, and nothing else. Harder, because no word helps you with another.

Both read the same level data; only the presentation differs. `Grid.jsx` uses `level.placements` (positions from the packer), `WordRows.jsx` uses `level.words` and ignores the packing entirely.

Hints are keyed by word and letter position (`"point:2"`) rather than by grid coordinate, which is what lets one hint system serve both boards. In the crossword a cell shared by two words lights up if either word has that position revealed.

## Tile rendering

Tiles are extruded rather than flat, lit from a fixed source directly above. Empty slots are sockets cut into the board (inset shadow, darker than the surface); filled tiles sit proud of it with a hard side face and a soft contact shadow beneath.

The whole thing is one CSS layer scoped under `.tiles-3d`, toggled by `TILES_3D` at the top of `App.jsx`. Flat rendering is a one-line revert.

Two details that matter if you tune it:

- The side face is `--lift`, derived from cell size as `clamp(2px, cell * 0.09, 5px)`, so it stays about 9% of the tile. A fixed 4px edge looks right at 46px and absurd at the 24px cells a 9x8 Hard grid produces.
- Only `transform` animates on solve — never the shadows. A full Hard board is 60+ tiles each carrying a gradient and two shadows, and animating shadow properties would drop it off the compositor and onto the main thread. The `drop` keyframes overshoot slightly and settle, so a solved word reads as letters falling into their sockets.

Tile rendering is deliberately *not* a player setting, unlike board style. Board style changes how the puzzle plays; this only changes how it looks, and every extra toggle doubles the combinations to keep working.

## Difficulty

Three modes, defined as band tables in `MODES` at the top of `generate.js`. Each mode keeps its own level counter and its own planner, so switching difficulty resumes rather than restarts. The bonus word collection is shared across all three.

| | Starts at | Reaches | Words per level | Levels available |
|---|---|---|---|---|
| Easy | 4 letters | 6 letters | 4–5 | 747 |
| Normal | 4 letters | 7 letters | 4–8 | 623 |
| Hard | 5 letters | 7 letters | 5–8 | 540 |

Difficulty pulls three levers, and the third is deliberately held back. Letter count and words-per-level ramp across every mode. Word obscurity does not: all three modes draw from the top 3,500 words by frequency until Hard passes level 60, where the pool widens to 5,500 for base words and 6,500 for grid words. That's the one knob that turns a puzzle from hard into unfair, so it only appears once you've played sixty levels of Hard and asked for it.

A blocklist in `blocklist.js` catches what the frequency filters can't: proper nouns and abbreviations that the word list treats as ordinary English (tate, yuan, fiat, html, dept). This matters most in Hard's wide band, where the deeper pool surfaces more of them. Blocked words remain valid as bonus words. If something odd shows up in play, add it there.

## Word lists

Both live in `public/data/` and are fetched once on boot.

- `common.txt` — 8,590 words, the intersection of the Google 20k frequency list and ENABLE, in frequency order. Used for puzzle targets, with profanity stripped.
- `valid.txt` — 51,852 words, all of ENABLE at 3–7 letters. Used only to validate bonus words.

Frequency order matters: the generator uses rank cutoffs to keep obscure entries out of the grid while still accepting them as bonus words.

### Offensive words

`src/game/offensive.js` blocks a set of words from both paths: they never appear in a grid, and they aren't accepted as bonus words either. This is applied at runtime rather than by editing the shipped word lists, so the frequency ranks the generator depends on stay stable.

Roots are listed; inflections are generated, so "wank" also covers wanks, wanked, wanker and wanking. Two tiers, both blocked by default — SEVERE (slurs, explicit sexual content, sexual violence) and MILD (general profanity). Drop MILD from the union at the bottom of the file if you'd rather those were accepted as bonus words.

The list is deliberately narrower than a maximal profanity filter. Words whose ordinary sense dominates — hell, damn, screw, savage, tart, frog, nip, lame — are left in play, because blocking them costs real vocabulary for little gain. Words with an innocent sense but an unambiguous offensive one, like cock and tit, are blocked anyway: the game can't read intent, and flashing "correct!" at a slur is the failure worth avoiding.

Two things to watch when editing it. Suffix expansion is blunt: adding an `-ist` suffix once turned "ass" into a block on "assist". And check additions against the frequency list before committing — 11 words in the top 4,000 are currently blocked, and that number rising sharply means something innocent got caught.

Three-letter words are the exception, and they get a hand-checked allowlist in `src/game/shortwords.js`. Frequency can't filter them — "tel" ranks 935 because of `tel:` phone links, and "sol", "tas" and "ser" all rank above genuinely common words. They're still playable as bonus words; they just never appear in a grid.

## Layout

```
src/
  App.jsx              game state, word checking, coins, hints
  components/Grid.jsx  crossword grid, sizes cells to fit the viewport
  components/Wheel.jsx pointer-driven letter wheel and connection thread
  game/generate.js     level generation
  game/pack.js         crossword packer
  game/dictionary.js   word list loading
  game/storage.js      localStorage progress
  game/util.js         seeded RNG, letter counting
```

Progress is one localStorage key, `wordconnect.progress.v1`: current level, coins, words solved on the current level, and the bonus word collection. Close the tab mid-level and you come back to it. "Reset all progress" is behind the collection sheet.

Bonus words are collected permanently rather than per level. Finding one you already have is acknowledged ("already collected") but doesn't pay out again, so the same easy words stop being a recurring coin source.

## Design

Dark ink background with bone letter tiles and a single amber accent — built for playing in the evening, which is when these games actually get played. Fraunces for letterforms (the letters are the content, so they get the characterful face), IBM Plex Mono for the HUD. The only piece of motion that matters is the stagger as a solved word flips into the grid.

## Things you might want next

- Daily puzzle: seed the RNG from the date instead of the level number.
- Hint targeting: right now a hint reveals a random unsolved letter, not one you chose.
- More base words: `BASE_RANK` caps how many levels exist. Raising it extends every mode.
- Per-board difficulty: word list is meaningfully harder than crossword at the same level, so the two could ramp differently.
- Word meanings: tap a solved word for a definition.
- Level themes: constrain base words by category rather than frequency.
