// ansichten.js – die drei Ansichten (Tag, Woche, Alle Aufgaben) und die Leiste unten.

let aktiveAnsicht = 'tag';
let wochenStart = montagDerWoche(heute());   // Montag der Woche, die in der Wochenansicht zu sehen ist

// Wechselt zu einer anderen Ansicht: 'tag', 'woche' oder 'alle'
function zeigeAnsicht(name) {
  aktiveAnsicht = name;
  if (name === 'woche') wochenStart = montagDerWoche(aktuellerTag);

  ['tag', 'woche', 'alle'].forEach(function (n) {
    document.getElementById('ansicht-' + n).hidden = (n !== name);
  });
  document.querySelectorAll('.leiste button').forEach(function (knopf) {
    if (knopf.dataset.ansicht === name) knopf.setAttribute('aria-current', 'page');
    else knopf.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  aktualisiere();
}

// Zeichnet die gerade sichtbare Ansicht neu. Nach jeder Änderung an den Daten aufrufen.
function aktualisiere() {
  if (aktiveAnsicht === 'tag') zeigeTag();
  if (aktiveAnsicht === 'woche') zeigeWoche();
  if (aktiveAnsicht === 'alle') zeigeAlle();
}

document.querySelectorAll('.leiste button').forEach(function (knopf) {
  knopf.addEventListener('click', function () { zeigeAnsicht(knopf.dataset.ansicht); });
});

// ---------- Wochenansicht ----------

function zeigeWoche() {
  const sonntag = plusTage(wochenStart, 6);
  const abstand = Math.round(tageZwischen(montagDerWoche(heute()), wochenStart) / 7);
  document.getElementById('woche-relativ').textContent =
    abstand === 0 ? 'Diese Woche' : abstand === 1 ? 'Nächste Woche' : abstand === -1 ? 'Letzte Woche'
      : 'KW ' + kalenderwoche(wochenStart);
  document.getElementById('woche-titel').textContent =
    datumKurz(wochenStart).slice(4) + ' – ' + datumKurz(sonntag).slice(4) +
    (abstand >= -1 && abstand <= 1 ? ' · KW ' + kalenderwoche(wochenStart) : '');

  const liste = document.getElementById('woche-liste');
  liste.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const tag = plusTage(wochenStart, i);
    const termine = termineFuerTag(tag);
    const ueberfaellig = tag === heute() ? ueberfaelligeTermine(heute()).length : 0;

    const zeile = el('button', 'woche-tag');
    zeile.type = 'button';
    if (tag === heute()) zeile.classList.add('ist-heute');
    if (tag < heute()) zeile.classList.add('vergangen');

    // Links: Wochentag und Datum
    const name = el('div', 'wt-name');
    name.append(el('span', 'wt-tag', WOCHENTAGE[i]), el('span', 'wt-datum', datumKurz(tag).slice(4)));

    // Mitte: ein farbiger Punkt pro Aufgabe (höchstens 8)
    const punkte = el('div', 'wt-punkte');
    termine.slice(0, 8).forEach(function (t) {
      const punkt = el('span', 'punkt');
      punkt.style.setProperty('--farbe', findeKategorie(t.aufgabe.kategorieId).farbe);
      punkte.append(punkt);
    });

    // Rechts: Anzahl offener Aufgaben
    const anzahl = el('div', 'wt-anzahl');
    if (termine.length === 0 && ueberfaellig === 0) {
      anzahl.append(el('span', 'wt-frei', tag < heute() ? '✓' : '–'));
    } else {
      if (termine.length > 0) anzahl.append(el('span', 'wt-zahl', termine.length + ' offen'));
      if (ueberfaellig > 0) anzahl.append(el('span', 'wt-ueber', '+' + ueberfaellig + ' überfällig'));
    }

    zeile.setAttribute('aria-label', WOCHENTAGE[i] + ', ' + datumKurz(tag).slice(4) + ': ' +
      termine.length + ' offene Aufgaben' + (ueberfaellig ? ', ' + ueberfaellig + ' überfällig' : ''));
    zeile.append(name, punkte, anzahl);
    zeile.addEventListener('click', function () {
      aktuellerTag = tag;
      zeigeAnsicht('tag');
    });
    liste.append(zeile);
  }
}

document.getElementById('woche-zurueck').addEventListener('click', function () {
  wochenStart = plusTage(wochenStart, -7);
  zeigeWoche();
});
document.getElementById('woche-vor').addEventListener('click', function () {
  wochenStart = plusTage(wochenStart, 7);
  zeigeWoche();
});

// ---------- Alle Aufgaben ----------

// Kurzer Satz zum Stand einer Aufgabe, z. B. "Nächster Termin: Fr, 13.11."
function aufgabenStand(aufgabe) {
  const regel = aufgabe.regel;
  if (regel.typ === 'einmalig') {
    if (!istOffen(aufgabe, regel.datum)) return '✓ erledigt';
    const faellig = daten.verschoben[terminSchluessel(aufgabe.id, regel.datum)] || regel.datum;
    return (faellig < heute() ? 'Überfällig seit ' : 'Am ') + datumKurz(faellig);
  }
  // Der nächste Termin, der noch offen ist und nicht verschoben wurde
  const naechster = naechsteTermine(regel, heute(), 20).find(function (datum) {
    return istOffen(aufgabe, datum) && !istVerschoben(aufgabe, datum);
  });
  return naechster ? 'Nächster Termin: ' + datumKurz(naechster) : 'Keine weiteren Termine';
}

function zeigeAlle() {
  zeigeLetzteSicherung();
  const liste = document.getElementById('alle-liste');
  liste.innerHTML = '';

  if (daten.aufgaben.length === 0) {
    const leer = el('div', 'leer');
    leer.append(
      el('div', 'leer-bild', '📝'),
      el('p', 'leer-titel', 'Noch keine Aufgaben'),
      el('p', 'leer-text', 'Tippe unten rechts auf +, um eine anzulegen.')
    );
    liste.append(leer);
    return;
  }

  const reihenfolge = daten.kategorien.map(function (k) { return k.id; }).concat(['']);
  reihenfolge.forEach(function (katId) {
    const aufgaben = daten.aufgaben.filter(function (a) {
      return findeKategorie(a.kategorieId).id === katId;
    }).sort(function (a, b) { return a.titel.localeCompare(b.titel, 'de'); });
    if (aufgaben.length === 0) return;

    const kat = findeKategorie(katId);
    const gruppe = el('section', 'gruppe');
    gruppe.style.setProperty('--farbe', kat.farbe);
    const titel = el('h2', 'gruppe-titel');
    titel.append(el('span', 'punkt'), kat.name + ' · ' + aufgaben.length);
    gruppe.append(titel);

    aufgaben.forEach(function (aufgabe) {
      const karte = el('button', 'aufgabe alle-karte');
      karte.type = 'button';
      karte.style.setProperty('--farbe', kat.farbe);
      const text = el('div', 'aufgabe-text');
      text.append(el('p', 'aufgabe-titel', aufgabe.titel));
      if (aufgabe.notiz) text.append(el('p', 'aufgabe-notiz', aufgabe.notiz));
      text.append(el('p', 'aufgabe-regel',
        (aufgabe.regel.typ === 'einmalig' ? '' : '↻ ' + regelBeschreibung(aufgabe.regel) + ' · ') +
        aufgabenStand(aufgabe)));
      karte.append(text, el('span', 'pfeil', '›'));
      // Ohne Datum geöffnet: Beim Löschen gibt es dann nur "Alle zukünftigen"
      karte.addEventListener('click', function () {
        oeffneFormular({ aufgabe: aufgabe, datum: null });
      });
      gruppe.append(karte);
    });
    liste.append(gruppe);
  });
}

document.getElementById('alle-kategorien').addEventListener('click', oeffneKategorien);
