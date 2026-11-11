// formular.js – das Blatt zum Anlegen und Bearbeiten einer Aufgabe.

const formHuelle = document.getElementById('blatt-aufgabe');
const formular = document.getElementById('form-aufgabe');

// Was gerade im Formular ausgewählt ist
let formTermin = null;      // beim Bearbeiten: { aufgabe, datum } – bei einer neuen Aufgabe: null
let formKategorie = '';
let formTyp = 'einmalig';   // 'einmalig', 'woche', 'monat' oder 'jahr'
let formWochentage = [];
let letzteKategorie = '';   // neue Aufgaben bekommen die zuletzt benutzte Kategorie

// Kurzschreibweise: feld('f-titel') statt document.getElementById('f-titel')
function feld(id) {
  return document.getElementById(id);
}

// ---------- Auswahllisten einmalig befüllen ----------

function fuelleAuswahl(id, eintraege) {
  const auswahl = feld(id);
  eintraege.forEach(function (eintrag) {
    const option = el('option', '', eintrag.text);
    option.value = eintrag.wert;
    auswahl.append(option);
  });
}

function zahlenBis(n) {
  const liste = [];
  for (let i = 1; i <= n; i++) liste.push({ wert: i, text: i + '.' });
  return liste;
}

fuelleAuswahl('f-alle-x', [
  { wert: 1, text: 'Jede Woche' },
  { wert: 2, text: 'Alle 2 Wochen' },
  { wert: 3, text: 'Alle 3 Wochen' },
  { wert: 4, text: 'Alle 4 Wochen' },
  { wert: 5, text: 'Alle 5 Wochen' },
  { wert: 6, text: 'Alle 6 Wochen' },
  { wert: 7, text: 'Alle 7 Wochen' },
  { wert: 8, text: 'Alle 8 Wochen' }
]);
fuelleAuswahl('f-monat-tag', zahlenBis(31));
fuelleAuswahl('f-monat-nummer', [
  { wert: 1, text: '1.' }, { wert: 2, text: '2.' }, { wert: 3, text: '3.' },
  { wert: 4, text: '4.' }, { wert: -1, text: 'letzten' }
]);
fuelleAuswahl('f-monat-wochentag', WOCHENTAGE.map(function (name, i) {
  return { wert: i + 1, text: name };
}));
fuelleAuswahl('f-jahr-tag', zahlenBis(31));
fuelleAuswahl('f-jahr-monat', MONATE.map(function (name, i) {
  return { wert: i + 1, text: name };
}));

// Die sieben Wochentag-Knöpfe Mo … So
WOCHENTAGE_KURZ.forEach(function (kurz, i) {
  const knopf = el('button', 'tag-knopf', kurz);
  knopf.type = 'button';
  knopf.dataset.tag = i + 1;
  knopf.setAttribute('aria-label', WOCHENTAGE[i]);
  knopf.addEventListener('click', function () {
    const tag = i + 1;
    const stelle = formWochentage.indexOf(tag);
    if (stelle >= 0) formWochentage.splice(stelle, 1);
    else formWochentage.push(tag);
    zeigeWochentage();
    aktualisiereVorschau();
  });
  feld('f-wochentage').append(knopf);
});

// Die vier Knöpfe Einmalig / Wöchentlich / Monatlich / Jährlich
document.querySelectorAll('#f-typ button').forEach(function (knopf) {
  knopf.addEventListener('click', function () {
    formTyp = knopf.dataset.typ;
    zeigeTeile();
    aktualisiereVorschau();
  });
});

// ---------- Anzeige im Formular ----------

function zeigeTeile() {
  document.querySelectorAll('#f-typ button').forEach(function (knopf) {
    knopf.setAttribute('aria-pressed', knopf.dataset.typ === formTyp);
  });
  document.querySelectorAll('#form-aufgabe .teil').forEach(function (teil) {
    teil.hidden = teil.dataset.teil.split(' ').indexOf(formTyp) < 0;
  });
}

function zeigeWochentage() {
  document.querySelectorAll('#f-wochentage button').forEach(function (knopf) {
    knopf.setAttribute('aria-pressed', formWochentage.indexOf(Number(knopf.dataset.tag)) >= 0);
  });
}

function zeigeKategorieChips() {
  // Wurde die gewählte Kategorie inzwischen gelöscht?
  if (formKategorie && !daten.kategorien.some(function (k) { return k.id === formKategorie; })) {
    formKategorie = '';
  }
  const chips = feld('f-kategorien');
  chips.innerHTML = '';
  const auswahl = [{ id: '', name: 'Ohne', farbe: '#e2dcd6' }].concat(daten.kategorien);
  auswahl.forEach(function (kat) {
    const chip = el('button', 'chip');
    chip.type = 'button';
    chip.style.setProperty('--farbe', kat.farbe);
    chip.setAttribute('aria-pressed', kat.id === formKategorie);
    chip.append(el('span', 'punkt'), kat.name);
    chip.addEventListener('click', function () {
      formKategorie = kat.id;
      zeigeKategorieChips();
    });
    chips.append(chip);
  });
  const bearbeiten = el('button', 'chip leise', '✎ Bearbeiten');
  bearbeiten.type = 'button';
  bearbeiten.addEventListener('click', oeffneKategorien);
  chips.append(bearbeiten);
}

