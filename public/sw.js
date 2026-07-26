// Nora — service worker minimal, doar pentru instalabilitate (PWA).
// Deliberat FARA strategie de cache: aplicatia se schimba de mai multe ori
// pe zi in aceasta perioada, iar un cache/precache ar servi userilor JS
// vechi dupa fiecare deploy. Fara handler de "fetch" => niciun request nu
// e interceptat, deci acest fisier nu poate servi vreodata continut din
// cache in locul retelei — nu poate interfera cu PasswordGate (parola din
// _app.js), care ramane intotdeauna verificata normal, live.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
