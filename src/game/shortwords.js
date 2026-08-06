/**
 * Three-letter words are the hardest to filter by frequency alone — "tel", "sol"
 * and "tas" all rank high in web text but read as junk in a puzzle. So the short
 * targets come from a hand-checked list instead. Anything outside it can still be
 * played as a bonus word; it just never appears in the grid.
 */
export const SHORT_WORDS = new Set(
  `act add age ago aid ail aim air ale all and ant any ape apt arc are ark arm art ash ask ate awe axe
   bad bag ban bar bat bay bed bee beg bet bid big bin bit boa bob bog bow box boy bra bud bug bun bus but buy bye
   cab can cap car cat cob cod cog cop cot cow coy cry cub cue cup cur cut
   dab dad dam day den dew did die dig dim din dip doe dog don dot dry dub due dug dye
   ear eat ebb eel egg ego elf elk elm end era err eve ewe eye
   fad fan far fat fax fed fee few fib fig fin fir fit fix flu fly foe fog for fox fry fun fur
   gag gap gas gel gem get gig gin god got gum gun gut guy gym
   had hag ham has hat hay hem hen her hew hid him hip his hit hoe hog hop hot how hub hue hug hum hut
   ice icy ill imp ink inn ion ire irk its ivy
   jab jam jar jaw jay jet jig job jog jot joy jug jut
   keg key kid kin kit
   lab lad lag lap law lay leg lid lie lip lit lob log lot low lug
   mad man map mar mat maw may men met mew mid mix mob mom mop mow mud mug mum
   nab nag nap net new nib nil nip nod nor not now nun nut
   oak oar oat odd ode off oil old one orb ore our out owe owl own
   pad pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pot pro pry pub pug pun pup put
   rag ram ran rap rat raw ray red rib rid rig rim rip rob rod roe rot row rub rug rum run rut rye
   sad sag sap sat saw say sea see set sew she shy sin sip sir sit six ski sky sly sob sod son sow soy spa spy sty sub sue sum sun
   tab tag tan tap tar tax tea ten the thy tic tie tin tip toe ton too top tot tow toy try tub tug two
   urn use
   van vat vet vow
   wad wag war was wax way web wed wee wet who why wig win wit woe wok won woo wry
   yak yam yaw yen yes yet yew you
   zap zip zoo`
    .split(/\s+/)
    .filter(Boolean)
);
