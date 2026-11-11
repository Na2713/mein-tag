// tests.js – prüft automatisch, ob die Datums- und Wiederholungslogik stimmt.
// Jeder Test vergleicht ein berechnetes Ergebnis ("ist") mit dem richtigen ("soll").
// Die richtigen Ergebnisse wurden von Hand im Kalender nachgeschlagen.

const ergebnisse = [];

function gruppe(name) {
  ergebnisse.push({ gruppe: name });
}

function pruefe(beschreibung, ist, soll) {
  const istText = JSON.stringify(ist);
  const sollText = JSON.stringify(soll);
  ergebnisse.push({ beschreibung: beschreibung, ok: istText === sollText, ist: istText, soll: sollText });
}

// Kurzschreibweisen für Regeln
function woechentlich(alleXWochen, wochentage, start) {
  return { typ: 'woechentlich', alleXWochen: alleXWochen, wochentage: wochentage, start: start };
}

// ---------------------------------------------------------------
gruppe('Datum: Grundlagen');

pruefe('11.11.2026 ist ein Mittwoch', wochentag('2026-11-11'), 3);
pruefe('15.11.2026 ist ein Sonntag (= 7, Woche beginnt Montag)', wochentag('2026-11-15'), 7);
pruefe('16.11.2026 ist ein Montag', wochentag('2026-11-16'), 1);
pruefe('Silvester + 1 Tag = Neujahr', plusTage('2026-12-31', 1), '2027-01-01');
pruefe('1. März − 1 Tag (kein Schaltjahr)', plusTage('2026-03-01', -1), '2026-02-28');
pruefe('28.02.2028 + 1 Tag = Schalttag', plusTage('2028-02-28', 1), '2028-02-29');
pruefe('28.02.2027 + 1 Tag = 1. März', plusTage('2027-02-28', 1), '2027-03-01');
pruefe('Sommerzeit-Umstellung verschluckt keinen Tag', plusTage('2026-03-28', 1), '2026-03-29');
pruefe('Tag nach der Sommerzeit-Umstellung', plusTage('2026-03-29', 1), '2026-03-30');
pruefe('Winterzeit-Umstellung', plusTage('2026-10-24', 2), '2026-10-26');
pruefe('Tage zwischen über Zeitumstellung', tageZwischen('2026-03-28', '2026-03-30'), 2);
pruefe('2024 ist Schaltjahr', istSchaltjahr(2024), true);
pruefe('2026 ist kein Schaltjahr', istSchaltjahr(2026), false);
pruefe('2100 ist kein Schaltjahr (durch 100 teilbar)', istSchaltjahr(2100), false);
pruefe('2000 ist Schaltjahr (durch 400 teilbar)', istSchaltjahr(2000), true);
pruefe('Februar 2028 hat 29 Tage', tageImMonat(2028, 2), 29);
pruefe('Februar 2026 hat 28 Tage', tageImMonat(2026, 2), 28);
pruefe('April hat 30 Tage', tageImMonat(2026, 4), 30);
pruefe('Dezember hat 31 Tage', tageImMonat(2026, 12), 31);
pruefe('Deutsches Datumsformat (anderes Jahr mit Jahreszahl)', datumLang('2025-03-03'), 'Montag, 3. März 2025');
pruefe('Kurzes Datumsformat', datumKurz('2026-11-04'), 'Mi, 4.11.');
pruefe('Kalenderwoche: 11.11.2026 ist KW 46', kalenderwoche('2026-11-11'), 46);
pruefe('Kalenderwoche: 1.1.2027 gehört noch zu KW 53 von 2026', kalenderwoche('2027-01-01'), 53);
pruefe('Kalenderwoche: 4.1.2027 ist KW 1', kalenderwoche('2027-01-04'), 1);
pruefe('Kalenderwoche: 30.12.2024 gehört schon zu KW 1 von 2025', kalenderwoche('2024-12-30'), 1);
pruefe('Kalenderwoche: Sonntag gehört zur Woche davor (15.11.2026)', kalenderwoche('2026-11-15'), 46);

// ---------------------------------------------------------------
gruppe('Einmalig');

pruefe('Termin liegt im Zeitraum',
  termineZwischen({ typ: 'einmalig', datum: '2026-11-20' }, '2026-11-01', '2026-11-30'),
  ['2026-11-20']);
