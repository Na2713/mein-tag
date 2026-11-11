// regeln.js – die Wiederholungsregeln.
//
// Jede Aufgabe hat eine "regel". So sehen die sechs Arten aus:
//
//   { typ: 'einmalig',       datum: '2026-11-20' }
//   { typ: 'woechentlich',   alleXWochen: 2, wochentage: [2], start: '2026-11-11' }
//                            → alle 2 Wochen am Dienstag (1 = Mo … 7 = So)
//   { typ: 'monatTag',       tag: 31, start: … }   → am 31., sonst am Monatsletzten
//   { typ: 'monatWochentag', nummer: 1, wochentag: 1, start: … }
//                            → am 1. Montag im Monat (nummer -1 = am letzten …)
//   { typ: 'monatLetzter',   start: … }            → am letzten Tag des Monats
//   { typ: 'jaehrlich',      monat: 3, tag: 3, start: … }  → jedes Jahr am 3. März
//
// "start" ist der Tag, ab dem die Regel gilt (normalerweise der Tag des Anlegens).
// Davor gibt es keine Termine – also keine rückwirkenden Einträge.

// Die Kernfrage: Hat diese Regel an diesem Datum einen Termin?
function faelltAuf(regel, datum) {
  if (regel.typ === 'einmalig') return datum === regel.datum;

  // Daten im Format JJJJ-MM-TT kann man direkt wie Wörter vergleichen.
  if (datum < regel.start) return false;

  const d = textZuDatum(datum);
  const letzterTag = tageImMonat(d.jahr, d.monat);

  switch (regel.typ) {
    case 'woechentlich': {
      if (regel.wochentage.indexOf(wochentag(datum)) < 0) return false;
      // Gezählt wird ab der Woche des ersten Termins: Woche 0, X, 2X, …
      const erster = ersterWochenTermin(regel);
      const wochen = tageZwischen(montagDerWoche(erster), montagDerWoche(datum)) / 7;
      return wochen % (regel.alleXWochen || 1) === 0;
    }

    case 'monatTag':
      // Gibt es den Tag nicht (z. B. 31. im April), dann der letzte Tag des Monats
      return d.tag === Math.min(regel.tag, letzterTag);

    case 'monatWochentag':
      if (wochentag(datum) !== regel.wochentag) return false;
      if (regel.nummer === -1) return d.tag + 7 > letzterTag;  // keiner mehr danach im Monat
      return Math.ceil(d.tag / 7) === regel.nummer;           // Tag 1–7 = 1., 8–14 = 2. …

    case 'monatLetzter':
      return d.tag === letzterTag;

    case 'jaehrlich':
      // 29. Februar: in Jahren ohne Schalttag am 28. Februar
      return d.monat === regel.monat && d.tag === Math.min(regel.tag, letzterTag);
  }
  return false;
}

// Der erste passende Wochentag am oder nach dem Startdatum
function ersterWochenTermin(regel) {
  for (let i = 0; i < 7; i++) {
    const tag = plusTage(regel.start, i);
    if (regel.wochentage.indexOf(wochentag(tag)) >= 0) return tag;
  }
  return regel.start;
}

function montagDerWoche(datum) {
  return plusTage(datum, 1 - wochentag(datum));
}

// Alle Termine einer Regel zwischen zwei Daten (beide eingeschlossen)
function termineZwischen(regel, von, bis) {
  if (regel.typ === 'einmalig') {
    return (regel.datum >= von && regel.datum <= bis) ? [regel.datum] : [];
  }
  const ergebnis = [];
  let tag = von < regel.start ? regel.start : von;
  while (tag <= bis) {
    if (faelltAuf(regel, tag)) ergebnis.push(tag);
    tag = plusTage(tag, 1);
  }
  return ergebnis;
}

// Die nächsten paar Termine ab einem Datum (für die Vorschau im Formular).
// Sucht höchstens 4 Jahre weit, damit auch "jährlich" mehrere Termine findet.
function naechsteTermine(regel, ab, anzahl) {
  if (regel.typ === 'einmalig') return regel.datum >= ab ? [regel.datum] : [];
  const ergebnis = [];
  let tag = ab < regel.start ? regel.start : ab;
  const ende = plusTage(tag, 4 * 366);
  while (tag <= ende && ergebnis.length < anzahl) {
    if (faelltAuf(regel, tag)) ergebnis.push(tag);
    tag = plusTage(tag, 1);
  }
  return ergebnis;
}

// Die Regel als kurzer deutscher Satz, z. B. "Alle 2 Wochen am Di"
function regelBeschreibung(regel) {
  switch (regel.typ) {
    case 'einmalig':
      return 'Einmalig am ' + datumKurz(regel.datum);
    case 'woechentlich': {
      const tage = regel.wochentage.slice().sort().map(function (n) {
        return WOCHENTAGE_KURZ[n - 1];
      }).join(', ');
      const x = regel.alleXWochen || 1;
      if (x === 1 && regel.wochentage.length === 7) return 'Jeden Tag';
      if (x === 1) return 'Jede Woche am ' + tage;
      return 'Alle ' + x + ' Wochen am ' + tage;
    }
    case 'monatTag':
      return 'Monatlich am ' + regel.tag + '.' + (regel.tag > 28 ? ' (sonst am Monatsletzten)' : '');
    case 'monatWochentag':
      return 'Monatlich am ' + (regel.nummer === -1 ? 'letzten ' : regel.nummer + '. ')
        + WOCHENTAGE[regel.wochentag - 1];
    case 'monatLetzter':
      return 'Monatlich am letzten Tag';
    case 'jaehrlich':
      return 'Jährlich am ' + regel.tag + '. ' + MONATE[regel.monat - 1];
  }
  return '';
}
