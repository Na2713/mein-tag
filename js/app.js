// app.js – steuert, was auf dem Bildschirm zu sehen ist.
// Kategorien und Aufgaben kommen aus speicher.js (Objekt "daten"),
// welche Termine an einem Tag dran sind, berechnet termine.js.

// ---------- Zustand ----------

// Welcher Tag gerade angezeigt wird
let aktuellerTag = heute();

// ---------- Kleine Helfer ----------

function findeKategorie(id) {
  return daten.kategorien.find(function (k) { return k.id === id; })
    || { id: '', name: 'Ohne Kategorie', farbe: '#e2dcd6' };
}

// ---------- Anzeige ----------

function zeigeTag() {
  // Kopfzeile aktualisieren
  document.getElementById('datum-titel').textContent = datumLang(aktuellerTag);
  document.getElementById('datum-relativ').textContent = datumRelativ(aktuellerTag);
  document.getElementById('btn-heute').hidden = (aktuellerTag === heute());

  const liste = document.getElementById('liste');
  liste.innerHTML = '';

  const termine = termineFuerTag(aktuellerTag);
  // Überfälliges gibt es nur in der Ansicht von heute
  const ueberfaellig = aktuellerTag === heute() ? ueberfaelligeTermine(heute()) : [];

  if (termine.length === 0 && ueberfaellig.length === 0) {
    zeigeLeer(liste);
    return;
  }

  // Ganz oben: Überfällig
  if (ueberfaellig.length > 0) {
    const gruppe = el('section', 'gruppe ueberfaellig');
    const titel = el('h2', 'gruppe-titel');
    titel.append(el('span', 'punkt'), 'Überfällig');
    gruppe.append(titel);
    ueberfaellig.forEach(function (termin) {
      gruppe.append(baueAufgabe(termin, true));
    });
    liste.append(gruppe);
  }

  // Danach: nach Kategorie gruppiert, in der Reihenfolge der Kategorienliste
  const reihenfolge = daten.kategorien.map(function (k) { return k.id; }).concat(['']);
  reihenfolge.forEach(function (katId) {
    const inGruppe = termine.filter(function (t) {
      return findeKategorie(t.aufgabe.kategorieId).id === katId;
    });
    if (inGruppe.length === 0) return;

    const kat = findeKategorie(katId);
    const gruppe = el('section', 'gruppe');
    gruppe.style.setProperty('--farbe', kat.farbe);

    const titel = el('h2', 'gruppe-titel');
    titel.append(el('span', 'punkt'), kat.name);
    gruppe.append(titel);

    inGruppe.forEach(function (termin) {
      gruppe.append(baueAufgabe(termin, false));
    });
    liste.append(gruppe);
  });
}

function baueAufgabe(termin, istUeberfaellig) {
  const aufgabe = termin.aufgabe;
  const karte = el('div', 'aufgabe');
  karte.style.setProperty('--farbe', findeKategorie(aufgabe.kategorieId).farbe);

  const haken = el('button', 'haken', '✓');
  haken.setAttribute('aria-label', 'Erledigt: ' + aufgabe.titel);
  haken.addEventListener('click', function () { abhaken(termin, karte); });

  // Tippen auf den Text öffnet die Aufgabe zum Bearbeiten
  const text = el('button', 'aufgabe-text');
  text.type = 'button';
  text.addEventListener('click', function () { oeffneFormular(termin); });

  if (istUeberfaellig) {
    text.append(el('p', 'aufgabe-marke', 'Überfällig · ' + datumKurz(termin.faellig)));
  }
  text.append(el('p', 'aufgabe-titel', aufgabe.titel));
  if (aufgabe.notiz) text.append(el('p', 'aufgabe-notiz', aufgabe.notiz));
  if (termin.faellig !== termin.datum) {
    text.append(el('p', 'aufgabe-regel', '↷ verschoben vom ' + datumKurz(termin.datum)));
  } else if (aufgabe.regel.typ !== 'einmalig') {
    text.append(el('p', 'aufgabe-regel', '↻ ' + regelBeschreibung(aufgabe.regel)));
  }

  // Knopf rechts: Verschieben
  const mehr = el('button', 'mehr', '↷');
  mehr.type = 'button';
  mehr.setAttribute('aria-label', 'Verschieben: ' + aufgabe.titel);
  mehr.addEventListener('click', function () { oeffneVerschieben(termin); });

  karte.append(haken, text, mehr);
  return karte;
}

