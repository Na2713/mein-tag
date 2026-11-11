// speicher.js – merkt sich alle Daten auf dem Handy.
//
// Wir benutzen "localStorage": ein kleiner Speicher, den jeder Browser
// für jede Webseite bereitstellt. Er bleibt erhalten, wenn man die App
// schließt oder das Handy neu startet. Es geht nichts ins Internet.
//
// Alle Daten liegen in EINEM Objekt namens "daten":
//
// {
//   version: 1,
//   kategorien: [ { id, name, farbe } ],
//   aufgaben:   [ { id, titel, notiz, kategorieId, regel, erstellt } ],
//   erledigt:   { "aufgabeId|2026-11-11": true },           // abgehakte Termine
//   verschoben: { "aufgabeId|2026-11-11": "2026-11-12" },   // verschobene Termine
//   ausgelassen:{ "aufgabeId|2026-11-11": true }            // einzeln gelöschte Termine
// }
//
// "aufgabeId|Datum" steht für EINEN Termin einer Aufgabe. Das Datum ist
// immer das ursprüngliche Datum laut Regel – auch wenn der Termin verschoben wurde.

const SPEICHER_SCHLUESSEL = 'meinTag.daten';

let daten;

// Die Startdaten beim allerersten Öffnen der App
function startDaten() {
  const tag = heute();
  return {
    version: 1,
    kategorien: [
      { id: 'haushalt', name: 'Haushalt', farbe: '#bfe6d3' },      // Mint
      { id: 'arbeit', name: 'Arbeit', farbe: '#d8cff3' },          // Lavendel
      { id: 'finanzen', name: 'Finanzen', farbe: '#fbd5b9' },      // Pfirsich
      { id: 'persoenlich', name: 'Persönlich', farbe: '#f6cdd5' }  // Rosé
    ],
    // Ein paar Beispiele, damit die App nicht leer ist. Du kannst sie später löschen.
    aufgaben: [
      beispiel('Pflanzen gießen', 'Beispiel – darfst du löschen', 'haushalt',
        { typ: 'einmalig', datum: tag }),
      beispiel('Müll rausbringen', 'Gelbe Tonne', 'haushalt',
        { typ: 'woechentlich', alleXWochen: 2, wochentage: [wochentag(tag)], start: tag }),
      beispiel('Wochenbericht schreiben', '', 'arbeit',
        { typ: 'woechentlich', alleXWochen: 1, wochentage: [5], start: tag }),
      beispiel('Miete überweisen', '', 'finanzen',
        { typ: 'monatTag', tag: 1, start: tag }),
      beispiel('Kontoauszüge prüfen', '', 'finanzen',
        { typ: 'monatLetzter', start: tag }),
      beispiel('Mama anrufen', '', 'persoenlich',
        { typ: 'woechentlich', alleXWochen: 1, wochentage: [7], start: tag })
    ],
    erledigt: {},
    verschoben: {},
    ausgelassen: {}
  };
}

function beispiel(titel, notiz, kategorieId, regel) {
  return {
    id: neueId(),
    titel: titel,
    notiz: notiz,
    kategorieId: kategorieId,
    regel: regel,
    erstellt: heute()
  };
}

// Erzeugt eine eindeutige Kennung, z. B. "lq3k9x2a7f1"
function neueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Liest die Daten beim Start der App. Gibt es noch keine, nehmen wir die Startdaten.
function ladeDaten() {
  try {
    const text = localStorage.getItem(SPEICHER_SCHLUESSEL);
    if (text) {
      daten = vervollstaendige(JSON.parse(text));
      return;
    }
  } catch (fehler) {
    console.warn('Gespeicherte Daten konnten nicht gelesen werden:', fehler);
  }
  daten = startDaten();
  speichere();
}

// Stellt sicher, dass alle Teile vorhanden sind (wichtig z. B. nach einem Import).
function vervollstaendige(d) {
  return {
    version: 1,
    kategorien: Array.isArray(d.kategorien) ? d.kategorien : [],
    aufgaben: (Array.isArray(d.aufgaben) ? d.aufgaben : []).map(function (a) {
      return Object.assign({}, a, { notiz: a.notiz || '', kategorieId: a.kategorieId || '' });
    }),
    erledigt: istObjekt(d.erledigt) ? d.erledigt : {},
    verschoben: istObjekt(d.verschoben) ? d.verschoben : {},
    ausgelassen: istObjekt(d.ausgelassen) ? d.ausgelassen : {}
  };
}

