// sw.js – der "Service Worker".
//
// Das ist ein kleines Programm, das der Browser neben der App laufen lässt.
// Es speichert alle Dateien der App auf dem Handy. So startet die App auch
// ohne Internet (z. B. im Flugmodus).
//
// Strategie: Erst das Internet fragen (dann bekommst du immer die neueste
// Version). Klappt das nicht oder dauert es länger als 3 Sekunden, nehmen
// wir die gespeicherte Version.
//
// Deine Aufgaben selbst liegen NICHT hier, sondern im localStorage (speicher.js).

// Wenn du später Dateien hinzufügst oder umbenennst: Liste ergänzen und
// die Versionsnummer erhöhen, damit alte gespeicherte Dateien aufgeräumt werden.
const VERSION = 'mein-tag-v1';

const DATEIEN = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'js/datum.js',
  'js/regeln.js',
  'js/termine.js',
  'js/speicher.js',
  'js/dialog.js',
  'js/formular.js',
  'js/kategorien.js',
  'js/app.js',
  'js/ansichten.js',
  'js/sicherung.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

// 1. Installieren: alle Dateien einmal herunterladen und speichern
self.addEventListener('install', function (ereignis) {
  ereignis.waitUntil(
    caches.open(VERSION)
      .then(function (speicher) { return speicher.addAll(DATEIEN); })
      .then(function () { return self.skipWaiting(); })   // sofort aktiv werden
  );
});

// 2. Aktivieren: Speicher alter Versionen löschen
self.addEventListener('activate', function (ereignis) {
  ereignis.waitUntil(
    caches.keys()
      .then(function (namen) {
        return Promise.all(namen
          .filter(function (name) { return name !== VERSION; })
          .map(function (name) { return caches.delete(name); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// 3. Jede Anfrage der App: erst Internet, sonst Speicher
self.addEventListener('fetch', function (ereignis) {
  const anfrage = ereignis.request;
  // Nur eigene Dateien behandeln, alles andere normal laden lassen
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  ereignis.respondWith(ausNetzOderSpeicher(anfrage));
});

function ausNetzOderSpeicher(anfrage) {
  return caches.open(VERSION).then(function (speicher) {
    // Gespeicherte Version (für eine aufgerufene Seite notfalls die Startseite)
    const ausSpeicher = speicher.match(anfrage, { ignoreSearch: true }).then(function (antwort) {
      if (antwort || anfrage.mode !== 'navigate') return antwort;
      return speicher.match('./');
    });

    // Frische Version aus dem Internet – und gleich für später speichern
    const ausNetz = fetch(anfrage).then(function (antwort) {
      if (antwort.ok) speicher.put(anfrage, antwort.clone());
      return antwort;
    });

    // Nach 3 Sekunden ohne Antwort aus dem Internet: gespeicherte Version nehmen
    const zuLangsam = new Promise(function (fertig) { setTimeout(fertig, 3000); })
      .then(function () { return ausSpeicher; });

    return Promise.race([ausNetz, zuLangsam])
      .then(function (antwort) { return antwort || ausNetz; })
      .catch(function () {
        // Kein Internet: gespeicherte Version, oder wenn es die nicht gibt, ein Fehler
        return ausSpeicher.then(function (antwort) { return antwort || Response.error(); });
      });
  });
}
