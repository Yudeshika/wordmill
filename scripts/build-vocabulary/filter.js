/**
 * Word metadata builder and eligibility rules.
 *
 * buildMetadata() takes the ESDB and LDNOOBW datasets and produces a unified
 * Map<word, metadata> for every candidate word. The LLM classifier and
 * override step then augment this map in-place.
 *
 * Eligibility rules determine whether a word belongs in:
 *   - the puzzle list  (common.txt equivalent — target and sub-words in the grid)
 *   - the bonus list   (valid.txt equivalent  — accepted when a player finds them)
 *
 * ---
 * ESDB TIER → DIFFICULTY MAPPING
 *
 * ESDB tiers are an ordinal scale: lower = more common.
 * We use them as a stand-in for frequency rank until wordfreq is added.
 *
 *   Tier ≤ 35  →  STANDARD pool   (replaces rank ≤ STANDARD_BASE in generate.js)
 *   Tier ≤ 55  →  WIDE pool       (replaces rank ≤ WIDE_BASE)
 *   Tier ≤ 60  →  puzzle-eligible at all (max puzzle tier)
 *   Tier ≤ 70  →  bonus-eligible  (valid but not in the grid)
 *
 * After running the pipeline for the first time, print the word counts per
 * tier boundary and update the constants in generate.js accordingly:
 *   STANDARD_BASE  = count of puzzle words with tier ≤ 35
 *   WIDE_BASE      = count of puzzle words with tier ≤ 55
 *   WIDE_TARGET    = count of puzzle words with tier ≤ 60
 */

// ---------------------------------------------------------------------------
// Tier thresholds — based on the actual ESDB tiers present for 3–7 letter
// US English words: 35, 40, 50, 60, 65, 70, 80, 85, 95.
// Adjust to taste after checking the counts printed by the pipeline.
// ---------------------------------------------------------------------------
export const THRESHOLDS = {
  STANDARD: 35,   // ~20k words — "standard" difficulty (well-known everyday words)
  WIDE:     50,   // ~27k words — "wide" difficulty (less common but recognisable)
  PUZZLE:   60,   // ~32k words — maximum tier for puzzle inclusion
  BONUS:    70,   // ~45k words — valid bonus words (accepted but not put in grid)
};

// Word length constraints — match the game's current 3–7 letter rule.
const MIN_LEN = 3;
const MAX_LEN = 7;

/**
 * Build a unified metadata map from source datasets.
 * The LLM classifier and override step will add/update the `llm` and
 * `override` fields after this call.
 */
export function buildMetadata(esdbWords, profanitySet) {
  const metadata = new Map();

  for (const [word, esdb] of esdbWords) {
    if (word.length < MIN_LEN || word.length > MAX_LEN) continue;

    metadata.set(word, {
      word,
      esdbTier:   esdb.tier,
      properNoun: esdb.proper,
      hacker:     esdb.hacker,  // ESDB 'hacker' category: tech abbreviations/jargon
      profane:    profanitySet.has(word),
      llm:        null,     // filled by llm-classify.js
      override:   null,     // 'allow' | 'deny' | null, filled by overrides step
    });
  }

  return metadata;
}

/** Apply manual overrides to the metadata map. */
export function applyOverrides(metadata, overrides) {
  for (const word of (overrides.deny || [])) {
    if (metadata.has(word)) {
      metadata.get(word).override = 'deny';
    } else {
      // Word not in ESDB — add a stub so it's definitely excluded.
      metadata.set(word, {
        word,
        esdbTier:   999,
        properNoun: false,
        profane:    true,
        llm:        null,
        override:   'deny',
      });
    }
  }

  for (const word of (overrides.allow || [])) {
    if (metadata.has(word)) {
      metadata.get(word).override = 'allow';
    }
    // If the word isn't in ESDB at all, an 'allow' override can't rescue it —
    // we have no tier to place it in the difficulty system.
    // Log a warning during emit instead.
  }
}

// ---------------------------------------------------------------------------
// Eligibility predicates
// ---------------------------------------------------------------------------

function llmFlags(meta) {
  return meta.llm || {
    archaic: false, technical: false, regional: false,
    sensitive: false, abbreviation: false,
  };
}

/** True if the word may appear in the puzzle grid or as a grid sub-word. */
export function isEligibleForPuzzle(meta) {
  if (meta.override === 'deny')  return false;
  if (meta.override === 'allow') return true;

  if (meta.properNoun)           return false;
  if (meta.profane)              return false;
  if (meta.hacker)               return false;  // tech abbreviations/jargon from ESDB
  if (meta.esdbTier > THRESHOLDS.PUZZLE) return false;

  const llm = llmFlags(meta);
  if (llm.archaic)               return false;
  if (llm.technical)             return false;
  if (llm.regional)              return false;
  if (llm.sensitive)             return false;
  if (llm.abbreviation)          return false;

  return true;
}

/** True if the word is acceptable as a bonus word (player finds it in the grid). */
export function isEligibleForBonus(meta) {
  if (meta.override === 'deny')  return false;
  if (meta.override === 'allow') return true;

  if (meta.properNoun)           return false;
  if (meta.profane)              return false;
  if (meta.esdbTier > THRESHOLDS.BONUS) return false;

  const llm = llmFlags(meta);
  if (llm.sensitive)             return false;
  // Archaic, technical, and regional words are acceptable as bonus words —
  // finding an obscure word is a reward, not a puzzle requirement.

  return true;
}
