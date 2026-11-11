// dialog.js – "Blätter", die von unten hereingleiten, und kleine Rückfragen.
//
// Ein Blatt besteht aus einer "Hülle" (der abgedunkelte Hintergrund)
// und dem eigentlichen Blatt darin. Siehe index.html.

// Erzeugt ein HTML-Element. Wir setzen Text immer über "textContent",
// damit eingegebene Zeichen wie < oder > nie als HTML missverstanden werden.
function el(tag, klasse, text) {
  const element = document.createElement(tag);
  if (klasse) element.className = klasse;
  if (text !== undefined) element.textContent = text;
  return element;
}

function oeffneBlatt(huelle) {
  huelle.hidden = false;
  void huelle.offsetWidth;          // Trick: Browser zeichnet erst, dann startet die Animation
  huelle.classList.add('offen');
}

function schliesseBlatt(huelle) {
  huelle.classList.remove('offen');
  setTimeout(function () { huelle.hidden = true; }, 250);
}

// Jede Hülle schließt sich beim Tippen auf den dunklen Hintergrund
// oder auf einen Knopf mit dem Merkmal "data-schliessen".
function richteBlattEin(huelle) {
  huelle.addEventListener('click', function (ereignis) {
    if (ereignis.target === huelle || ereignis.target.closest('[data-schliessen]')) {
      schliesseBlatt(huelle);
    }
  });
}

// Kurze Meldung unten am Bildschirm, optional mit einem Knopf (z. B. "Rückgängig").
// Verschwindet nach ein paar Sekunden von selbst.
let hinweisTimer = null;
function zeigeHinweis(text, knopfText, knopfAktion) {
  let hinweis = document.getElementById('hinweis');
  if (!hinweis) {
    hinweis = el('div', 'toast');
    hinweis.id = 'hinweis';
    hinweis.setAttribute('role', 'status');
    document.body.append(hinweis);
  }
  hinweis.innerHTML = '';
  hinweis.append(el('span', '', text));
  if (knopfText) {
    const knopf = el('button', 'toast-knopf', knopfText);
    knopf.type = 'button';
    knopf.addEventListener('click', function () {
      versteckeHinweis();
      knopfAktion();
    });
    hinweis.append(knopf);
  }
  hinweis.classList.add('sichtbar');
  clearTimeout(hinweisTimer);
  hinweisTimer = setTimeout(versteckeHinweis, 5000);
}

function versteckeHinweis() {
  const hinweis = document.getElementById('hinweis');
  if (hinweis) hinweis.classList.remove('sichtbar');
}

// Stellt eine Frage mit mehreren Antwort-Knöpfen.
// Beispiel:
//   frage('Löschen?', 'Das kann man nicht rückgängig machen.', [
//     { text: 'Löschen', wert: 'ja', art: 'gefahr' },
//     { text: 'Abbrechen', wert: null }
//   ]).then(function (antwort) { … });
// "antwort" ist der "wert" des angetippten Knopfs (oder null beim Wegtippen).
function frage(titel, text, optionen) {
  return new Promise(function (fertig) {
    const huelle = el('div', 'huelle mitte');
    const blatt = el('div', 'blatt frage');
    blatt.setAttribute('role', 'dialog');
    blatt.setAttribute('aria-modal', 'true');
    blatt.append(el('h2', 'frage-titel', titel));
    if (text) blatt.append(el('p', 'frage-text', text));

    const knoepfe = el('div', 'frage-knoepfe');
    optionen.forEach(function (option) {
      const knopf = el('button', 'knopf ' + (option.art || ''), option.text);
      knopf.type = 'button';
      knopf.addEventListener('click', function () { beende(option.wert); });
      knoepfe.append(knopf);
    });
    blatt.append(knoepfe);
    huelle.append(blatt);

    huelle.addEventListener('click', function (ereignis) {
      if (ereignis.target === huelle) beende(null);
    });

    function beende(wert) {
      schliesseBlatt(huelle);
      setTimeout(function () { huelle.remove(); }, 300);
      fertig(wert);
    }

    document.body.append(huelle);
    oeffneBlatt(huelle);
  });
}
