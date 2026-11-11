// sicherung.js – "Daten exportieren" und "Daten importieren".
// Die Prüfung der Datei steckt in speicher.js (pruefeSicherung).

const SICHERUNG_SCHLUESSEL = 'meinTag.letzteSicherung';

// ---------- Anzeige "Zuletzt gesichert" ----------

function zeigeLetzteSicherung() {
  let letzte = null;
  try { letzte = localStorage.getItem(SICHERUNG_SCHLUESSEL); } catch (fehler) { /* egal */ }

  const anzeige = document.getElementById('letzte-sicherung');
  anzeige.classList.remove('warnung');
  if (!letzte) {
    anzeige.textContent = 'Noch keine Sicherung erstellt.';
    anzeige.classList.add('warnung');
    return;
  }
  const tage = tageZwischen(letzte, heute());
  anzeige.textContent = 'Zuletzt gesichert: ' +
    (tage === 0 ? 'heute' : tage === 1 ? 'gestern' : 'vor ' + tage + ' Tagen') +
    ' (' + datumKurz(letzte) + ')';
  if (tage > 30) anzeige.classList.add('warnung');
}

// ---------- Exportieren ----------

// iPhone und iPad erkennen (dort klappt Teilen → "In Dateien sichern" am besten)
function istApplegeraet() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function exportiere() {
  const text = JSON.stringify(erstelleSicherung(), null, 2);
  const name = 'mein-tag-sicherung-' + heute() + '.json';
  const datei = new File([text], name, { type: 'application/json' });

  if (istApplegeraet() && navigator.canShare && navigator.canShare({ files: [datei] })) {
    navigator.share({ files: [datei], title: 'Mein Tag – Sicherung' })
      .then(gesichert)
      .catch(function (fehler) {
        if (fehler.name !== 'AbortError') {   // AbortError = selbst abgebrochen
          herunterladen(datei);
          gesichert();
        }
      });
  } else {
    herunterladen(datei);
    gesichert();
  }
}

// Lädt eine Datei herunter – mit einem unsichtbaren Link, den wir "anklicken"
function herunterladen(datei) {
  const adresse = URL.createObjectURL(datei);
  const link = el('a');
  link.href = adresse;
  link.download = datei.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(adresse); }, 1000);
}

function gesichert() {
  try { localStorage.setItem(SICHERUNG_SCHLUESSEL, heute()); } catch (fehler) { /* egal */ }
  zeigeLetzteSicherung();
  zeigeHinweis('Sicherung erstellt');
}

// ---------- Importieren ----------

const importFeld = document.getElementById('import-datei');

function importiere(datei) {
  datei.text().then(function (text) {
    let inhalt;
    try {
      inhalt = JSON.parse(text);
    } catch (fehler) {
      inhalt = null;
    }
    const ergebnis = pruefeSicherung(inhalt);
    if (ergebnis.fehler) {
      frage('Import nicht möglich', ergebnis.fehler, [{ text: 'OK', wert: null, art: 'haupt' }]);
      return;
    }

    const neu = ergebnis.daten;
    let vom = '';
    if (ergebnis.exportiert) {
      const d = new Date(ergebnis.exportiert);
      if (!isNaN(d)) vom = ' vom ' + datumKurz(datumZuText(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    }
    frage('Sicherung laden?',
      'Die Sicherung' + vom + ' enthält ' + anzahlText(neu.aufgaben.length, 'Aufgabe', 'Aufgaben') +
      ' und ' + anzahlText(neu.kategorien.length, 'Kategorie', 'Kategorien') + '. ' +
      'Deine jetzigen Daten (' + anzahlText(daten.aufgaben.length, 'Aufgabe', 'Aufgaben') + ') werden dadurch ersetzt.',
      [
        { text: 'Ersetzen', wert: true, art: 'gefahr' },
        { text: 'Abbrechen', wert: null }
      ]
    ).then(function (ja) {
      if (!ja) return;
      const vorher = daten;     // für "Rückgängig" merken
      daten = neu;
      speichere();
      aktualisiere();
      zeigeHinweis('Daten importiert', 'Rückgängig', function () {
        daten = vorher;
        speichere();
        aktualisiere();
      });
    });
  });
}

function anzahlText(anzahl, einzahl, mehrzahl) {
  return anzahl + ' ' + (anzahl === 1 ? einzahl : mehrzahl);
}

// ---------- Knöpfe ----------

document.getElementById('btn-export').addEventListener('click', exportiere);
document.getElementById('btn-import').addEventListener('click', function () {
  importFeld.value = '';   // damit dieselbe Datei auch zweimal gewählt werden kann
  importFeld.click();
});
importFeld.addEventListener('change', function () {
  if (importFeld.files[0]) importiere(importFeld.files[0]);
});

zeigeLetzteSicherung();
