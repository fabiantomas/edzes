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
  icons.js        – inline SVG ikonok
  toast.js        – rövid visszajelzés
```

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