function zeigeLeer(liste) {
  const leer = el('div', 'leer');
  leer.append(
    el('div', 'leer-bild', '🌸'),
    el('p', 'leer-titel', 'Alles erledigt'),
    el('p', 'leer-text', 'Genieß deinen Tag.')
  );
  liste.append(leer);
}

// ---------- Abhaken ----------

function abhaken(termin, karte) {
  // Sofort speichern, damit nichts verloren geht, falls die App gleich geschlossen wird
  const schluessel = terminSchluessel(termin.aufgabe.id, termin.datum);
  daten.erledigt[schluessel] = true;
  speichere();

  karte.classList.add('erledigt');           // 1. Kreis füllt sich
  setTimeout(function () {
    karte.classList.add('weg');              // 2. Karte gleitet weg
  }, 350);
  setTimeout(zeigeTag, 900);                 // 3. Liste neu zeichnen

  zeigeHinweis('„' + termin.aufgabe.titel + '“ erledigt', 'Rückgängig', function () {
    delete daten.erledigt[schluessel];
    speichere();
    aktualisiere();
  });
}

// ---------- Verschieben ----------

const verschiebenHuelle = document.getElementById('blatt-verschieben');
let verschiebenTermin = null;

// "Auf morgen" heißt: einen Tag nach heute – oder nach dem angezeigten Tag, falls der später ist
function morgenFuer(termin) {
  const basis = termin.faellig > heute() ? termin.faellig : heute();
  return plusTage(basis, 1);
}

function oeffneVerschieben(termin) {
  verschiebenTermin = termin;
  const aufgabe = termin.aufgabe;
  const morgen = morgenFuer(termin);

  document.getElementById('v-titel').textContent = aufgabe.titel;
  document.getElementById('v-info').textContent =
    (aufgabe.regel.typ !== 'einmalig' ? '↻ ' + regelBeschreibung(aufgabe.regel) + ' · ' : '') +
    'Termin am ' + datumKurz(termin.faellig);
  document.getElementById('v-morgen').textContent =
    (morgen === plusTage(heute(), 1) ? 'Auf morgen' : 'Einen Tag später') + ' (' + datumKurz(morgen) + ')';

  const datumFeld = document.getElementById('v-datum');
  datumFeld.min = heute();
  datumFeld.value = plusTage(morgen, 1);

  oeffneBlatt(verschiebenHuelle);
}

function verschiebe(termin, ziel) {
  const schluessel = terminSchluessel(termin.aufgabe.id, termin.datum);
  const vorher = daten.verschoben[schluessel];   // für "Rückgängig" merken

  if (ziel === termin.datum) delete daten.verschoben[schluessel];  // zurück aufs Original
  else daten.verschoben[schluessel] = ziel;
  speichere();
  schliesseBlatt(verschiebenHuelle);
  aktualisiere();

  zeigeHinweis('Verschoben auf ' + datumKurz(ziel), 'Rückgängig', function () {
    if (vorher) daten.verschoben[schluessel] = vorher;
    else delete daten.verschoben[schluessel];
    speichere();
    aktualisiere();
  });
}

document.getElementById('v-morgen').addEventListener('click', function () {
  verschiebe(verschiebenTermin, morgenFuer(verschiebenTermin));
});
document.getElementById('v-datum-ok').addEventListener('click', function () {
  const ziel = document.getElementById('v-datum').value;
  if (ziel) verschiebe(verschiebenTermin, ziel);
});
document.getElementById('v-bearbeiten').addEventListener('click', function () {
  schliesseBlatt(verschiebenHuelle);
  oeffneFormular(verschiebenTermin);
});
richteBlattEin(verschiebenHuelle);

// ---------- Tag wechseln ----------

