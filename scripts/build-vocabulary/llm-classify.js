/**
 * LLM-based word classification with a deterministic file cache.
 *
 * On each run, only words absent from the cache are sent to the API.
 * The cache file (data/cache/llm-classifications.json) must be committed
 * to git — it IS the ground truth for all previously classified words.
 * The model is never re-queried for a word already in the cache, so
 * pipeline output is deterministic after the first run.
 *
 * Classification covers properties that open datasets don't reliably provide:
 *   archaic    — old-fashioned, rarely used in modern English
 *   technical  — specialist term most players wouldn't recognise
 *   regional   — primarily used in one region/dialect
 *   sensitive  — sensitive topic even without being profane (e.g. "suicide")
 *   abbreviation — abbreviated or acronym form
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 * If the key is absent, classification is skipped and a warning is printed.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';

const BATCH_SIZE = 150; // words per API call
const MODEL = 'claude-sonnet-4-6';

const PROMPT_SYSTEM = `You classify English words for a family-friendly word puzzle game.
You will receive a JSON array of words and must return a JSON array of classification objects.
The output array must be in the same order as the input array.
Each object has exactly these boolean fields:
  archaic, technical, regional, sensitive, abbreviation
Rules:
- archaic: true only if the word is genuinely old-fashioned and rarely encountered in modern everyday English (e.g. "thee", "wherefore", "hath"). Common words that happen to be old are NOT archaic.
- technical: true only if primarily a specialist/technical term that most adult native speakers would not know without domain knowledge (e.g. "dielectric", "torsiograph"). Common scientific words like "oxygen" or "voltage" are NOT technical.
- regional: true only if the word is predominantly used in one region or dialect and would be unfamiliar to most English speakers worldwide (e.g. "bairn", "arvo", "chuffed").
- sensitive: true only if the word itself names a sensitive real-world topic in a way that would make it uncomfortable to display to a general audience (e.g. "suicide", "genocide", "incest"). Words with innocent primary senses are NOT sensitive.
- abbreviation: true only if the word is an abbreviation, acronym, or initialised form (e.g. "govt", "approx", "dept", "btwn").
Err strongly toward false on all fields. Return ONLY the JSON array, no other text.`;

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function loadCache(cacheFile) {
  try {
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cacheFile, cache) {
  writeFileSync(cacheFile, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

/**
 * Classifies words that need archaic/technical/regional/sensitive/abbreviation flags.
 * Updates the `llm` property on each metadata entry in-place.
 *
 * @param {Map<string, object>} metadata  — word → metadata (modified in-place)
 * @param {string}              cacheFile — path to llm-classifications.json
 */
export async function classifyWords(metadata, cacheFile) {
  const cache = loadCache(cacheFile);

  // Apply cached results first.
  let cacheHits = 0;
  for (const [word, meta] of metadata) {
    if (cache[word]) {
      meta.llm = cache[word];
      cacheHits++;
    }
  }

  // Determine which words still need classification.
  // We only classify words that are candidates for inclusion (not already
  // blocked by profanity or overrides) and are in ESDB tiers where
  // ambiguity is likely — common words (tier ≤ 35) rarely need LLM help.
  const toClassify = [...metadata.entries()]
    .filter(([word, meta]) => !meta.llm && !meta.profane && meta.esdbTier > 35)
    .map(([word]) => word);

  if (toClassify.length === 0) {
    console.log(`  ${cacheHits} words from cache, 0 to classify — done.`);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      `  Warning: ANTHROPIC_API_KEY not set. Skipping LLM classification for ` +
      `${toClassify.length} words. Words will be treated as unclassified (all flags false).`
    );
    // Default: assume unclassified words are safe.
    for (const word of toClassify) {
      const defaultFlags = { archaic: false, technical: false, regional: false, sensitive: false, abbreviation: false };
      metadata.get(word).llm = defaultFlags;
      cache[word] = { ...defaultFlags, model: 'default', date: new Date().toISOString() };
    }
    saveCache(cacheFile, cache);
    return;
  }

  const client = new Anthropic();
  console.log(`  ${cacheHits} from cache. Classifying ${toClassify.length} words via API...`);

  const batches = chunks(toClassify, BATCH_SIZE);
  let classified = 0;

  for (const batch of batches) {
    process.stdout.write(`  Batch ${Math.floor(classified / BATCH_SIZE) + 1}/${batches.length} (${batch.length} words)...`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: PROMPT_SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(batch) }],
    });

    let results;
    try {
      results = JSON.parse(response.content[0].text);
    } catch {
      throw new Error(`LLM returned non-JSON for batch starting at ${batch[0]}:\n${response.content[0].text}`);
    }

    if (!Array.isArray(results) || results.length !== batch.length) {
      throw new Error(
        `LLM returned ${results?.length} results for ${batch.length} words. ` +
        `First word in batch: ${batch[0]}`
      );
    }

    for (let i = 0; i < batch.length; i++) {
      const word = batch[i];
      const flags = {
        archaic:      !!results[i].archaic,
        technical:    !!results[i].technical,
        regional:     !!results[i].regional,
        sensitive:    !!results[i].sensitive,
        abbreviation: !!results[i].abbreviation,
      };
      metadata.get(word).llm = flags;
      cache[word] = { ...flags, model: MODEL, date: new Date().toISOString() };
    }

    classified += batch.length;
    console.log(` done.`);

    // Persist after every batch — avoids losing work if a later batch fails.
    saveCache(cacheFile, cache);
  }

  console.log(`  Total classified: ${classified} words.`);
}
