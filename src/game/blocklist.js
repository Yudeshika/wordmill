/**
 * Words that pass every statistical filter but read badly in a grid: proper nouns,
 * abbreviations, file extensions and web-scrape artefacts that the frequency list
 * treats as ordinary English. They stay valid as bonus words — this only keeps them
 * out of the puzzle itself. Add to it whenever something odd shows up in play.
 */
export const BLOCKED = new Set(
  `tate yuan luna alba prima noel ness noir fiat dong shaw brad sept tal tas sol ser tor rem cos psi del
   mondo bruins hist trans tel misc dept univ corp intl prev appl
   jan feb apr jun jul aug sept oct nov dec mon tue tues wed thu thur thurs fri
   usa asia ohio iowa utah cuba peru chad iran iraq rome oslo lima kiev nato opec
   ltd inc llc plc gmbh ceo cfo cto faq url html http https php xml css jpg gif png pdf dvd cds
   mrs sri von der und les des las los una uno duo trio
   nbsp amp quot gmt utc rss xhtml src img num str val var func init args tmp cfg
   ipod ipad imac unix linux java perl ruby sql api sdk cpu gpu ram rom usb
   jose juan luis pedro maria julia laura anna emma sara lisa nick dave mike steve chris tony
   ross reed ford hall gray grey lane hill lee kim ali`
    .split(/\s+/)
    .filter(Boolean)
);
