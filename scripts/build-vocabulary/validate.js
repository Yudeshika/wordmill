/**
 * Post-build safety validation.
 *
 * Reads the emitted word lists and runs assertions that must pass before
 * the build is considered safe to ship. A failure here exits the process
 * with a non-zero code, which will fail a CI build.
 *
 * MUST_NOT_CONTAIN is derived from word-overrides.json deny list — keeping
 * validation and filtering in sync from a single source of truth.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

function loadWords(path) {
  return new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean)
  );
}

export function validate(outputDir) {
  const commonPath = join(outputDir, 'approved_common.txt');
  const validPath  = join(outputDir, 'approved_valid.txt');

  const puzzleWords = loadWords(commonPath);
  const bonusWords  = loadWords(validPath);

  // Derive the must-not-contain list from the deny overrides so that
  // validation and filtering always agree on what is prohibited.
  const overrides = JSON.parse(
    readFileSync(join(ROOT, 'data', 'word-overrides.json'), 'utf8')
  );
  const mustNotContain = (overrides.deny || []).filter((w) => /^[a-z]+$/.test(w));

  const failures = [];

  // ── Content safety ────────────────────────────────────────────────────────

  for (const word of mustNotContain) {
    if (puzzleWords.has(word)) failures.push(`SAFETY: "${word}" found in puzzle list`);
    if (bonusWords.has(word))  failures.push(`SAFETY: "${word}" found in bonus list`);
  }

  // ── Format assertions ─────────────────────────────────────────────────────

  for (const word of puzzleWords) {
    if (!/^[a-z]+$/.test(word)) {
      failures.push(`FORMAT: puzzle word "${word}" contains non-alpha characters`);
      break;
    }
    if (word.length < 3 || word.length > 7) {
      failures.push(`FORMAT: puzzle word "${word}" has length ${word.length} (expected 3–7)`);
      break;
    }
  }

  for (const word of bonusWords) {
    if (!/^[a-z]+$/.test(word)) {
      failures.push(`FORMAT: bonus word "${word}" contains non-alpha characters`);
      break;
    }
    if (word.length < 3 || word.length > 7) {
      failures.push(`FORMAT: bonus word "${word}" has length ${word.length} (expected 3–7)`);
      break;
    }
  }

  // ── Structural assertions ─────────────────────────────────────────────────

  if (puzzleWords.size < 3000) {
    failures.push(`QUALITY: puzzle list only has ${puzzleWords.size} words — too small (expected ≥ 3000)`);
  }
  if (bonusWords.size < puzzleWords.size) {
    failures.push(`QUALITY: bonus list (${bonusWords.size}) is smaller than puzzle list (${puzzleWords.size})`);
  }

  // ── Report ────────────────────────────────────────────────────────────────

  if (failures.length > 0) {
    console.error('\n  VALIDATION FAILED:');
    for (const f of failures) console.error(`    ✗ ${f}`);
    process.exit(1);
  }

  console.log(`  All assertions passed.`);
  console.log(`    ✓ None of the ${mustNotContain.length} deny-listed words found in puzzle list`);
  console.log(`    ✓ None of the ${mustNotContain.length} deny-listed words found in bonus list`);
  console.log(`    ✓ Word count in range: ${puzzleWords.size.toLocaleString()} puzzle, ${bonusWords.size.toLocaleString()} bonus`);
  console.log(`    ✓ All words are 3–7 lowercase alpha characters`);
}