pruefe('Termin liegt außerhalb',
  termineZwischen({ typ: 'einmalig', datum: '2026-12-20' }, '2026-11-01', '2026-11-30'),
  []);

// ---------------------------------------------------------------
gruppe('Wöchentlich und alle X Wochen');

pruefe('Alle 2 Wochen Di, angelegt Mi 11.11. – auch über den Jahreswechsel',
  termineZwischen(woechentlich(2, [2], '2026-11-11'), '2026-11-01', '2027-01-31'),
  ['2026-11-17', '2026-12-01', '2026-12-15', '2026-12-29', '2027-01-12', '2027-01-26']);
pruefe('Alle 2 Wochen Di: genau ein Jahr später (52 Wochen) ist ein Termin',
  faelltAuf(woechentlich(2, [2], '2026-11-11'), '2027-11-16'), true);
pruefe('Alle 2 Wochen Di: 53 Wochen später ist kein Termin',
  faelltAuf(woechentlich(2, [2], '2026-11-11'), '2027-11-23'), false);
pruefe('Jede Woche Mo + Fr',
  termineZwischen(woechentlich(1, [1, 5], '2026-11-11'), '2026-11-01', '2026-11-30'),
  ['2026-11-13', '2026-11-16', '2026-11-20', '2026-11-23', '2026-11-27', '2026-11-30']);
pruefe('Alle 2 Wochen Mo + Do: Mo 9.11. liegt vor dem Start, gezählt wird ab Do 12.11.',
  termineZwischen(woechentlich(2, [1, 4], '2026-11-11'), '2026-11-01', '2026-12-10'),
  ['2026-11-12', '2026-11-23', '2026-11-26', '2026-12-07', '2026-12-10']);
pruefe('Alle 3 Wochen Mi, Start ist selbst ein Mittwoch',
  termineZwischen(woechentlich(3, [3], '2026-11-11'), '2026-11-01', '2026-12-31'),
  ['2026-11-11', '2026-12-02', '2026-12-23']);
pruefe('Alle 2 Wochen Di über den Schalttag 2028',
  termineZwischen(woechentlich(2, [2], '2028-02-22'), '2028-02-01', '2028-03-31'),
  ['2028-02-22', '2028-03-07', '2028-03-21']);
pruefe('Keine rückwirkenden Termine vor dem Start',
  faelltAuf(woechentlich(1, [2], '2026-11-11'), '2026-11-10'), false);

// ---------------------------------------------------------------
gruppe('Monatlich an einem Tag');

pruefe('Am 31.: in kurzen Monaten am Monatsletzten',
  termineZwischen({ typ: 'monatTag', tag: 31, start: '2026-01-01' }, '2026-01-01', '2026-12-31'),
  ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30',
    '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31', '2026-11-30', '2026-12-31']);
pruefe('Am 30.: im Schaltjahr am 29. Februar',
  termineZwischen({ typ: 'monatTag', tag: 30, start: '2028-01-01' }, '2028-02-01', '2028-03-31'),
  ['2028-02-29', '2028-03-30']);
pruefe('Am 29.: im Schaltjahr genau einmal im Februar (nicht auch am 28.)',
  termineZwischen({ typ: 'monatTag', tag: 29, start: '2028-01-01' }, '2028-02-01', '2028-02-29'),
  ['2028-02-29']);
pruefe('Am 29.: ohne Schaltjahr am 28. Februar',
  termineZwischen({ typ: 'monatTag', tag: 29, start: '2027-01-01' }, '2027-02-01', '2027-03-01'),
  ['2027-02-28']);
pruefe('Am 15., angelegt am 20.11.: erster Termin erst im Dezember',
  termineZwischen({ typ: 'monatTag', tag: 15, start: '2026-11-20' }, '2026-11-01', '2027-01-31'),
  ['2026-12-15', '2027-01-15']);

// ---------------------------------------------------------------
gruppe('Monatlich am letzten Tag');

pruefe('Letzter Tag im Schaltjahr 2028',
  termineZwischen({ typ: 'monatLetzter', start: '2028-01-01' }, '2028-01-01', '2028-04-30'),
  ['2028-01-31', '2028-02-29', '2028-03-31', '2028-04-30']);
pruefe('Letzter Tag im Februar 2027',
  termineZwischen({ typ: 'monatLetzter', start: '2027-01-01' }, '2027-02-01', '2027-03-01'),
  ['2027-02-28']);

