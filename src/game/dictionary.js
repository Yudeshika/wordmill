import { buildIndex, createPlanner } from './generate.js';
import { isOffensive } from './offensive.js';

let cache = null;

export async function loadDictionary() {
  if (cache) return cache;
  const [commonRes, validRes] = await Promise.all([
    fetch(new URL('data/common.txt', document.baseURI)),
    fetch(new URL('data/valid.txt', document.baseURI))
  ]);
  if (!commonRes.ok || !validRes.ok) throw new Error('Word lists failed to load');
  const [commonText, validText] = await Promise.all([commonRes.text(), validRes.text()]);
  const common = commonText.split('\n').filter(Boolean);
  // Filtered here rather than in the shipped word list so the frequency ranks the
  // generator relies on stay stable.
  const valid = new Set(validText.split('\n').filter((w) => w && !isOffensive(w)));
  const index = buildIndex(common);

  // One planner per mode, built on first use. Each keeps its own running plan,
  // so switching difficulty doesn't disturb progress in the other modes.
  const planners = new Map();
  cache = {
    common,
    valid,
    index,
    plannerFor(mode) {
      if (!planners.has(mode)) planners.set(mode, createPlanner(index, mode));
      return planners.get(mode);
    }
  };
  return cache;
}