// ---------- Formular öffnen ----------

// termin = { aufgabe, datum } zum Bearbeiten, oder nichts für eine neue Aufgabe
function oeffneFormular(termin) {
  formTermin = termin || null;
  const aufgabe = termin ? termin.aufgabe : null;

  // Vorschläge passend zum Tag, der gerade angezeigt wird
  const basis = aktuellerTag;
  const d = textZuDatum(basis);
  const woche = Math.ceil(d.tag / 7);

  feld('form-ueberschrift').textContent = aufgabe ? 'Aufgabe bearbeiten' : 'Neue Aufgabe';
  feld('f-titel').value = aufgabe ? aufgabe.titel : '';
  feld('f-notiz').value = aufgabe ? aufgabe.notiz : '';
  formKategorie = aufgabe ? aufgabe.kategorieId : letzteKategorie;

  formTyp = 'einmalig';
  feld('f-datum').value = basis;
  formWochentage = [wochentag(basis)];
  feld('f-alle-x').value = '1';
  setzeMonatArt('monatTag');
  feld('f-monat-tag').value = d.tag;
  feld('f-monat-nummer').value = woche > 4 ? -1 : woche;
  feld('f-monat-wochentag').value = wochentag(basis);
  feld('f-jahr-tag').value = d.tag;
  feld('f-jahr-monat').value = d.monat;
  feld('f-start').value = basis > heute() ? basis : heute();

  if (aufgabe) uebernehmeRegel(aufgabe.regel);

  feld('f-loeschen').hidden = !aufgabe;
  feld('f-hinweis-start').hidden = !(aufgabe && aufgabe.regel.typ !== 'einmalig');
  feld('f-fehler').hidden = true;

  zeigeKategorieChips();
  zeigeWochentage();
  zeigeTeile();
  aktualisiereVorschau();
  oeffneBlatt(formHuelle);
  if (!aufgabe) setTimeout(function () { feld('f-titel').focus(); }, 260);
}

// Füllt das Formular mit einer gespeicherten Regel
function uebernehmeRegel(regel) {
  if (regel.start) feld('f-start').value = regel.start;
  switch (regel.typ) {
    case 'einmalig':
      formTyp = 'einmalig';
      feld('f-datum').value = regel.datum;
      break;
    case 'woechentlich':
      formTyp = 'woche';
      formWochentage = regel.wochentage.slice();
      feld('f-alle-x').value = regel.alleXWochen || 1;
      break;
    case 'monatTag':
      formTyp = 'monat';
      setzeMonatArt('monatTag');
      feld('f-monat-tag').value = regel.tag;
      break;
    case 'monatWochentag':
      formTyp = 'monat';
      setzeMonatArt('monatWochentag');
      feld('f-monat-nummer').value = regel.nummer;
      feld('f-monat-wochentag').value = regel.wochentag;
      break;
    case 'monatLetzter':
      formTyp = 'monat';
      setzeMonatArt('monatLetzter');
      break;
    case 'jaehrlich':
      formTyp = 'jahr';
      feld('f-jahr-tag').value = regel.tag;
      feld('f-jahr-monat').value = regel.monat;
      break;
  }
}

function setzeMonatArt(art) {
  document.querySelector('input[name="f-monat-art"][value="' + art + '"]').checked = true;
}

// ---------- Formular auslesen ----------

// Baut aus den Eingaben eine Regel. Gibt { regel } oder { fehler } zurück.
function leseRegel() {
  if (formTyp === 'einmalig') {
    const datum = feld('f-datum').value;
    if (!datum) return { fehler: 'Bitte wähle ein Datum.' };
    return { regel: { typ: 'einmalig', datum: datum } };
  }

  const start = feld('f-start').value || heute();

  if (formTyp === 'woche') {
    if (formWochentage.length === 0) return { fehler: 'Bitte wähle mindestens einen Wochentag.' };
    return { regel: {
      typ: 'woechentlich',
      alleXWochen: Number(feld('f-alle-x').value),
      wochentage: formWochentage.slice().sort(),
      start: start
    } };
  }

  if (formTyp === 'monat') {
    const art = document.querySelector('input[name="f-monat-art"]:checked').value;
    if (art === 'monatTag') {
      return { regel: { typ: 'monatTag', tag: Number(feld('f-monat-tag').value), start: start } };
    }
    if (art === 'monatWochentag') {
      return { regel: {
        typ: 'monatWochentag',
        nummer: Number(feld('f-monat-nummer').value),
        wochentag: Number(feld('f-monat-wochentag').value),
        start: start
      } };
    }
    return { regel: { typ: 'monatLetzter', start: start } };
  }

  // jährlich
  const tag = Number(feld('f-jahr-tag').value);
  const monat = Number(feld('f-jahr-monat').value);
  if (tag > tageImMonat(2028, monat)) {   // 2028 ist ein Schaltjahr, also ist der 29.2. erlaubt
    return { fehler: 'Den ' + tag + '. ' + MONATE[monat - 1] + ' gibt es nicht.' };
  }
  return { regel: { typ: 'jaehrlich', monat: monat, tag: tag, start: start } };
}