function wechsleTag(anzahlTage) {
  aktuellerTag = plusTage(aktuellerTag, anzahlTage);
  zeigeTag();
}

// Wer "Bewegung reduzieren" eingestellt hat, bekommt keine Gleit-Animation
const wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)');

// Wie wechsleTag, aber die Liste gleitet sanft zur Seite hinaus und von der anderen Seite herein
function blaettere(anzahlTage) {
  const liste = document.getElementById('liste');
  if (wenigBewegung.matches || !liste.animate) {
    wechsleTag(anzahlTage);
    return;
  }
  const weite = anzahlTage > 0 ? -60 : 60;   // nächster Tag: nach links hinaus
  const aktuell = liste.style.transform || 'none';
  liste.style.transform = '';
  liste.animate(
    [{ transform: aktuell, opacity: 1 }, { transform: 'translateX(' + weite + 'px)', opacity: 0 }],
    { duration: 120, easing: 'ease-in' }
  ).onfinish = function () {
    wechsleTag(anzahlTage);
    liste.animate(
      [{ transform: 'translateX(' + (-weite) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 200, easing: 'ease-out' }
    );
  };
}

// ---------- Wischen ----------
// Nach links wischen = nächster Tag, nach rechts wischen = vorheriger Tag.

const tagAnsicht = document.getElementById('ansicht-tag');
let wischStart = null;
let gewischt = false;

tagAnsicht.addEventListener('pointerdown', function (e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  wischStart = { x: e.clientX, y: e.clientY };
  gewischt = false;
});

tagAnsicht.addEventListener('pointermove', function (e) {
  if (!wischStart) return;
  const dx = e.clientX - wischStart.x;
  const dy = e.clientY - wischStart.y;
  // Liste folgt dem Finger ein Stück, solange eher waagerecht gewischt wird
  if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
    document.getElementById('liste').style.transform = 'translateX(' + dx * 0.4 + 'px)';
  }
});

function wischEnde(e) {
  if (!wischStart) return;
  const dx = e.clientX - wischStart.x;
  const dy = e.clientY - wischStart.y;
  wischStart = null;
  const liste = document.getElementById('liste');

  if (e.type === 'pointerup' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    gewischt = true;
    blaettere(dx < 0 ? 1 : -1);
  } else if (liste.style.transform) {
    // nicht weit genug: sanft zurückfedern
    liste.style.transition = 'transform 0.2s';
    liste.style.transform = '';
    setTimeout(function () { liste.style.transition = ''; }, 200);
  }
}
tagAnsicht.addEventListener('pointerup', wischEnde);
tagAnsicht.addEventListener('pointercancel', wischEnde);

// Nach einem Wisch soll kein Knopf "angetippt" werden, über dem der Finger losgelassen wurde
tagAnsicht.addEventListener('click', function (e) {
  if (gewischt) {
    e.stopPropagation();
    e.preventDefault();
    gewischt = false;
  }
}, true);

// Am Computer: Pfeiltasten links/rechts wechseln den Tag
document.addEventListener('keydown', function (e) {
  if (aktiveAnsicht !== 'tag' || document.querySelector('.huelle.offen')) return;
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowLeft') blaettere(-1);
  if (e.key === 'ArrowRight') blaettere(1);
});

// Bleibt die App über Mitternacht offen, springt sie beim nächsten Öffnen auf den neuen Tag
let letztesHeute = heute();
document.addEventListener('visibilitychange', function () {
  if (document.hidden || heute() === letztesHeute) return;
  if (aktuellerTag === letztesHeute) aktuellerTag = heute();
  letztesHeute = heute();
  aktualisiere();
});

// ---------- Start ----------

ladeDaten();

document.getElementById('btn-zurueck').addEventListener('click', function () { blaettere(-1); });
document.getElementById('btn-vor').addEventListener('click', function () { blaettere(1); });
document.getElementById('btn-heute').addEventListener('click', function () {
  blaettere(tageZwischen(aktuellerTag, heute()));
});
document.getElementById('btn-neu').addEventListener('click', function () { oeffneFormular(); });

zeigeTag();
