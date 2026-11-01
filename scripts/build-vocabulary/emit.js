/**
 * Emit the final approved word lists.
 *
 * Produces two files in public/data/ that are drop-in replacements for the
 * current common.txt and valid.txt, so the game code needs no changes for MVP.
 *
 *   approved_common.txt  — puzzle words, sorted by ESDB tier then alphabetically.
 *                          The position in this file IS the rank used by
 *                          generate.js for difficulty-band cutoffs.
 *
 *   approved_valid.txt   — bonus-eligible words (superset of common),
 *                          alphabetically sorted.
 *
 * Also prints the tier boundary counts so you can update generate.js constants:
 *   STANDARD_BASE  — count of puzzle words with tier ≤ THRESHOLDS.STANDARD
 *   WIDE_BASE      — count of puzzle words with tier ≤ THRESHOLDS.WIDE
 *   WIDE_TARGET    — count of puzzle words with tier ≤ THRESHOLDS.PUZZLE
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { isEligibleForPuzzle, isEligibleForBonus, THRESHOLDS } from './filter.js';

export function emit(metadata, outputDir, overrides) {
  const puzzleWords = [];
  const bonusWords  = new Set();

  for (const meta of metadata.values()) {
    // Warn about 'allow' overrides for words not in ESDB — we can't tier them.
    if (meta.override === 'allow' && meta.esdbTier === 999) {
      console.warn(`  Warning: override allow "${meta.word}" has no ESDB entry — skipped.`);
      continue;
    }

    if (isEligibleForPuzzle(meta)) puzzleWords.push(meta);
    if (isEligibleForBonus(meta))  bonusWords.add(meta.word);
  }

  // Sort puzzle words: tier ascending (more common first), then alpha within tier.
  // This makes the array index (rank) a monotonically increasing function of tier,
  // preserving the rank-based difficulty system in generate.js.
  puzzleWords.sort((a, b) =>
    a.esdbTier !== b.esdbTier
      ? a.esdbTier - b.esdbTier
      : a.word.localeCompare(b.word)
  );

  // Compute tier boundary counts for reporting.
  const standardCount = puzzleWords.filter(m => m.esdbTier <= THRESHOLDS.STANDARD).length;
  const wideCount     = puzzleWords.filter(m => m.esdbTier <= THRESHOLDS.WIDE).length;
  const puzzleCount   = puzzleWords.length;

  // Bonus list: all bonus-eligible words, sorted alpha.
  const bonusSorted = [...bonusWords].sort();

  // Write files.
  const commonPath = join(outputDir, 'approved_common.txt');
  const validPath  = join(outputDir, 'approved_valid.txt');

  writeFileSync(commonPath, puzzleWords.map(m => m.word).join('\n') + '\n', 'utf8');
  writeFileSync(validPath,  bonusSorted.join('\n') + '\n', 'utf8');

  console.log(`\n  Written: ${commonPath}`);
  console.log(`  Written: ${validPath}`);
  console.log(`\n  ┌─ Tier boundary report (update generate.js constants) ──────────┐`);
  console.log(`  │                                                                   │`);
  console.log(`  │  STANDARD_BASE / STANDARD_TARGET  = ${String(standardCount).padEnd(6)} (tier ≤ ${THRESHOLDS.STANDARD})        │`);
  console.log(`  │  WIDE_BASE                        = ${String(wideCount).padEnd(6)} (tier ≤ ${THRESHOLDS.WIDE})        │`);
  console.log(`  │  WIDE_TARGET                      = ${String(puzzleCount).padEnd(6)} (tier ≤ ${THRESHOLDS.PUZZLE})        │`);
  console.log(`  │                                                                   │`);
  console.log(`  │  Total puzzle words:              ${String(puzzleCount).padEnd(6)}                        │`);
  console.log(`  │  Total bonus words:               ${String(bonusSorted.length).padEnd(6)}                        │`);
  console.log(`  └───────────────────────────────────────────────────────────────────┘`);

  return { puzzleCount, bonusCount: bonusSorted.length, standardCount, wideCount };
}
