# NORA — PLAYBOOK v2 · Drumul până la testul cu utilizatori
### Actualizat: 8 iulie 2026 · înlocuiește complet playbook-ul vechi

### Cum folosești acest fișier
Lucrezi de sus în jos. Un pas = o sesiune Claude Code. Copiezi instrucțiunea, aștepți planul, confirmi, verifici vizual pe localhost, faci commit. NU sari peste commit-uri. NU combini doi pași. Orice idee nouă apărută pe drum → în documentul de decizii cu eticheta "după test".

### Stare curentă (ce e DEJA făcut — nu repeta)
✔ Rebrand quiet luxury neutru în CLAUDE.md (paletă, pădure nordică, copy fără gen)
✔ Filtru cuisine european/american în Spoonacular — validat inclusiv pe planuri complete
✔ Unificare cromatică totală: butoane, accente, etichete, headere verzi pe toate taburile
✔ Chei API reînviate (Anthropic, Spoonacular) · Audituri complete (variabile, RLS, cod orfan, chei) · −2464 linii cod mort
✔ Decizie: datele utilizatorilor se mută din localStorage în Supabase (capitolul A)

---

# CAPITOLUL A — CONTURI ("profi de la bun început")

## A1 — Autentificarea

```
/adauga-functie Autentificare Supabase pentru Nora. Cerințe: (1) Înregistrare și login cu email + parolă, folosind Supabase Auth — ecrane în stilul CLAUDE.md, minimale și elegante, cu watermark botanic subtil (vezi regulile de design). (2) La înregistrare: checkbox de consimțământ NEbifat implicit, cu text scurt placeholder despre prelucrarea datelor. (3) Utilizatorul nelogat vede doar login/înregistrare. (4) Logout în tabul Me. (5) NU migra încă datele din localStorage — doar autentificarea. Prezintă planul complet înainte de cod, inclusiv ce se întâmplă cu fluxul actual de onboarding (va rula după primul login).
```

Verifici: creezi un cont de test, login, logout, re-login. Commit: "Autentificare Supabase".

## A2 — Tabelele per-user + RLS de la naștere

```
/adauga-functie Tabele Supabase per-utilizator, cu Row Level Security activat DE LA CREARE pe fiecare: (1) profiles — datele din onboarding (obiectiv, ținte, preferințe, date biologice opt-in); (2) meals — mesele logate (aliment, macro, timestamp, sursă: foto/barcode/căutare); (3) challenge_completions — challenge-uri Ritual completate per zi; (4) user_settings — unități, notificări, preferințe. Fiecare tabel: coloană user_id legată de auth, politici RLS "utilizatorul își vede/modifică DOAR rândurile lui". Scrie migrarea SQL, arată-mi-o, și spune-mi exact ce rulez în Supabase SQL Editor. NU conecta încă aplicația la ele.
```

Verifici: tabelele apar în Supabase → Table Editor, fiecare cu scutul RLS activ. Commit.

## A3 — Migrarea: aplicația trece pe Supabase

```
/adauga-functie Migrarea datelor de la localStorage la Supabase, tab cu tab, în această ordine: (1) onboarding → profiles; (2) logarea meselor → meals; (3) challenge-uri Ritual → challenge_completions; (4) setări Me → user_settings. Regula: citire și scriere DOAR din/în Supabase pentru utilizatorul logat; localStorage rămâne doar ca fallback de citire o singură dată (dacă există date vechi locale, oferă importul lor în cont la primul login, apoi ignoră-l). Prezintă planul pe fiecare sub-pas — confirmarea mea la fiecare, nu tot deodată.

IMPORTANT, tot la sub-pasul (1): cu ocazia migrării onboarding-ului, RESTRUCTUREAZĂ-L — elimină toate întrebările biologice (ciclu, premenopauză etc.); în onboarding rămân doar nume, obiectiv, preferințe alimentare; personalizarea biologică se mută ca secțiune opt-in în Me → Preferințe, dezactivată implicit, cu contexte alese de utilizator (ciclu / sarcină / perimenopauză / nu e cazul).
```

