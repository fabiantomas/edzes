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
const KEYWORDS = [
  [/tricep|koponya|letol|jm nyom|fej fölött|fejfeletti/i, 'Tricepsz'],
  [/bicep|kalap|scott|karhajl/i, 'Bicepsz'],
  [/mell|fekvenyom|tárogatás|press|nyomás mell/i, 'Mell'],
  [/húzód|evez|lehúz|hyper|hát|row/i, 'Hát'],
  [/váll|oldalem|facepull|landmine|nyomás váll|delt/i, 'Váll'],
  [/comb|láb|csípő|vádli|guggol|kitör|rdl|extenzió|addukc|hajlít|szán|booty|squat|leg/i, 'Láb'],
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
