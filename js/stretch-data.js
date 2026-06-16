// ════════════════════════════════════════════
//  NYÚJTÁSOK (izmonként)
// ════════════════════════════════════════════
// Minden izomcsoporthoz tartozik néhány nyújtás (egyelőre csak megnevezés;
// később kép/videó is csatolható). A gyakorlat nevéből következtetünk az
// izomcsoportra (exercise-library + kulcsszavak alapján).

import { EXERCISE_LIBRARY } from './exercise-library.js';

// Izomcsoport → nyújtások listája
export const STRETCHES = {
  'Mell': [
    'Ajtófélfás mellnyújtás',
    'Falnál kar-hátrahúzás',
    'Összekulcsolt kéz hátul',
  ],
  'Hát': [
    'Macska-teve gerincmobilizálás',
    'Gyermekpóz (child\'s pose)',
    'Függeszkedés rúdon (lazítás)',
  ],
  'Váll': [
    'Keresztezett kar vállnyújtás',
    'Tricepsz-váll nyújtás fej mögött',
    'Falnál alkar-forgatás',
  ],
  'Bicepsz': [
    'Falnál bicepsz-nyújtás',
    'Kinyújtott kar tenyér lefelé',
  ],
  'Tricepsz': [
    'Fej mögötti tricepsz-nyújtás',
    'Törölközős tricepsz-nyújtás',
  ],
  'Láb': [
    'Álló combhajlító-nyújtás (hamstring)',
    'Álló quad-nyújtás (boka húzás)',
    'Vádli-nyújtás falnál',
    'Galamb póz (csípő)',
    'Ülő törzsfordítás',
  ],
  'Far / Csípő': [
    'Galamb póz (csípő/far)',
    'Fekvő far-nyújtás (4-es alak)',
    'Csípőhajlító kitöréses nyújtás',
  ],
  'Hasizom': [
    'Kobra póz (has nyújtás)',
    'Álló hátrahajlás',
  ],
  'Törzs / Core': [
    'Ülő gerinccsavarás',
    'Oldalsó törzsnyújtás állva',
  ],
};

// Az exercise-library alapján: gyakorlatnév → izomcsoport
const NAME_TO_GROUP = (()=>{
  const map = {};
  EXERCISE_LIBRARY.forEach(g=>{
    g.items.forEach(name=> map[name.toLowerCase()] = g.group);
  });
  return map;
})();

// Kulcsszavas tartalék, ha a név nincs a könyvtárban (egyedi/manuális gyakorlatok)
// Sorrend számít: az első találat nyer.
const KEYWORDS = [
  [/plank|crunch|lábemel|orosz csavar|bicikli|dead bug|hasiz|has csíp/i, 'Hasizom'],
  [/pallof|bird dog|farmer|oldalra dől|oldalhajl|törzs|core/i, 'Törzs / Core'],
  [/csípőtol|hip thrust|glute|far|hátrarúg|bridge|abdukc/i, 'Far / Csípő'],
  [/tricep|koponya|letol|jm nyom|fej fölött|fejfeletti|tolódzk/i, 'Tricepsz'],
  [/bicep|kalap|scott|karhajl|spider/i, 'Bicepsz'],
  [/váll|oldalem|előreem|facepull|landmine|arnold|upright|állig|deltoid/i, 'Váll'],
  [/húzód|evez|lehúz|hyper|pulóver|deadlift|csípőből emel|hát|row/i, 'Hát'],
  [/mell|fekvenyom|fekvőtám|tárogatás|áthúzás|press|tolódzkodás/i, 'Mell'],
  [/comb|láb|guggol|kitör|rdl|extenzió|addukc|hajlít|vádli|squat|leg|bolgár/i, 'Láb'],
];

export function groupForExercise(name){
  if(!name) return null;
  const lower = name.toLowerCase();
  if(NAME_TO_GROUP[lower]) return NAME_TO_GROUP[lower];
  for(const [re, group] of KEYWORDS){
    if(re.test(lower)) return group;
  }
  return null;
}