Sesiune mare — poate deveni 2. Verifici: loghezi o masă pe laptop, o vezi din alt browser cu același cont. Commit după fiecare sub-pas.

## A4 — Pachetul GDPR

```
/adauga-functie Pachet GDPR minim: (1) Pagină "Confidențialitate" în stilul aplicației: ce date colectăm și de ce (pe înțelesul omului), unde sunt stocate (Supabase, UE — serverul e în Irlanda), cine are acces, cum se șterg. Scrie tu draftul, îl revizuiesc eu. (2) Textul final de consimțământ la înregistrare, cu link spre pagină. (3) În Me: "Șterge contul" — cu confirmare dublă, care șterge REAL contul și toate rândurile utilizatorului din toate tabelele. (4) Mențiune specială pentru datele biologice (categorie specială GDPR): activare doar opt-in, formulare explicită. Nu publica nimic fără revizuirea mea pe texte.
```

Commit: "Pachet GDPR: confidentialitate, consimtamant, stergere cont".

## A5 — Heartbeat + verificare finală capitol

```
Două lucruri de închidere: (1) Implementează heartbeat-ul Supabase discutat anterior (un ping programat care ține proiectul free-tier treaz — cron Vercel sau echivalent), ca baza să nu adoarmă sub utilizatori. (2) Rulează un mini-audit RLS final pe tabelele noi, acum populate: confirmă cu un test real că un utilizator nu poate citi datele altuia. Raport, apoi implementare.
```

Commit + push. Capitolul A închis: Nora are conturi adevărate.

---

# CAPITOLUL B — SUFLETUL (vocea + bucla zilnică)

## B1 — Ghidul vocii Norei (fără cod — seara ta + o sesiune scurtă)

Întâi scrii TU, pe hârtie sau în chat cu mine: 5 fraze pe care Nora le-ar spune, 5 pe care nu le-ar spune niciodată. Apoi:

```
Creează fișierul lib/nora-voice.md — ghidul oficial al vocii Norei, pe baza regulilor pe care ți le dau: [lipești aici frazele și principiile tale]. Structura: cine e Nora (2 fraze), tonul (sobru, cald, fără gen, fără diminutive, fără exclamații), 10 exemple DA / NU pe situații (comentariu după masă bună, după masă dezechilibrată, salut de dimineață, încurajare la challenge, răspuns la întrebare sensibilă), și regula de aur: o singură idee per mesaj. Acest fișier va fi sursa pentru TOATE prompturile API din aplicație.
```

Commit: "Ghidul vocii Norei". Acesta e activul companiei — tratează-l ca atare.

## B2 — Comentariul Norei după masă

```
/adauga-functie Comentariu Nora după fiecare masă logată. (1) După logare (foto/barcode/căutare), apel Anthropic cu: masa logată, celelalte mese de azi, obiectivul din profiles, faza biologică DACĂ e activată opt-in. (2) System promptul citează lib/nora-voice.md — o singură frază, în română, conform ghidului. (3) Apare sub masă, italic, cu eticheta "Nora". (4) La eșec API: nu apare nimic, fără eroare vizibilă. (5) Ocazional (nu la fiecare masă) poate sugera o rutină Move de după masă, când tabul va exista. Design conform CLAUDE.md.
```

Testezi pe 5+ mese diferite. Dacă tonul șchioapătă → corectezi DOAR nora-voice.md și promptul. Commit.

## B3 — My Day ca brief zilnic

