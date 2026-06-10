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
  editMode: false,
  // Munkaértékek mentés előtt. Kulcs: `${day}_${ex}_${set}_${field}`
  workingVals: {},
};