// ---------------------------------------------------------------
gruppe('Monatlich am n-ten Wochentag');

pruefe('1. Montag im Monat',
  termineZwischen({ typ: 'monatWochentag', nummer: 1, wochentag: 1, start: '2026-11-01' }, '2026-11-01', '2027-01-31'),
  ['2026-11-02', '2026-12-07', '2027-01-04']);
pruefe('1. Montag, wenn der Monat mit Montag beginnt (1.3.2027)',
  termineZwischen({ typ: 'monatWochentag', nummer: 1, wochentag: 1, start: '2027-01-01' }, '2027-03-01', '2027-03-31'),
  ['2027-03-01']);
pruefe('3. Dienstag im November 2026',
  termineZwischen({ typ: 'monatWochentag', nummer: 3, wochentag: 2, start: '2026-11-01' }, '2026-11-01', '2026-11-30'),
  ['2026-11-17']);
pruefe('4. Montag im Februar 2026',
  termineZwischen({ typ: 'monatWochentag', nummer: 4, wochentag: 1, start: '2026-01-01' }, '2026-02-01', '2026-02-28'),
  ['2026-02-23']);
pruefe('Letzter Freitag im Monat',
  termineZwischen({ typ: 'monatWochentag', nummer: -1, wochentag: 5, start: '2026-11-01' }, '2026-11-01', '2027-01-31'),
  ['2026-11-27', '2026-12-25', '2027-01-29']);
pruefe('Letzter Sonntag im Februar 2028 (Schaltjahr)',
  termineZwischen({ typ: 'monatWochentag', nummer: -1, wochentag: 7, start: '2028-01-01' }, '2028-02-01', '2028-02-29'),
  ['2028-02-27']);

// ---------------------------------------------------------------
gruppe('Jährlich');

pruefe('3. März, angelegt im November: erst im nächsten Jahr',
  termineZwischen({ typ: 'jaehrlich', monat: 3, tag: 3, start: '2026-11-11' }, '2026-01-01', '2028-12-31'),
  ['2027-03-03', '2028-03-03']);
