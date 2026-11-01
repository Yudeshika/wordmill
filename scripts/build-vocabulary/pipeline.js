#!/usr/bin/env node
/**
 * Wordmill vocabulary build pipeline.
 *
 * Generates approved_common.txt and approved_valid.txt in public/data/,
 * which are drop-in replacements for the existing common.txt and valid.txt.
 *
 * USAGE
 *   node scripts/build-vocabulary/pipeline.js [--dry-run] [--skip-llm]
 *
 * OPTIONS
 *   --dry-run   Run all steps but do not write output files.
 *   --skip-llm  Skip LLM classification (treat all unclassified words as safe).
 *               Useful for a quick local test without spending API tokens.
 *
 * SETUP (first run)
 *   1. Download the ESDB word lists from https://github.com/en-wl/wordlist
 *      and place the compiled files in data/sources/esdb/.
 *      Expected filenames: en_US-10.txt, en_US-20.txt, en_US-35.txt, …
 *      (The LDNOOBW list is downloaded automatically.)
 *
 *   2. Set ANTHROPIC_API_KEY in your environment if you want LLM classification.
 *      Skip with --skip-llm if you are just testing the pipeline structure.
 *
 *   3. Run:  node scripts/build-vocabulary/pipeline.js
 *
 *   4. Update STANDARD_BASE, WIDE_BASE, and WIDE_TARGET in src/game/generate.js
 *      using the tier boundary numbers printed at the end.
 *
 *   5. In src/game/dictionary.js, update the fetch paths from
 *      'data/common.txt' / 'data/valid.txt'
 *      to
 *      'data/approved_common.txt' / 'data/approved_valid.txt'
 *      (or swap the files and keep the original names — either works).
 *
 *   6. Remove the isOffensive() runtime filter from dictionary.js and the
 *      BLOCKED import from generate.js — the approved word lists handle this.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import { loadEsdb, tierCounts } from './esdb.js';
import { loadLdnoobw } from './ldnoobw.js';
import { classifyWords } from './llm-classify.js';
import { buildMetadata, applyOverrides } from './filter.js';
import { emit } from './emit.js';
import { validate } from './validate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '../..');
const DATA_DIR   = join(ROOT, 'data');
const SOURCES    = join(DATA_DIR, 'sources');
const CACHE_FILE = join(DATA_DIR, 'cache', 'llm-classifications.json');
const OUTPUT_DIR = join(ROOT, 'public', 'data');

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const SKIP_LLM = args.includes('--skip-llm');

async function run() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Wordmill Vocabulary Build Pipeline       ║');
  console.log('╚══════════════════════════════════════════╝\n');

  if (DRY_RUN)  console.log('  [DRY RUN — no files will be written]\n');
  if (SKIP_LLM) console.log('  [--skip-llm — LLM step will be skipped]\n');

  // ── Step 1: Load ESDB ─────────────────────────────────────────────────────
  console.log('Step 1/6 · Load ESDB word lists');
  const esdbWords = loadEsdb(SOURCES);
  const { cumulative } = tierCounts(esdbWords);
  console.log(`  Total entries: ${esdbWords.size.toLocaleString()}`);
  console.log(`  Cumulative counts by tier: ${
    Object.entries(cumulative).map(([t, n]) => `${t}→${n.toLocaleString()}`).join(', ')
  }\n`);

  // ── Step 2: Load LDNOOBW ──────────────────────────────────────────────────
  console.log('Step 2/6 · Load LDNOOBW profanity list');
  const profanitySet = await loadLdnoobw(SOURCES);
  console.log(`  ${profanitySet.size.toLocaleString()} expanded forms (roots + inflections)\n`);

  // ── Step 3: Build unified metadata ───────────────────────────────────────
  console.log('Step 3/6 · Build word metadata');
  const metadata = buildMetadata(esdbWords, profanitySet);
  const profaneCount = [...metadata.values()].filter(m => m.profane).length;
  const properCount  = [...metadata.values()].filter(m => m.properNoun).length;
  console.log(`  Candidate words (3–7 letters): ${metadata.size.toLocaleString()}`);
  console.log(`  Profane (LDNOOBW):             ${profaneCount.toLocaleString()}`);
  console.log(`  Proper nouns (ESDB):           ${properCount.toLocaleString()}\n`);

  // ── Step 4: LLM classification ────────────────────────────────────────────
  console.log('Step 4/6 · LLM classification (cached)');
  if (SKIP_LLM) {
    console.log('  Skipped (--skip-llm).\n');
  } else {
    await classifyWords(metadata, CACHE_FILE);
    console.log();
  }

  // ── Step 5: Apply manual overrides ───────────────────────────────────────
  console.log('Step 5/6 · Apply manual overrides');
  const overrides = JSON.parse(
    readFileSync(join(DATA_DIR, 'word-overrides.json'), 'utf8')
  );
  applyOverrides(metadata, overrides);
  console.log(`  ${(overrides.allow || []).length} explicit allows, ${(overrides.deny || []).length} explicit denies\n`);

  // ── Step 6: Emit ──────────────────────────────────────────────────────────
  console.log('Step 6/6 · Filter, emit, and validate');
  if (!DRY_RUN) {
    emit(metadata, OUTPUT_DIR, overrides);
    console.log();
    validate(OUTPUT_DIR);
  } else {
    // Count only, don't write.
    const { isEligibleForPuzzle, isEligibleForBonus } = await import('./filter.js');
    const puzzleCount = [...metadata.values()].filter(isEligibleForPuzzle).length;
    const bonusCount  = [...metadata.values()].filter(isEligibleForBonus).length;
    console.log(`  [dry run] Would emit ${puzzleCount} puzzle words and ${bonusCount} bonus words.`);
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Pipeline complete.                       ║');
  console.log('╚══════════════════════════════════════════╝\n');
}

run().catch((err) => {
  console.error('\nPipeline failed:', err.message);
  process.exit(1);
});
