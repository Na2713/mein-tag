// kategorien.js – Kategorien anlegen, umbenennen, einfärben und löschen.

// Die Pastellfarben zur Auswahl
const FARBEN = [
  { name: 'Mint', wert: '#bfe6d3' },
  { name: 'Rosé', wert: '#f6cdd5' },
  { name: 'Lavendel', wert: '#d8cff3' },
  { name: 'Pfirsich', wert: '#fbd5b9' },
  { name: 'Himmelblau', wert: '#c9e2f5' },
  { name: 'Zitrone', wert: '#f6e7a8' },
  { name: 'Salbei', wert: '#d5e3c4' },
  { name: 'Flieder', wert: '#ecd0ec' },
  { name: 'Sand', wert: '#e8dccb' }
];

const katHuelle = document.getElementById('blatt-kategorien');

function oeffneKategorien() {
  zeigeKategorienListe();
  oeffneBlatt(katHuelle);
}

// Nach jeder Änderung: speichern und alles neu anzeigen, was Kategorien benutzt
function nachKategorieAenderung() {
  speichere();
  zeigeKategorieChips();
  aktualisiere();
}

function zeigeKategorienListe() {
  const liste = document.getElementById('kategorien-liste');
  liste.innerHTML = '';

  if (daten.kategorien.length === 0) {
    liste.append(el('p', 'hinweis', 'Noch keine Kategorien.'));
  }

  daten.kategorien.forEach(function (kat) {
    const zeile = el('div', 'kat-zeile');
    zeile.style.setProperty('--farbe', kat.farbe);

    // Obere Reihe: Farbpunkt, Name zum Bearbeiten, Löschen-Knopf
    const oben = el('div', 'kat-oben');

    const name = el('input', 'kat-name');
    name.value = kat.name;
    name.maxLength = 40;
    name.setAttribute('aria-label', 'Name der Kategorie');
    name.addEventListener('input', function () {
      const neu = name.value.trim();
      if (neu) {
        kat.name = neu;
        nachKategorieAenderung();
      }
    });
    name.addEventListener('change', function () {
      if (!name.value.trim()) name.value = kat.name;   // leerer Name ist nicht erlaubt
    });

    const loeschen = el('button', 'klein-knopf', '🗑');
    loeschen.type = 'button';
    loeschen.setAttribute('aria-label', 'Kategorie ' + kat.name + ' löschen');
    loeschen.addEventListener('click', function () {
      const anzahl = daten.aufgaben.filter(function (a) { return a.kategorieId === kat.id; }).length;
      const text = anzahl === 0
        ? 'Sie wird von keiner Aufgabe benutzt.'
        : (anzahl === 1 ? '1 Aufgabe ist' : anzahl + ' Aufgaben sind') +
          ' danach „Ohne Kategorie“. Die Aufgaben selbst bleiben erhalten.';
      frage('„' + kat.name + '“ löschen?', text, [
        { text: 'Kategorie löschen', wert: true, art: 'gefahr' },
        { text: 'Abbrechen', wert: null }
      ]).then(function (ja) {
        if (!ja) return;
        loescheKategorie(kat.id);
        nachKategorieAenderung();
        zeigeKategorienListe();
      });
    });

    oben.append(el('span', 'punkt gross'), name, loeschen);

    // Untere Reihe: Farbauswahl
    const farbwahl = el('div', 'farbwahl');
    FARBEN.forEach(function (farbe) {
      const knopf = el('button', 'farbe');
      knopf.type = 'button';
      knopf.style.background = farbe.wert;
      knopf.setAttribute('aria-label', farbe.name);
      knopf.setAttribute('aria-pressed', farbe.wert === kat.farbe);
      knopf.addEventListener('click', function () {
        kat.farbe = farbe.wert;
        nachKategorieAenderung();
        zeigeKategorienListe();
      });
      farbwahl.append(knopf);
    });

    zeile.append(oben, farbwahl);
    liste.append(zeile);
  });
}

document.getElementById('btn-kategorie-neu').addEventListener('click', function () {
  // Nimmt die erste Farbe, die noch keine Kategorie hat
  const benutzt = daten.kategorien.map(function (k) { return k.farbe; });
  const frei = FARBEN.find(function (f) { return benutzt.indexOf(f.wert) < 0; }) || FARBEN[0];
  daten.kategorien.push({ id: neueId(), name: 'Neue Kategorie', farbe: frei.wert });
  nachKategorieAenderung();
  zeigeKategorienListe();

  // Gleich den Namen markieren, damit man lostippen kann
  const felder = document.querySelectorAll('#kategorien-liste .kat-name');
  const letztes = felder[felder.length - 1];
  letztes.focus();
  letztes.select();
});

richteBlattEin(katHuelle);