pruefe('29. Februar: ohne Schaltjahr am 28. Februar',
  termineZwischen({ typ: 'jaehrlich', monat: 2, tag: 29, start: '2024-01-01' }, '2024-01-01', '2028-12-31'),
  ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
pruefe('Termin am Tag des Anlegens zählt mit',
  termineZwischen({ typ: 'jaehrlich', monat: 12, tag: 31, start: '2026-12-31' }, '2026-12-01', '2027-12-31'),
  ['2026-12-31', '2027-12-31']);

// ---------------------------------------------------------------
gruppe('Vorschau der nächsten Termine');

pruefe('Nächste 3 Termine "jährlich" über mehrere Jahre',
  naechsteTermine({ typ: 'jaehrlich', monat: 2, tag: 29, start: '2026-11-11' }, '2026-11-11', 3),
  ['2027-02-28', '2028-02-29', '2029-02-28']);
pruefe('Vorschau beginnt frühestens am Startdatum',
  naechsteTermine({ typ: 'monatLetzter', start: '2026-12-05' }, '2026-11-11', 2),
  ['2026-12-31', '2027-01-31']);
pruefe('Einmaliger Termin in der Vergangenheit: keine Vorschau',
  naechsteTermine({ typ: 'einmalig', datum: '2026-11-01' }, '2026-11-11', 3),
  []);

// ---------------------------------------------------------------
gruppe('Tagesliste: Überfällig, Verschieben, Erledigt');

// Für diese Tests bauen wir uns eigene kleine Testdaten (statt der echten aus dem Speicher).
// "daten" selbst kommt aus speicher.js.
function testDaten(aufgaben) {
  daten = { version: 1, kategorien: [], aufgaben: aufgaben, erledigt: {}, verschoben: {}, ausgelassen: {} };
}
// Macht aus Terminen kurze Texte wie "Müll 2026-11-17 (von 2026-11-16)"
function kurz(termine) {
  return termine.map(function (t) {
    return t.aufgabe.titel + ' ' + t.faellig + (t.datum !== t.faellig ? ' (von ' + t.datum + ')' : '');
  });
}

const muell = { id: 'm', titel: 'Müll', regel: woechentlich(1, [1], '2026-11-02') };  // jeden Montag ab 2.11.
const arzt = { id: 'a', titel: 'Arzt', regel: { typ: 'einmalig', datum: '2026-11-05' } };
testDaten([muell, arzt]);

pruefe('Jeder verpasste Termin ist einzeln überfällig, älteste zuerst',
  kurz(ueberfaelligeTermine('2026-11-11')),
  ['Müll 2026-11-02', 'Arzt 2026-11-05', 'Müll 2026-11-09']);

daten.erledigt['m|2026-11-02'] = true;
pruefe('Abgehakter Termin ist nicht mehr überfällig',
  kurz(ueberfaelligeTermine('2026-11-11')),
  ['Arzt 2026-11-05', 'Müll 2026-11-09']);

daten.verschoben['a|2026-11-05'] = '2026-11-13';
pruefe('In die Zukunft verschoben: nicht mehr überfällig',
  kurz(ueberfaelligeTermine('2026-11-11')),
  ['Müll 2026-11-09']);
pruefe('Verschobener Termin erscheint am neuen Tag',
  kurz(termineFuerTag('2026-11-13')),
  ['Arzt 2026-11-13 (von 2026-11-05)']);
pruefe('… und nicht mehr am alten Tag',
  kurz(termineFuerTag('2026-11-05')),
  []);

daten.verschoben['m|2026-11-16'] = '2026-11-17';
pruefe('Verschieben betrifft nur diesen einen Termin der Wiederholung',
  [kurz(termineFuerTag('2026-11-16')), kurz(termineFuerTag('2026-11-17')), kurz(termineFuerTag('2026-11-23'))],
  [[], ['Müll 2026-11-17 (von 2026-11-16)'], ['Müll 2026-11-23']]);

daten.verschoben['m|2026-11-09'] = '2026-11-10';
pruefe('Verschoben, aber wieder nicht erledigt: wieder überfällig',
  kurz(ueberfaelligeTermine('2026-11-11')),
  ['Müll 2026-11-10 (von 2026-11-09)']);

daten.erledigt['m|2026-11-09'] = true;
pruefe('Verschobenen Termin abhaken',
  kurz(ueberfaelligeTermine('2026-11-11')),
  []);

daten.ausgelassen['m|2026-11-23'] = true;
pruefe('Einzeln gelöschter Termin fehlt, der nächste ist da',
  [kurz(termineFuerTag('2026-11-23')), kurz(termineFuerTag('2026-11-30'))],
  [[], ['Müll 2026-11-30']]);

arzt.regel = { typ: 'einmalig', datum: '2026-11-20' };
pruefe('Nach Datumsänderung zählt die alte Verschiebung nicht mehr',
  [kurz(termineFuerTag('2026-11-13')), kurz(termineFuerTag('2026-11-20'))],
  [[], ['Arzt 2026-11-20']]);

testDaten([{ id: 'z', titel: 'Später', regel: woechentlich(1, [1, 2, 3, 4, 5, 6, 7], '2026-11-20') }]);
pruefe('Regel mit Start in der Zukunft: nichts überfällig',
  kurz(ueberfaelligeTermine('2026-11-11')),
  []);

testDaten([{ id: 't', titel: 'Täglich', regel: woechentlich(1, [1, 2, 3, 4, 5, 6, 7], '2026-11-09') }]);
pruefe('Heute zählt nicht als überfällig',
  kurz(ueberfaelligeTermine('2026-11-11')),
  ['Täglich 2026-11-09', 'Täglich 2026-11-10']);

// ---------------------------------------------------------------
gruppe('Datensicherung');

testDaten([
  { id: 'x1', titel: 'Müll', notiz: 'Gelb', kategorieId: 'k1', regel: woechentlich(2, [2], '2026-11-11') },
  { id: 'x2', titel: 'Arzt', notiz: '', kategorieId: '', regel: { typ: 'einmalig', datum: '2026-11-20' } }
]);
daten.kategorien = [{ id: 'k1', name: 'Haushalt', farbe: '#bfe6d3' }];
daten.erledigt['x1|2026-11-17'] = true;
daten.verschoben['x2|2026-11-20'] = '2026-11-21';

const wiederEingelesen = pruefeSicherung(JSON.parse(JSON.stringify(erstelleSicherung())));
pruefe('Export und wieder Import ergibt genau dieselben Daten',
  wiederEingelesen.daten, daten);
pruefe('Exportdatum wird mitgelesen',
  typeof wiederEingelesen.exportiert, 'string');
pruefe('Datei ohne Hülle (nur die Daten) wird auch akzeptiert',
  pruefeSicherung(JSON.parse(JSON.stringify(daten))).daten, daten);
pruefe('Fehlende Notiz und Kategorie werden ergänzt',
  pruefeSicherung({ kategorien: [], aufgaben: [{ id: 'a', titel: 'T', regel: { typ: 'einmalig', datum: '2026-01-01' } }] })
    .daten.aufgaben[0],
  { id: 'a', titel: 'T', regel: { typ: 'einmalig', datum: '2026-01-01' }, notiz: '', kategorieId: '' });
pruefe('Irgendeine andere Datei wird abgelehnt',
  Boolean(pruefeSicherung({ name: 'Einkaufsliste', eintraege: [] }).fehler), true);
pruefe('Leere Datei wird abgelehnt',
  Boolean(pruefeSicherung(null).fehler), true);
pruefe('Unbekannte Regelart wird abgelehnt',
  Boolean(pruefeSicherung({ kategorien: [], aufgaben: [{ id: 'a', titel: 'T', regel: { typ: 'stündlich', start: '2026-01-01' } }] }).fehler), true);
pruefe('Kaputtes Datum wird abgelehnt',
  Boolean(pruefeSicherung({ kategorien: [], aufgaben: [{ id: 'a', titel: 'T', regel: { typ: 'einmalig', datum: '20.11.2026' } }] }).fehler), true);
pruefe('Wöchentlich ohne Wochentage wird abgelehnt',
  Boolean(pruefeSicherung({ kategorien: [], aufgaben: [{ id: 'a', titel: 'T', regel: { typ: 'woechentlich', alleXWochen: 1, wochentage: [], start: '2026-01-01' } }] }).fehler), true);

// ---------------------------------------------------------------
gruppe('Beschreibungen');

pruefe('Alle 2 Wochen', regelBeschreibung(woechentlich(2, [2], '2026-11-11')), 'Alle 2 Wochen am Di');
pruefe('Jede Woche (sortiert)', regelBeschreibung(woechentlich(1, [5, 1], '2026-11-11')), 'Jede Woche am Mo, Fr');
pruefe('Monatlich am 31.', regelBeschreibung({ typ: 'monatTag', tag: 31 }), 'Monatlich am 31. (sonst am Monatsletzten)');
pruefe('n-ter Wochentag', regelBeschreibung({ typ: 'monatWochentag', nummer: 1, wochentag: 1 }), 'Monatlich am 1. Montag');
pruefe('Letzter Wochentag', regelBeschreibung({ typ: 'monatWochentag', nummer: -1, wochentag: 5 }), 'Monatlich am letzten Freitag');
pruefe('Jährlich', regelBeschreibung({ typ: 'jaehrlich', monat: 3, tag: 3 }), 'Jährlich am 3. März');

// ---------------------------------------------------------------
// Ergebnisse anzeigen

function zeigeErgebnisse() {
  const tests = ergebnisse.filter(function (e) { return !e.gruppe; });
  const fehler = tests.filter(function (e) { return !e.ok; });

  const zusammenfassung = document.getElementById('zusammenfassung');
  zusammenfassung.className = fehler.length === 0 ? 'zusammenfassung gut' : 'zusammenfassung schlecht';
  zusammenfassung.textContent = fehler.length === 0
    ? '✓ Alle ' + tests.length + ' Tests bestanden'
    : '✗ ' + fehler.length + ' von ' + tests.length + ' Tests fehlgeschlagen';

  const liste = document.getElementById('ergebnisse');
  ergebnisse.forEach(function (e) {
    if (e.gruppe) {
      const h = document.createElement('h2');
      h.textContent = e.gruppe;
      liste.append(h);
      return;
    }
    const zeile = document.createElement('div');
    zeile.className = 'test ' + (e.ok ? 'gut' : 'schlecht');
    zeile.textContent = (e.ok ? '✓ ' : '✗ ') + e.beschreibung;
    if (!e.ok) {
      const details = document.createElement('div');
      details.className = 'details';
      details.textContent = 'erwartet: ' + e.soll + '\nbekommen: ' + e.ist;
      zeile.append(details);
    }
    liste.append(zeile);
  });
}

if (typeof document !== 'undefined') zeigeErgebnisse();
