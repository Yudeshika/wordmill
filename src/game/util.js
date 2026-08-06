export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function counts(word) {
  const c = new Int8Array(26);
  for (let i = 0; i < word.length; i++) c[word.charCodeAt(i) - 97]++;
  return c;
}

export function fitsIn(wordCounts, poolCounts) {
  for (let i = 0; i < 26; i++) if (wordCounts[i] > poolCounts[i]) return false;
  return true;
}

export function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
