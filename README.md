# Edzés Napló

Mobilra (iPhone PWA) tervezett edzésnapló. Tiszta HTML + CSS + ES modulok,
build lépés nélkül. Az adatok a böngésző localStorage-ában tárolódnak,
biztonsági mentés export/import gombbal (JSON fájl).

## Fájlszerkezet

```
index.html        – a teljes felület váza (markup)
styles.css        – minden stílus
js/
  main.js         – belépési pont: eseménykezelők bekötése + indítás
  state.js        – megosztott futásidejű állapot (egyetlen objektum)
  data.js         – statikus adatok: napok, gyakorlatok, kiindulási előzmény
  storage.js      – localStorage hozzáférés és származtatott értékek
  names.js        – szerkeszthető nap- és gyakorlatnevek
  ui.js           – render() koordinátor + renderelők regisztrációja
  workout.js      – edzés nézet (pillek, kártyák, húzós bevitel, mentés)
  history.js      – statisztika nézet (táblázatok, testsúly-grafikon, kommentek)
  navigation.js   – szerkesztő mód, oldalváltás, nap/hét választás
  backup.js       – export / import + főmenü
  icons.js        – inline SVG ikonok
  toast.js        – rövid visszajelzés
```

## Modulok közti kapcsolat

A körkörös import elkerülésére az `ui.js` egy "late binding" megoldást használ:
a `workout.js` és `history.js` a `registerRenderer()`-rel regisztrálják a saját
renderelő függvényüket, a `render()` pedig ezeket hívja. Így a `render()` nem
importálja közvetlenül a nézeteket, a nézetek viszont hívhatják a `render()`-t.

## Futtatás

ES modulokat használ, ezért HTTP(S)-en kell kiszolgálni (GitHub Pages megfelel).
Lokálisan `file://` megnyitással NEM működik – ehhez egy egyszerű helyi szerver kell
(pl. `python3 -m http.server`).

## Adatkulcsok (localStorage)

- `w{hét}_d{nap}_e{gyak}_s{sor}_{kg|reps}` – sorozat értékei
- `bw_w{hét}_d{nap}` – testsúly
- `date_w{hét}_d{nap}` – edzés dátuma (YYYY-MM-DD)
- `note_w{hét}_d{nap}_e{gyak}` – gyakorlat komment
- `dayname_{nap}`, `daysub_{nap}`, `exname_{nap}_{gyak}` – átírt nevek
- `currentWeek` – aktuálisan kiválasztott hét
