/**
 * LDNOOBW (List of Dirty, Naughty, Obscene, and Otherwise Bad Words) loader.
 * MIT licensed. https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
 *
 * Downloads the English word list on first run and caches it to
 * data/sources/ldnoobw/en.txt. Subsequent runs use the cached file.
 *
 * Each root word is expanded to its common inflections using the same
 * morphological rules as the game's existing offensive.js, so "wank"
 * also catches wanks, wanked, wanker, wankers, wanking.
 *
 * Returns a Set<string> of all blocked word forms (3–7 letters, lowercase).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LDNOOBW_URL =
  'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en';

export async function loadLdnoobw(sourcesDir) {
  const dir = join(sourcesDir, 'ldnoobw');
  const file = join(dir, 'en.txt');

  if (!existsSync(file)) {
    console.log('  Downloading LDNOOBW en list...');
    mkdirSync(dir, { recursive: true });
    const res = await fetch(LDNOOBW_URL);
    if (!res.ok) throw new Error(`LDNOOBW download failed: ${res.status} ${res.statusText}`);
    const text = await res.text();
    writeFileSync(file, text, 'utf8');
    console.log(`  Saved to ${file}`);
  } else {
    console.log(`  Using cached LDNOOBW list at ${file}`);
  }

  const roots = readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && /^[a-z]+$/.test(l));

  const expanded = new Set();
  for (const root of roots) {
    for (const form of expandRoot(root)) {
      expanded.add(form);
    }
  }

  return expanded;
}

// ---------------------------------------------------------------------------
// Morphological expansion — mirrors the logic in src/game/offensive.js so
// that both systems produce the same inflection coverage.
// ---------------------------------------------------------------------------

const SUFFIXES = ['', 's', 'es', 'ed', 'er', 'ers', 'ing', 'y', 'ies', 'ier', 'iest'];

function expandRoot(root) {
  const out = new Set();

  const add = (w) => {
    if (w.length >= 3 && w.length <= 7) out.add(w);
  };

  for (const suffix of SUFFIXES) {
    add(root + suffix);

    // Drop trailing 'e' before vowel suffix: "molest" → "molesting"
    if (root.endsWith('e') && /^[aeiouy]/.test(suffix)) {
      add(root.slice(0, -1) + suffix);
    }

    // Double final consonant before vowel suffix: "shit" → "shitty", "fag" → "fagged"
    if (/[aeiou][bcdfglmnprstz]$/.test(root) && /^[aeiouy]/.test(suffix)) {
      add(root + root[root.length - 1] + suffix);
    }
  }

  // y → ies / ied
  if (root.endsWith('y')) {
    add(root.slice(0, -1) + 'ies');
    add(root.slice(0, -1) + 'ied');
  }

  return [...out];
}
