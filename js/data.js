// ════════════════════════════════════════════
//  STATIKUS ALAPADATOK
// ════════════════════════════════════════════

// Az ALAP-TERV (p0) kiinduló struktúrája. Ez akkor érvényes, ha még nincs
// mentett struktúra. A felhasználó az appból módosíthatja (plans.js), onnantól
// a mentett struktúra él. Az itteni nevek szolgálnak a BASE_HISTORY kulcsaként.
export const DEFAULT_STRUCTURE = [
  { name:'Felső 1', sub:'Mell/Hát', exercises:[
    {name:'Tricepsz fej fölött kötéllel', sets:2},
    {name:'Húzódzkodás', sets:2},
    {name:'15 fok KS Mell', sets:2},
    {name:'KS Bicepsz', sets:2},
    {name:'Felső Evezés', sets:2},
  ]},
  { name:'Alsó 1', sub:'Combok', exercises:[
    {name:'Comb Hajtás', sets:2},
    {name:'Lábtolás', sets:2},
    {name:'Csípő Nyitás', sets:2},
    {name:'BootyBuilder', sets:2},
    {name:'Vádli', sets:2},
  ]},
  { name:'Felső 2', sub:'Váll/Kar', exercises:[
    {name:'Tricepsz Letolás', sets:2},
    {name:'Széles Evezés', sets:2},
    {name:'Tárogatás', sets:2},
    {name:'KS Kalapács', sets:2},
    {name:'Válból Nyomás', sets:2},
  ]},
  { name:'Alsó 2', sub:'Csípő', exercises:[
    {name:'Csípőtolás', sets:2},
    {name:'Comb nyújtás', sets:2},
    {name:'Csípő Zárás', sets:2},
    {name:'Szán tolás', sets:2},
    {name:'Comb Nyomás', sets:2},
  ]},
];

// Az 1. hét kiindulási előzménye az ALAP-TERVHEZ: [súly, ismétlés] sorozatonként.
export const BASE_HISTORY = {
  'Tricepsz fej fölött kötéllel':[[65,10],[65,7]],
  'Húzódzkodás':[[95,8],[95,7]],
  '15 fok KS Mell':[[30,7],[30,6]],
  'KS Bicepsz':[[20,8],[20,8]],
  'Felső Evezés':[[60,10],[60,8]],
  'Comb Hajtás':[[65,8],[65,8]],
  'Lábtolás':[[240,7],[240,7]],
  'Csípő Nyitás':[[75,6],[75,6]],
  'BootyBuilder':[[80,7],[80,7]],
  'Vádli':[[120,6],[120,6]],
  'Tricepsz Letolás':[[65,9],[65,6]],
  'Széles Evezés':[[75,12],[80,11]],
  'Tárogatás':[[95,6],[100,6]],
  'KS Kalapács':[[20,7],[20,8]],
  'Válból Nyomás':[[50,6],[50,6]],
  'Csípőtolás':[[160,10],[160,10]],
  'Comb nyújtás':[[134,10],[134,10]],
  'Csípő Zárás':[[92,10],[92,10]],
  'Szán tolás':[[154,25],[154,25]],
  'Comb Nyomás':[[125,10],[125,10]],
};

export const DEFAULT_SETS = 2;
export const MAX_WEEKS = 20;
