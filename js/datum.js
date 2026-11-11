// datum.js – Hilfsfunktionen rund ums Datum.
//
// Wir speichern ein Datum immer als Text im Format "JJJJ-MM-TT",
// zum Beispiel "2026-11-11". Das ist leicht lesbar, lässt sich sortieren
// und macht keine Probleme mit Zeitzonen oder Sommerzeit.

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WOCHENTAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Macht aus Jahr, Monat (1–12) und Tag den Text "JJJJ-MM-TT".
function datumZuText(jahr, monat, tag) {
  return jahr + '-' + String(monat).padStart(2, '0') + '-' + String(tag).padStart(2, '0');
}

// Zerlegt "JJJJ-MM-TT" wieder in seine Teile.
function textZuDatum(text) {
  const teile = text.split('-');
  return { jahr: Number(teile[0]), monat: Number(teile[1]), tag: Number(teile[2]) };
}

// Das heutige Datum laut Uhr des Handys.
function heute() {
  const jetzt = new Date();
  return datumZuText(jetzt.getFullYear(), jetzt.getMonth() + 1, jetzt.getDate());
}

// Rechnet intern mit "UTC", damit Sommer-/Winterzeit nie einen Tag verschluckt.
function alsUtc(text) {
  const d = textZuDatum(text);
  return Date.UTC(d.jahr, d.monat - 1, d.tag);
}

// Zählt n Tage dazu (n darf auch negativ sein).
function plusTage(text, n) {
  const ziel = new Date(alsUtc(text) + n * 86400000);
  return datumZuText(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, ziel.getUTCDate());
}

// Wie viele Tage liegen zwischen zwei Daten? (b minus a)
function tageZwischen(a, b) {
  return Math.round((alsUtc(b) - alsUtc(a)) / 86400000);
}

// Wochentag als Zahl: 1 = Montag … 7 = Sonntag (die Woche beginnt am Montag).
function wochentag(text) {
  const tag = new Date(alsUtc(text)).getUTCDay(); // 0 = Sonntag in JavaScript
  return tag === 0 ? 7 : tag;
}

function istSchaltjahr(jahr) {
  return (jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0;
}

// Anzahl der Tage in einem Monat (Monat 1–12).
function tageImMonat(jahr, monat) {
  return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
}

// Kalenderwoche nach deutscher Zählung (ISO 8601): Die Woche beginnt am Montag,
// und KW 1 ist die Woche mit dem ersten Donnerstag des Jahres.
function kalenderwoche(text) {
  const donnerstag = plusTage(text, 4 - wochentag(text));
  const jahr = textZuDatum(donnerstag).jahr;
  const tagImJahr = tageZwischen(datumZuText(jahr, 1, 1), donnerstag) + 1;
  return Math.floor((tagImJahr - 1) / 7) + 1;
}

// "Mittwoch, 11. November" – mit Jahreszahl, falls es nicht dieses Jahr ist.
function datumLang(text) {
  const d = textZuDatum(text);
  let ergebnis = WOCHENTAGE[wochentag(text) - 1] + ', ' + d.tag + '. ' + MONATE[d.monat - 1];
  if (d.jahr !== textZuDatum(heute()).jahr) ergebnis += ' ' + d.jahr;
  return ergebnis;
}

// "Mi, 11.11." – kurz, z. B. für überfällige Aufgaben.
function datumKurz(text) {
  const d = textZuDatum(text);
  return WOCHENTAGE_KURZ[wochentag(text) - 1] + ', ' + d.tag + '.' + d.monat + '.';
}

// "Heute", "Morgen", "Vor 3 Tagen" …
function datumRelativ(text) {
  const abstand = tageZwischen(heute(), text);
  if (abstand === 0) return 'Heute';
  if (abstand === 1) return 'Morgen';
  if (abstand === -1) return 'Gestern';
  if (abstand > 1) return 'In ' + abstand + ' Tagen';
  return 'Vor ' + (-abstand) + ' Tagen';
}