```
/adauga-functie Transformă My Day în brief zilnic cu MAXIM 4 elemente, ordinea din secțiunea "Ordinea taburilor" de mai jos: (1) Salut cu prenumele din profil + frază de moment al zilei, vocea din nora-voice.md. (2) Un insight din datele de IERI (meals, challenge_completions) — apel Anthropic, aceeași voce; fără date ieri → frază de început elegantă, nu reproș. (3) Challenge-ul zilei (card mic, link spre Ritual). (4) O acțiune recomandată azi. ELIMINĂ orice element care duplică date din Eat/Boost. Playfair doar pe salut, mult spațiu, maxim un accent auriu.
```

Commit, apoi /verifica-design My Day.

---

# CAPITOLUL C — CURĂȚENIA TABURILOR

## C1 — Ritual (o seară a ta + o sesiune)

Exportă challenge-urile ("Exportă toate challenge-urile într-un text numerotat, nu modifica nimic"), treci prin ele cu 2 întrebări: fezabil fără echipament? sună a Nora? Apoi:

```
Șterge challenge-urile cu numerele: [lista ta]. Celor rămase fără explicație adaugă-le câmpul "de ce" — o frază științifică simplă în vocea din lib/nora-voice.md. Verifică și chip-urile "For Her/For Him" din Ritual: conținutul specific biologic se afișează DOAR utilizatorilor cu personalizarea biologică activată în profil, fără etichete de gen vizibile. Arată-mi frazele și planul înainte.

Tot acum: elimină toate etichetele permanente de fază ("luteal phase" etc.) de pe Eat, My Day și planuri — informația se folosește în adaptări, dar nu se afișează ca ecuson; adaugă o singură invitație discretă la prima atingere a zonei de ciclu ("Dacă vrei, Nora poate ține cont de ritmul tău — se activează din Me"), apoi tăcere completă pentru cine nu activează.
```


## C2 — Boost transparent

```
/adauga-functie Boost: (1) Fiecare recomandare primește "De ce vezi asta:" legat de mesele din meals de azi; ce nu poate fi explicat nu se afișează. (2) Arată-mi lista actuală de suplimente — aleg eu ce rămâne (țintă: 8-12 comune, documentate). (3) Disclaimer discret în italic la subsol: "Sugestiile Nora sunt informative și nu înlocuiesc sfatul medicului sau al farmacistului." Design conform CLAUDE.md.
```

## C3 — Ask Nora primește context

```
/adauga-functie Contextualizarea Ask Nora: (1) Fiecare mesaj include automat în prompt: mesele de azi (meals), challenge-ul curent, obiectivul, ora locală, faza biologică dacă e opt-in. (2) System prompt: Nora CUNOAȘTE aceste date și le folosește natural, nu le recită — vocea din nora-voice.md. (3) 3 întrebări sugerate ca pastile deasupra inputului, generate din context. (4) Conversația persistă în sesiune. Arată-mi promptul complet înainte de cod.
```

## C4 — Me final + roadmap public

```
În Me păstrează doar: profil, obiectiv, preferințe (unități + activarea personalizării biologice), notificări, Confidențialitate, Șterge contul, Logout. Adaugă o secțiune discretă "În curând": Apple Watch, Oura Ring, aplicație mobilă — fiecare cu buton "Anunță-mă" care doar salvează interesul în user_settings. Orice altceva din Me se elimină din interfață.
```

(Butoanele "Anunță-mă" = validarea gratuită a cererii de wearables.)

---

# CAPITOLUL D — MOVE (bibliotecă cu trei energii)

FĂRĂ video, FĂRĂ tracking, FĂRĂ wearables în v1. Trei secțiuni: **Energie** (fitness blând cu greutatea corpului, 8-15 min) · **Calm** (mobilitate, stretching, plimbări, 5-12 min) · **Respirație** (respirație ghidată + meditație scrisă, 3-10 min).

## D1 — Conținutul (îl revizuiești TU înainte de orice cod)

