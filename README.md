# Edzés Napló

Mobilra (iPhone PWA) tervezett edzésnapló. Tiszta HTML + CSS + ES modulok,
build lépés nélkül. Adatok a böngésző localStorage-ában; biztonsági mentés
export/import gombbal (JSON fájl).

## Fájlszerkezet

```
index.html        – a felület váza (markup)
styles.css        – minden stílus
js/
  main.js         – belépési pont: eseménykezelők + indítás
  state.js        – futásidejű állapot (egyetlen objektum)
  data.js         – az ALAP-TERV alapstruktúrája + kiindulási előzmény (BASE_HISTORY)
  user.js         – FELHASZNÁLÓI PROFILOK (userID): adat-izoláció user-prefixszel
  profile.js      – profil modal (userID megtekintés, átnevezés, váltás/létrehozás)
  plans.js        – TÖBB EDZÉSTERV: terv-lista, aktuális terv, struktúra CRUD
  storage.js      – localStorage hozzáférés (terv-prefixszel) és származtatott értékek
  names.js        – nap- és gyakorlatnevek (a struktúrából)
  ui.js           – render() koordinátor + nap-sáv + terv-cím; renderelő-regisztráció
  workout.js      – edzés nézet (pillek, kártyák, húzós bevitel, komment modal, szerkesztő-lista, mentés)
  history.js      – statisztika (táblázatok, testsúly-grafikon, komment tooltip)
  navigation.js   – szerkesztő mód, oldalváltás, nap/hét/TERV választás
  backup.js       – export / import + főmenü
  sync-config.js  – Supabase URL + anon kulcs + beállítások
  synced-store.js – követett írások (időbélyeg + "piszkos" jelölés a szinkronhoz)
  sync.js         – felhő-szinkron (Supabase REST, last-write-wins mezőnként)
  icons.js        – inline SVG ikonok
  toast.js        – rövid visszajelzés
```

## Felhő-szinkronizáció (Supabase)

Local-first modell: a localStorage az elsődleges (offline is működik), a Supabase a
közös felhő. Minden szinkronizálandó íráshoz időbélyeg és "piszkos" jelölés tartozik.

- **PULL** indításkor / fókuszkor / 2 percenként / kézzel (a fejléc pöttyére kattintva).
- **MERGE** kulcsonként: a frissebb időbélyeg nyer (last-write-wins). Távoli frissebb →
  helyben alkalmazzuk; helyi frissebb/piszkos → felküldjük.
- Csak az aktuális userID sorai szinkronizálódnak.
- Offline: a szinkron csendben kimarad, a piszkos kulcsok a következő sikeres
  szinkronig megmaradnak. Az edzés offline is rögzíthető.

A fejléc jobb felső pöttye jelzi az állapotot: zöld = sikeres, kék = épp szinkronizál,
narancs = hiba/offline. Rákoppintva kézi szinkron indul.

### Supabase tábla (egyszeri beállítás, SQL Editorban)

```sql
create table public.sync_data (
  user_id text not null, key text not null, value text,
  updated_at bigint not null, deleted boolean not null default false,
  primary key (user_id, key)
);
alter table public.sync_data enable row level security;
create policy "anon olvas"   on public.sync_data for select using (true);
create policy "anon beszur"  on public.sync_data for insert with check (true);
create policy "anon modosit" on public.sync_data for update using (true);
```

A kulcsokat a `sync-config.js` tartalmazza (az anon kulcs publikus, szándékosan).

## Felhasználói profilok (userID)

Minden eszköz az első indításkor egy **generált, egyedi azonosítót** kap (pl.
`u_4n4q3e6s4k54`), nem közös azonosítót. Minden kulcs ezt az azonosítót viseli
prefixként (`{userID}__`), így több profil és később több felhasználó adatai is jól
elkülöníthetők. A profil a "⋯" menü → Profil pontban érhető el: ott leolvasható az
aktuális userID, átnevezhető a profil, beírható egy másik userID a váltáshoz, vagy
"+ Új profil" gombbal generálható új, egyedi azonosítójú profil.

Megjegyzés: az azonosító a böngésző localStorage-ához kötődik. Ha azt törlik vagy
más böngészőt/eszközt használnak, új azonosító generálódik. Valódi, eszközök közti
egyediséghez és központi kezeléshez később felhős megoldás szükséges.

## Edzéstervek (plans)

Több terv kezelhető. Minden tervnek saját struktúrája (napok + gyakorlatok) és
saját adatai vannak. Az adatkulcsok terv-prefixet kapnak, KIVÉVE az alap-tervet
(`p0`), amely a régi, prefix nélküli kulcsokat használja — így a korábban
rögzített adatok érintetlenül megmaradnak. Új terv üres struktúrával indul.

## Szerkesztő mód (ceruza gomb)

- A napmenü kinyílik: napok átnevezése, alcím, törlés, új nap.
- A fő terület gyakorlat-listára vált: átnevezés, fel/le mozgatás, törlés, új gyakorlat.
- Új gyakorlat mindig 2 sorozattal jön létre.

## Modulok közti kapcsolat

A körkörös import elkerülésére az `ui.js` "late binding"-ot használ: a nézetek
`registerRenderer()`-rel regisztrálják a renderelőjüket, a navigáció pedig
`registerCallback()`-kel a nap-sáv interakcióit. Így a `render()` nem importálja
közvetlenül a nézeteket.

## Futtatás

ES modulok → HTTP(S)-en kell kiszolgálni (GitHub Pages jó). `file://`-ról nem megy;
lokálisan pl. `python3 -m http.server`.

## Adatkulcsok (localStorage)

Az alap-tervnél prefix nélkül, más terveknél `p{id}_` prefixszel:
- `w{hét}_d{nap}_e{gyak}_s{sor}_{kg|reps}` – sorozat értékei
- `bw_w{hét}_d{nap}` – testsúly
- `date_w{hét}_d{nap}` – edzés dátuma
- `note_w{hét}_d{nap}_e{gyak}` – gyakorlat komment
- `struct` – a terv napjainak/gyakorlatainak struktúrája (JSON)

Globális kulcsok: `plans` (terv-lista), `currentPlan`, `currentWeek`.