function istObjekt(wert) {
  return Boolean(wert) && typeof wert === 'object' && !Array.isArray(wert);
}

// ---------- Datensicherung (Export / Import) ----------

// Alles, was in die Sicherungsdatei kommt
function erstelleSicherung() {
  return {
    app: 'Mein Tag',
    version: 1,
    exportiert: new Date().toISOString(),
    daten: daten
  };
}

const REGEL_TYPEN = ['einmalig', 'woechentlich', 'monatTag', 'monatWochentag', 'monatLetzter', 'jaehrlich'];
const DATUMS_MUSTER = /^\d{4}-\d{2}-\d{2}$/;

// Prüft den Inhalt einer Sicherungsdatei, bevor er übernommen wird.
// Gibt { daten, exportiert } zurück – oder { fehler } mit einer Erklärung.
function pruefeSicherung(inhalt) {
  const falscheDatei = { fehler: 'Diese Datei ist keine Sicherung von „Mein Tag“.' };
  if (!istObjekt(inhalt)) return falscheDatei;

  // Wir nehmen auch eine Datei an, in der nur das "daten"-Objekt steht
  const d = istObjekt(inhalt.daten) ? inhalt.daten : inhalt;
  if (!Array.isArray(d.aufgaben) || !Array.isArray(d.kategorien)) return falscheDatei;

  const kaputteKategorie = d.kategorien.some(function (k) {
    return !istObjekt(k) || typeof k.id !== 'string' || typeof k.name !== 'string' || typeof k.farbe !== 'string';
  });
  const kaputteAufgabe = d.aufgaben.some(function (a) {
    if (!istObjekt(a) || typeof a.id !== 'string' || typeof a.titel !== 'string') return true;
    const r = a.regel;
    if (!istObjekt(r) || REGEL_TYPEN.indexOf(r.typ) < 0) return true;
    if (r.typ === 'einmalig') return !DATUMS_MUSTER.test(r.datum);
    if (!DATUMS_MUSTER.test(r.start)) return true;
    if (r.typ === 'woechentlich') return !Array.isArray(r.wochentage) || r.wochentage.length === 0;
    return false;
  });
  if (kaputteKategorie || kaputteAufgabe) {
    return { fehler: 'Die Datei ist beschädigt: Mindestens eine Aufgabe oder Kategorie ist unvollständig.' };
  }

  return { daten: vervollstaendige(d), exportiert: typeof inhalt.exportiert === 'string' ? inhalt.exportiert : null };
}

// Löscht eine Aufgabe samt allen ihren Terminen (erledigt, verschoben, ausgelassen)
function loescheAufgabe(aufgabeId) {
  daten.aufgaben = daten.aufgaben.filter(function (a) { return a.id !== aufgabeId; });
  [daten.erledigt, daten.verschoben, daten.ausgelassen].forEach(function (liste) {
    Object.keys(liste).forEach(function (schluessel) {
      if (schluessel.indexOf(aufgabeId + '|') === 0) delete liste[schluessel];
    });
  });
  speichere();
}

// Löscht eine Kategorie. Ihre Aufgaben bleiben erhalten und sind dann "Ohne Kategorie".
function loescheKategorie(kategorieId) {
  daten.kategorien = daten.kategorien.filter(function (k) { return k.id !== kategorieId; });
  daten.aufgaben.forEach(function (a) {
    if (a.kategorieId === kategorieId) a.kategorieId = '';
  });
  speichere();
}

// Schreibt die Daten in den Speicher. Nach jeder Änderung aufrufen!
let speicherWarnungGezeigt = false;
function speichere() {
  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
  } catch (fehler) {
    console.warn('Speichern fehlgeschlagen:', fehler);
    if (!speicherWarnungGezeigt) {
      speicherWarnungGezeigt = true;
      alert('Achtung: Deine Änderungen konnten nicht gespeichert werden. ' +
        'Bist du vielleicht in einem privaten Browserfenster?');
    }
  }
}
