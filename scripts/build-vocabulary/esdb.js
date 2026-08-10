/**
 * ESDB (English Spell-checker DataBase) loader.
 *
 * Reads from scowl.db — the SQLite database produced by running `make`
 * in the en-wl/wordlist repository (https://github.com/en-wl/wordlist).
 *
 * SETUP
 *   git clone https://github.com/en-wl/wordlist
 *   cd wordlist && make
 *   cp scowl.db /path/to/wordmill/data/sources/esdb/scowl.db
 *
 * Returns a Map<word, { tier: number, proper: boolean, hacker: boolean }>
 * for every lowercase 3–7 letter word in US English.
 *
 * Key fields used from scowl.db:
 *   scowl_data.size     — ESDB tier (10, 20, 35, 50, 55, 60, 70, 80, 85, 95)
 *                         Lower = more common.
 *   scowl_data.region   — '' (universal) or 'US' | 'GB' | 'CA' | 'AU'
 *                         We keep '' and 'US' only.
 *   scowl_data.category — '' (normal) | 'hacker' | 'roman-numerals'
 *                         We exclude roman-numerals; flag hacker words.
 *   scowl_data.tag      — '[name]' marks proper nouns sourced from name lists.
 *   words.pos           — 'np' = proper noun (possessive/plural of proper noun).
 *                         Also used to identify proper nouns alongside [name] tag.
 */

import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { existsSync } from 'fs';

const DB_FILENAME = 'scowl.db';

// The query returns one row per unique lowercase word, taking the minimum
// (most common) size across all matching scowl_data entries, and flagging
// whether any entry marks it as a proper noun or hacker-category term.
const QUERY = `
  SELECT
    w.word,
    MIN(sd.size)                                                        AS tier,
    MAX(CASE WHEN w.pos = 'np' OR sd.tag = '[name]' THEN 1 ELSE 0 END) AS proper,
    MAX(CASE WHEN sd.category = 'hacker'             THEN 1 ELSE 0 END) AS hacker
  FROM words w
  JOIN scowl_data sd ON w.group_id = sd.group_id
  WHERE (sd.region = '' OR sd.region = 'US')
    AND sd.category != 'roman-numerals'
    AND w.word GLOB '[a-z][a-z][a-z]*'
    AND length(w.word) BETWEEN 3 AND 7
  GROUP BY w.word
`;

export function loadEsdb(sourcesDir) {
  const dbPath = join(sourcesDir, 'esdb', DB_FILENAME);

  if (!existsSync(dbPath)) {
    throw new Error(
      `scowl.db not found at ${dbPath}\n\n` +
      `To generate it:\n` +
      `  git clone https://github.com/en-wl/wordlist\n` +
      `  cd wordlist && make\n` +
      `  cp scowl.db ${dbPath}\n`
    );
  }

  const db = new DatabaseSync(dbPath, { open: true });
  const rows = db.prepare(QUERY).all();
  db.close();

  const words = new Map();
  for (const row of rows) {
    // The GLOB '[a-z]*' in the SQL query allows apostrophes and periods after
    // the first characters. Guard here so only pure alpha words enter the pipeline.
    if (!/^[a-z]+$/.test(row.word)) continue;
    words.set(row.word, {
      tier:   row.tier,
      proper: row.proper === 1,
      hacker: row.hacker === 1,
    });
  }

  return words;
}

/** Per-tier and cumulative word counts — printed by the pipeline for reporting. */
export function tierCounts(words) {
  const TIERS = [35, 40, 50, 60, 65, 70, 80, 85, 95];
  const perTier = Object.fromEntries(TIERS.map(t => [t, 0]));

  for (const { tier } of words.values()) {
    if (perTier[tier] !== undefined) perTier[tier]++;
    else perTier[tier] = 1; // unexpected tier
  }

  let cum = 0;
  const cumulative = {};
  for (const t of TIERS) {
    cum += (perTier[t] || 0);
    cumulative[t] = cum;
  }

  return { perTier, cumulative };
}
