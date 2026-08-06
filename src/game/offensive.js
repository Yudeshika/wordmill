/**
 * Words the game will neither put in a grid nor accept as a bonus word.
 *
 * Two tiers, both blocked by default. SEVERE covers slurs and explicit sexual
 * content and sexual violence — leave it alone. MILD covers general profanity and
 * crude terms; if you'd rather the game accepted those as bonus words, drop MILD
 * from the union at the bottom of this file.
 *
 * Roots are expanded into their inflections automatically, so "wank" also blocks
 * wanks, wanked, wanker, wankers and wanking. Only roots need listing.
 *
 * Some entries have innocent senses too — a cock is a rooster, a tit is a bird, to
 * gyp is to swindle. They're blocked anyway: a puzzle game that flashes "correct!"
 * at a slur has failed regardless of which sense the player intended, and the cost
 * of losing a handful of legitimate words is close to zero.
 */

const SEVERE = `
  nigger nigga coon spic wetback beaner gook chink zipperhead
  kike yid heeb sheeny
  paki raghead towelhead
  wop dago polack kraut
  fag faggot dyke poof poofter tranny shemale
  retard spaz spastic mongol midget
  gyp squaw injun redskin
  rape rapist molest incest pedo paedo
  cunt twat clit pussy minge quim
  dick prick penis phallus scrotum
  vagina vulva labia anus
  fuck motherfucker
  whore slut hooker skank trollop strumpet harlot
  porn smut hentai
  cum jizz jism semen sperm ejaculate
  dildo vibrator buttplug
  boob titty nipple areola
  orgasm horny
  sodomy buggery bestiality
`;

const MILD = `
  shit shite crap poop turd
  piss arse arsehole asshole
  goddamn
  bastard bitch bugger wanker tosser
  bollock knacker
  fart puke
  wank
  bimbo floozy
`;

// Deliberately no '-ist': "ass" + "ist" would take out "assist".
const SUFFIXES = ['', 's', 'es', 'ed', 'er', 'ers', 'ing', 'y', 'ies'];

function expand(root) {
  const out = new Set();
  const add = (w) => {
    if (w.length >= 3 && w.length <= 7) out.add(w);
  };

  for (const suffix of SUFFIXES) {
    add(root + suffix);
    // drop a trailing e before vowel suffixes: molest/molesting, but also erode/eroding
    if (root.endsWith('e') && /^[aeiouy]/.test(suffix)) add(root.slice(0, -1) + suffix);
    // double a final consonant: shit/shitty, wank stays, fag/fagged
    if (/[aeiou][bcdfglmnprstz]$/.test(root) && /^[aeiouy]/.test(suffix)) {
      add(root + root[root.length - 1] + suffix);
    }
  }
  // y -> ies handled above; also handle root ending in y
  if (root.endsWith('y')) {
    add(root.slice(0, -1) + 'ies');
    add(root.slice(0, -1) + 'ied');
  }
  return [...out];
}

const roots = (text) => text.split(/\s+/).filter(Boolean);

export const OFFENSIVE = new Set([
  ...roots(SEVERE).flatMap(expand),
  ...roots(MILD).flatMap(expand)
]);

export const isOffensive = (word) => OFFENSIVE.has(word);