```
Generează 15 rutine Move în română, vocea din lib/nora-voice.md: 5 Energie, 5 Calm, 5 Respirație. Fiecare: titlu scurt, durată, momentul recomandat al zilei, 4-6 pași simpli fără echipament, o frază "de ce" cu beneficiul științific. Arată-mi lista completă ca text — o revizuiesc înainte să construim.
```

## D2 — Tabul

```
/adauga-functie Tab "Move" între Ritual și Boost, cu headerul verde standard. Conținut: cele 15 rutine aprobate, în Supabase (tabel movements: categorie energie/calm/respiratie, moment, pași JSON, "de ce"; tabel movement_completions per user, cu RLS). Interfață conform "Ordinea taburilor": (1) sus, recomandarea momentului — UN card evidențiat cu rutina potrivită orei; (2) trei secțiuni: Energie / Calm / Respirație; (3) card: titlu Playfair, durată, "de ce" italic; deschis: pași numerotați aerisiți; (4) un singur buton "Am făcut-o". Fără statistici, fără istoric vizibil. Prezintă planul + structura tabelelor înainte.
```

## D3 — Conexiunile (Move devine "Nora")

```
Două conexiuni, nimic altceva: (1) My Day: dacă azi nu există nimic în movement_completions, acțiunea recomandată poate fi o rutină potrivită orei. (2) Comentariul Norei după o masă bogată poate menționa OCAZIONAL o rutină Calm de după masă. Planul înainte.
```

## D4 — Surse de conținut pentru extindere viitoare (exerciții, soundscapes, meditație)
Notat 21.07, backlog — NU implementa acum. Pentru extinderea ulterioară a conținutului Move dincolo de cele 15 rutini text din D1:
- **Exerciții/mișcare**: folosește free-exercise-db (GitHub, gratuit, open-source) ca sursă de conținut (nume, instrucțiuni, imagini), în loc de scriere manuală a fiecărui exercițiu.
- **Soundscapes/white noise**: folosește Pixabay Audio sau freesound.org — verifică licența fiecărui fișier individual înainte de folosire.
- **Meditație ghidată**: scripturile trebuie scrise original în vocea Norei (`lib/nora-voice.md`), NU preluate din alte surse (risc de drept de autor). De decis ulterior cum se generează vocea finală (text-to-speech, voce înregistrată etc.).

---

# CAPITOLUL E — RAFINAMENTUL VIZUAL FINAL

## E1 — Watermark-urile botanice (imaginile semi-șterse)

```
Creează un set de 4-5 ilustrații botanice SVG line-art în stil nordic — ferigă, ramură de conifer, frunză de stejar, ramură simplă — desenate în cod (SVG inline, stroke subțire 1.5, o singură culoare: forest green). Plasează-le ca watermark: opacitate 4-6%, poziționate în colțul headerelor verzi ale taburilor și în empty states (ex. "No supplements added yet" din Boost, ecranul gol de chat din Ask Nora, login). Fiecare tab primește alt motiv, subtil, niciodată peste text. Arată-mi întâi SVG-urile ca preview, aleg eu care unde.
```

(SVG desenat în cod = zero imagini externe, zero probleme de licență, perfect în paletă.)

## E2 — Trecerea semantică în paleta Nora

```
Culorile semantice păstrate la unificare (dificultate Beginner/Intermediate/Advanced, badge-uri sursă, faze ciclu) — adu-le la versiuni stinse, în familia paletei: verde-salvie / ocru prăfuit / cărămiziu stins în loc de verde viu / galben / roșu. Sensul rămâne, volumul scade. Nutri-Score NU se atinge (standard extern). Lista înlocuirilor înainte.
```

## E3 — Auditul final de design

```
/verifica-design pe fiecare tab, pe rând
```
Corectezi ce iese, commit per tab.

---

# CAPITOLUL F — LANSAREA TESTULUI

## F1 — PWA

```
/adauga-functie PWA instalabilă: manifest.json ("Nora", theme forest green #1B3A2D, fundal ivory, standalone), iconițe generate (litera N în Playfair pe forest green dacă nu există logo), service worker minimal. La final: pașii exacți de instalare pe Android și iPhone.
```

