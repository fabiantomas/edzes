// ════════════════════════════════════════════
//  MEGOSZTOTT ÁLLAPOT
// ════════════════════════════════════════════
// Egyetlen objektum tartja a futásidejű állapotot, így a modulok
// közösen tudják olvasni/írni anélkül, hogy körkörös importok kellenének.

export const state = {
  currentDay: 0,
  currentEx: 0,                              // -1 = testsúly fül
  currentWeek: parseInt(localStorage.getItem('currentWeek') || '1'),
  currentPage: 'workout',                    // 'workout' | 'history'
  historyTab: 'table',                       // 'table' | 'progress'
  progressDay: 0,                            // a fejlődés-nézetben kiválasztott nap
  progressEx: 0,                             // és gyakorlat
  editMode: false,
  // Munkaértékek mentés előtt. Kulcs: `${day}_${ex}_${set}_${field}`
  workingVals: {},
};