// Zeigt unter dem Formular, wann die nächsten Termine sind
function aktualisiereVorschau() {
  const vorschau = feld('f-vorschau');
  const ergebnis = leseRegel();
  if (ergebnis.fehler || ergebnis.regel.typ === 'einmalig') {
    vorschau.textContent = '';
    return;
  }
  const termine = naechsteTermine(ergebnis.regel, heute(), 3);
  vorschau.textContent = '↻ ' + regelBeschreibung(ergebnis.regel) + '\n' + (termine.length
    ? 'Nächste Termine: ' + termine.map(datumKurz).join(' · ')
    : 'Keine Termine in den nächsten Jahren.');
}

formular.addEventListener('input', aktualisiereVorschau);
formular.addEventListener('change', aktualisiereVorschau);

function zeigeFehler(text) {
  const fehler = feld('f-fehler');
  fehler.textContent = text;
  fehler.hidden = false;
}

// Vergleicht zwei Regeln, ohne auf das Startdatum zu achten
function regelOhneStart(regel) {
  return JSON.stringify(Object.assign({}, regel, { start: undefined }));
}

// ---------- Speichern ----------

formular.addEventListener('submit', function (ereignis) {
  ereignis.preventDefault();   // sonst würde der Browser die Seite neu laden

  const titel = feld('f-titel').value.trim();
  if (!titel) {
    zeigeFehler('Bitte gib einen Titel ein.');
    feld('f-titel').focus();
    return;
  }
  const ergebnis = leseRegel();
  if (ergebnis.fehler) {
    zeigeFehler(ergebnis.fehler);
    return;
  }
  const regel = ergebnis.regel;
  const notiz = feld('f-notiz').value.trim();

  if (formTermin) {
    const aufgabe = formTermin.aufgabe;
    // Wurde die Regel geändert, gilt sie erst ab heute. So tauchen keine
    // "neuen" alten Termine auf, die es vorher gar nicht gab.
    if (regel.start && regel.start < heute() && regelOhneStart(regel) !== regelOhneStart(aufgabe.regel)) {
      regel.start = heute();
    }
    aufgabe.titel = titel;
    aufgabe.notiz = notiz;
    aufgabe.kategorieId = formKategorie;
    aufgabe.regel = regel;
  } else {
    daten.aufgaben.push({
      id: neueId(),
      titel: titel,
      notiz: notiz,
      kategorieId: formKategorie,
      regel: regel,
      erstellt: heute()
    });
  }
  letzteKategorie = formKategorie;
  speichere();
  schliesseBlatt(formHuelle);
  aktualisiere();

  // Sagen, wann die Aufgabe dran ist – besonders, wenn nicht am angezeigten Tag
  const naechste = naechsteTermine(regel, regel.typ === 'einmalig' ? regel.datum : heute(), 1);
  if (naechste.length && naechste[0] !== aktuellerTag) {
    zeigeHinweis('Gespeichert – dran am ' + datumKurz(naechste[0]));
  } else {
    zeigeHinweis('Gespeichert');
  }
});

// ---------- Löschen ----------

feld('f-loeschen').addEventListener('click', function () {
  const aufgabe = formTermin.aufgabe;
  const datum = formTermin.datum;
  let antwort;

  if (aufgabe.regel.typ === 'einmalig') {
    antwort = frage('Aufgabe löschen?', '„' + aufgabe.titel + '“ wird endgültig gelöscht.', [
      { text: 'Löschen', wert: 'alle', art: 'gefahr' },
      { text: 'Abbrechen', wert: null }
    ]);
  } else {
    const optionen = [];
    if (datum) optionen.push({ text: 'Nur diesen Termin (' + datumKurz(datum) + ')', wert: 'einer', art: 'gefahr' });
    optionen.push({ text: 'Alle zukünftigen', wert: 'alle', art: 'gefahr' });
    optionen.push({ text: 'Abbrechen', wert: null });
    antwort = frage('Wiederkehrende Aufgabe löschen',
      '„' + aufgabe.titel + '“ – nur diesen einen Termin, oder die ganze Aufgabe mit allen Terminen?',
      optionen);
  }

  antwort.then(function (wahl) {
    if (!wahl) return;
    if (wahl === 'einer') {
      const schluessel = terminSchluessel(aufgabe.id, datum);
      daten.ausgelassen[schluessel] = true;
      speichere();
      zeigeHinweis('Termin gelöscht', 'Rückgängig', function () {
        delete daten.ausgelassen[schluessel];
        speichere();
        aktualisiere();
      });
    } else {
      loescheAufgabe(aufgabe.id);
      zeigeHinweis('Aufgabe gelöscht');
    }
    schliesseBlatt(formHuelle);
    aktualisiere();
  });
});

richteBlattEin(formHuelle);