## F2 — Controlul tehnic

```
/inainte-de-publicare
```
Repari blocantele. Apoi commit + push final.

## F3 — Săptămâna ta de auto-test
7 zile, pe telefon (PWA instalată), ca UTILIZATOR nu ca dezvoltator. Jurnal: 2 rânduri pe seară — ce m-a frustrat azi · am deschis-o din plăcere sau obligație?

## F4 — Cei 5 testeri
Mesaj către 2-3 colege + postare în 2 grupuri (FB wellness RO / Reddit): "Am construit singură o aplicație de wellness, caut 5 persoane pentru 7 zile de folosit + feedback sincer." La final, întrebări de comportament: ai deschis-o azi fără să-ți amintesc? ce ai căutat și n-ai găsit? ce ai ignorat?

---

# CAPITOLUL G — PERSONALIZARE AVANSATĂ (post-lansare)

## G1 — Fasting ca stare globală
Notat 13.07, de implementat după validarea cu cei 5 testeri: toată aplicația ține cont de fereastra de fasting/eating, la fel cum ține cont de faza ciclului menstrual. Abordare: un helper central (ex. `getFastingState()`) folosit de meal suggestions, Ask Nora, Boost/Ritual și circadian timeline, fără logică duplicată în tab-uri. Fasting-ul propriu-zis (fereastră recurentă + post extins custom) e deja construit în Me + My Day (13.07) — acest item e despre EXTINDEREA lui ca sursă de context pentru restul aplicației, nu despre feature-ul de bază.

## G2 — Library: conținut extins, fără numărătoare
Notat 17.07, de implementat după validarea cu cei 5 testeri: extinderea conținutului per tab din Library (books/podcasts/concepts) și eliminarea numărătorii de articole ("35 articles") de pe ecran — fără numărătoare, colecția pare mai bogată.

## G3 — Barcode: scanare live și pe iPhone/Safari
Notat 17.07, **de făcut ÎNAINTE de lansarea testului cu cei 5 utilizatori** (nu doar post-lansare) — mulți testeri vor fi pe iPhone. Problemă actuală: scanarea live prin cameră (My Day → barcode) folosește API-ul nativ `BarcodeDetector`, care NU e suportat pe Safari/iOS — pe iPhone camera live nu detectează automat niciun cod, userul poate doar introduce codul manual. Soluție: înlocuiește sau completează `BarcodeDetector` cu o librărie JS cross-browser (ex. ZXing sau QuaggaJS) care rulează peste imaginea video și funcționează și pe Safari. Necesită `npm install` — de discutat înainte care librărie, din motive de mărime bundle și licență.
Rezolvat 21.07 cu `@zxing/browser`. Rezolvat complet 26.07: focalizare continuă (Chrome/Android), fallback USDA corectat (căuta în categorii greșite pentru coduri de bare), conversie kJ→kcal pentru produse cu date incomplete în Open Food Facts. Testat pe telefon real — funcționează.

## G4 — Barcode fallback pentru produse negăsite (bază proprie Nora)
Notat 21.07, backlog — NU implementa acum. Când Open Food Facts/USDA nu găsesc un cod de bare, oferă userului un formular rapid de adăugare manuală (nume, kcal, proteine, carbo, grăsime, per 100g), salvat în Supabase legat de codul de bare. Data viitoare, orice user care scanează același cod găsește produsul din baza proprie Nora, înainte de a mai interoga OFF. Construiește organic acoperire mai bună pentru produse est-europene, alimentată de useri.

## G5 — Optimizare cost Ask Nora
Notat 21.07, backlog — NU implementa acum. Evaluează trecerea la un model mai ieftin (Haiku) pentru conversații simple, activează prompt caching pe contextul trimis (profil, mese, ținte — se repetă la fiecare mesaj din aceeași sesiune), și ia în calcul limite de mesaje/zi pentru useri gratuiți dacă apare vreodată un model freemium. De evaluat când Nora are useri reali și volum de utilizare de măsurat.

