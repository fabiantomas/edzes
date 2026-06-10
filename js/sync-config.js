// ════════════════════════════════════════════
//  SZINKRON KONFIGURÁCIÓ (Supabase)
// ════════════════════════════════════════════
// Az anon kulcs publikus, szándékosan a kódban van (statikus hosting).
// A hozzáférést a tábla RLS szabályai és a userID adják.

export const SUPABASE_URL = 'https://wvhwldngejncszuenkva.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aHdsZG5nZWpuY3N6dWVua3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTYzOTksImV4cCI6MjA5NjY3MjM5OX0.So3_zzxvtBk5CcyCV-5faQ-Qn2bfski6tW7gK9Rk67w';
export const SYNC_TABLE = 'sync_data';

// Mely localStorage-kulcsok NEM szinkronizálódnak (csak lokális UI-állapot).
export const NO_SYNC_KEYS = ['currentWeek', 'currentUser', 'lastSyncAt'];
