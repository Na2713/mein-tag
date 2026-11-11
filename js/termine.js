// termine.js – berechnet, welche Termine an einem Tag in der Liste stehen.
//
// Ein "Termin" ist ein einzelnes Vorkommen einer Aufgabe:
//   { aufgabe, datum, faellig }
//   datum   = ursprüngliches Datum laut Regel (gehört zum Schlüssel "aufgabeId|datum")
//   faellig = an welchem Tag der Termin wirklich dran ist (anders, wenn verschoben)
//
// Diese Datei benutzt das Objekt "daten" aus speicher.js, verändert es aber nie.

// Der Schlüssel für einen einzelnen Termin
function terminSchluessel(aufgabeId, datum) {
  return aufgabeId + '|' + datum;
}

function findeAufgabe(id) {
  return daten.aufgaben.find(function (a) { return a.id === id; });
}

// Noch nicht abgehakt und nicht einzeln gelöscht?
function istOffen(aufgabe, datum) {
  const schluessel = terminSchluessel(aufgabe.id, datum);
  return !daten.erledigt[schluessel] && !daten.ausgelassen[schluessel];
}

function istVerschoben(aufgabe, datum) {
  return Boolean(daten.verschoben[terminSchluessel(aufgabe.id, datum)]);
}

// Alle offenen Termine, die auf einen anderen Tag verschoben wurden
function verschobeneTermine() {
  const termine = [];
  Object.keys(daten.verschoben).forEach(function (schluessel) {
    const teile = schluessel.split('|');
    const aufgabe = findeAufgabe(teile[0]);
    const datum = teile[1];
    // Gibt es die Aufgabe nicht mehr, oder passt der Termin nach einer
    // Regeländerung nicht mehr zur Regel? Dann ignorieren.
    if (!aufgabe || !faelltAuf(aufgabe.regel, datum) || !istOffen(aufgabe, datum)) return;
    termine.push({ aufgabe: aufgabe, datum: datum, faellig: daten.verschoben[schluessel] });
  });
  return termine;
}

// Die offenen Termine, die an genau diesem Tag dran sind (ohne Überfällige)
function termineFuerTag(tag) {
  const termine = [];
  daten.aufgaben.forEach(function (aufgabe) {
    if (faelltAuf(aufgabe.regel, tag) && istOffen(aufgabe, tag) && !istVerschoben(aufgabe, tag)) {
      termine.push({ aufgabe: aufgabe, datum: tag, faellig: tag });
    }
  });
  verschobeneTermine().forEach(function (termin) {
    if (termin.faellig === tag) termine.push(termin);
  });
  return termine;
}

// Alle offenen Termine, die VOR dem Stichtag dran waren – sortiert, die ältesten zuerst
function ueberfaelligeTermine(stichtag) {
  const gestern = plusTage(stichtag, -1);
  const termine = [];
  daten.aufgaben.forEach(function (aufgabe) {
    const von = aufgabe.regel.typ === 'einmalig' ? aufgabe.regel.datum : aufgabe.regel.start;
    termineZwischen(aufgabe.regel, von, gestern).forEach(function (datum) {
      if (istOffen(aufgabe, datum) && !istVerschoben(aufgabe, datum)) {
        termine.push({ aufgabe: aufgabe, datum: datum, faellig: datum });
      }
    });
  });
  verschobeneTermine().forEach(function (termin) {
    if (termin.faellig < stichtag) termine.push(termin);
  });
  termine.sort(function (a, b) {
    if (a.faellig !== b.faellig) return a.faellig < b.faellig ? -1 : 1;
    return a.aufgabe.titel.localeCompare(b.aufgabe.titel, 'de');
  });
  return termine;
}