## G6 — Suport multi-limbă
Notat 27.07, idee de arhitectură pentru viitor — backlog, NU implementa acum. Aplicația ar avea nevoie de două straturi separate: UI static (etichete, butoane, texte fixe din interfață) și vocea Norei generată dinamic (comentarii, insight-uri, răspunsuri Ask Nora — deja generate live prin Claude, deci ar putea primi limba dorită direct în prompt, fără traducere separată). De decis ulterior: câte limbi, ce mecanism pentru UI static (fișiere de traducere vs. altă abordare), și cum rămâne consistentă vocea Norei (`lib/nora-voice.md`) across limbi.

## G7 — Library: cărți disponibile efectiv în română
Notat 18.08, backlog — NU implementa acum. Extinde lista de cărți din Library (mai multe titluri). Când aplicația e pe română, adaugă cărți/conținut disponibil efectiv în limba română (nu doar titluri englezești netraduse) — necesită curatoriere de conținut nouă, posibil și un câmp de filtrare pe limbă (`availableInRo`). Temă pentru sesiune de conținut viitoare.

---

# ORDINEA ELEMENTELOR PE FIECARE TAB (referință permanentă)

**My Day — hub-ul zilei** (scop actualizat 13.07, decizie Pas 5: voce, orientare, misiune, context, acțiune rapidă, istorie, adâncime, seară — nu doar brief minimal): mesajul Norei (contextual pe momentul zilei) → Today's Progress → challenge-ul zilei (afișare + bifă rapidă, date din active_challenges, link spre Ritual) → eating window (bandă compactă, prima/ultima masă logată azi, fără țintă de fereastră — link discret spre Me pentru un viitor fasting opt-in) → zona de logare rapidă (input + water tracker) → Today's log → insight-uri contextuale (circadian, ciclu) → reflecția de seară (STRICT după ~18:00, retrospectivă blândă — nu un al doilea mesaj de tip afternoon). Utilitățile duplicate cu Eat (logare, water tracker, jurnal) rămân intenționat — My Day e hub-ul zilei, Eat e gestiunea detaliată.
**Eat:** rezumat discret al zilei (o linie) → butonul de logare → mesele de azi cronologic + comentariul Norei → sugestii/plan. STOP.
**Move:** recomandarea momentului (1 card) → Energie / Calm / Respirație. STOP.
**Ritual:** challenge-ul de azi (mare, cu "de ce") → timeline circadian → calendar lunar discret → Library discret. STOP.
**Boost:** recomandările de azi (max 3, cu "de ce") → catalogul pliat → disclaimer subsol. STOP.
**Ask Nora:** 3 pastile sugerate → conversația → input. STOP.
**Me:** profil → obiectiv → preferințe → notificări → În curând (roadmap) → Confidențialitate → Șterge cont → Logout. STOP.
**Journey:** ascuns până după test. NU se atinge.

---

# REGULILE DE AUR (pentru zilele obosite)
1. Un pas pe sesiune. Commit după fiecare. Push la finalul zilei.
2. Plan înainte de cod — mereu. /adauga-functie există pentru asta.
3. Comenzile cu ! — UNA pe mesaj (sau spui în cuvinte "fă commit și push").
4. localhost = ce lucrezi (portul din mesajul lui!) · vercel.app = ce ai publicat. Între ele: commit + push.
5. Ceva stricat? git status, apoi "revino la ultimul commit".
6. Idee nouă pe drum → documentul de decizii, eticheta "după test". NU se face acum.
7. Chei API: doar tu, doar în .env.local + Vercel. Niciodată în chat sau cod.
8. Terminatul bate perfectul. Testul are dată, nu condiții.
