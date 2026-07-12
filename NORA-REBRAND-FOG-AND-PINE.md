# BRIEF: Reîmprospătare vizuală Nora — „Fog & Pine"

> Prompt pentru Claude Code. Rulează pașii în ordine, cu commit după fiecare pas.
> Nu trece la pasul următor fără confirmarea Izabelei că pasul curent arată bine în browser.

---

## Decizii și proces imagini

1. Wordmark-ul e «nora» fără punct final.
2. Folderul `public/images/atmosphere/` există deja, gol, cu un `README.txt` care spune: «Izabela: pune aici 1–3 fotografii de pădure în ceață de pe Unsplash (tonuri verzi-gri, nu albăstrii). Apoi scrie-i lui Claude Code: pune pozele».
3. Când Izabela scrie „pune pozele": verifică fișierele din `atmosphere/`, redenumește-le simplu (`fog-1.jpg`, `fog-2.jpg`...), optimizează-le, integrează-le în login și header conform Pas 4 din brief, înlocuind placeholder-ul gradient, apoi commit.

---

## Context și intenție

Nora trece de la actuala estetică „quiet luxury wellness" (Playfair Display + accente aurii ornamentale) la o versiune mai matură și mai restrânsă, inspirată de: Rhode, Carolyn Bessette, quiet luxury nordic. Cuvinte-cheie: **pădure scandinavă, ceață, mister cald, eleganță care nu se străduiește, unisex, intim (nu AI rece)**.

Principiu director: **Structura = Rhode** (wordmark simplu, zero simboluri desenate, UI curat, mult spațiu). **Sufletul = pădurea** (verde profund asumat, fotografii de ceață în doze mici, serif calm).

Ce dispare: avatarul cu frunza aurie, orice ornament auriu decorativ (borduri, flourish-uri), orice element care „desenează" în plus.

---

## Design tokens (noua paletă)

Actualizează variabilele globale (Tailwind config / CSS variables — unde sunt definite acum):

| Token | Valoare | Rol |
|---|---|---|
| `--nora-pine` | `#1F2E26` | Verde brad-în-umbră. Culoarea de brand. Headere, cardurile mesajelor Norei, butoane primare, wordmark. |
| `--nora-forest` | `#2A3B31` | Verde pădure, secundar. Hover states, variație tonală. |
| `--nora-fog` | `#A8B2A9` | Gri-verde de ceață. Text secundar pe fundal închis, borduri fine, stări inactive. |
| `--nora-ivory` | `#F4F2ED` | Ivory lăptos. Fundalul principal al aplicației. |
| `--nora-ivory-2` | `#EDEAE2` | Ivory umbrit. Carduri, suprafețe secundare. |
| `--nora-gold` | `#B99A5B` | Auriu. **Accent rar: maximum un element pe ecran** (o linie fină, un punct, un detaliu activ). Niciodată borduri de card, niciodată suprafețe. |
| `--nora-ink` | `#2C2A24` | Text principal pe fundal deschis. Nu negru pur. |
| `--nora-ink-soft` | `#5F5C51` | Text secundar pe fundal deschis. |

Regulă hard: raportul vizual pe orice ecran ≈ 70% ivory, 25% verde, 5% auriu sau mai puțin.

## Tipografie

- **Titluri + wordmark:** înlocuiește Playfair Display cu **Cormorant Garamond** (Google Fonts). Weight 500–600, niciodată 700+. Letter-spacing ușor pozitiv la titluri mici uppercase, normal la titluri mari.
- **Corp:** **Inter** (sau păstrează fontul sans actual dacă e deja Inter). Weight 400/500.
- **Vocea Norei (mesajele ei):** Cormorant Garamond *italic* — mesajele Norei se disting tipografic, ca o scrisoare.
- Eyebrow labels (ex. „AFTERNOON · IZABELA"): sans 11–12px, uppercase, letter-spacing 2–3px, culoare `--nora-fog` pe închis / `--nora-ink-soft` pe deschis.

## Identitate

- **Logo = wordmark** „nora" — lowercase, Cormorant Garamond, letter-spacing +0.02em, culoare `--nora-pine` pe ivory / `--nora-ivory` pe verde. Opțional punct final auriu: `nora.` — decide vizual, dacă pare prea mult, fără punct.
- **Fără niciun simbol/logo desenat.** Nu crea SVG-uri cu frunze, brazi, luni etc.
- **Favicon + app icon:** litera „n" (Cormorant, lowercase) în `--nora-ivory` pe fundal plin `--nora-pine`. Pur funcțional.
- **Mesajele Norei în My Day:** elimină complet avatarul cu frunză. Identitatea mesajului = cardul: fundal `--nora-pine`, colțuri 14–16px, eyebrow în `--nora-fog`, text în Cormorant italic `--nora-ivory`. Fără avatar, fără iconiță.

## Fotografii de fundal (pădure norvegiană în ceață)

- **Unde DA (doar aici):** (1) ecranul de login/register, (2) headerul superior al aplicației (banda de sus, dacă există), (3) opțional: empty states.
- **Unde NU:** fundalul general al taburilor, spatele listelor, cardurile de conținut. Zonele funcționale rămân ivory curat.
- **Tratament obligatoriu:** imaginea niciodată la opacitate plină în spatele textului. Fie `opacity: 0.10–0.15` peste ivory, fie imagine plină + overlay `--nora-pine` la 55–75% (pentru login). Textul trebuie să treacă contrast AA.
- **Sursă:** Izabela va alege 1–3 fotografii de pe Unsplash (căutare: „foggy forest Norway", „misty pine forest scandinavia") — tonuri verzi-gri, NU albăstrii, aceeași atmosferă între ele. Pune-le în `/public/images/atmosphere/`. Optimizează cu `next/image`, `priority` doar pe login.
- Până alege Izabela imaginile, folosește un placeholder gradient (`--nora-pine` → `--nora-forest`) ca să nu blochezi pașii.

## UI general

- Colțuri: 12–16px carduri, 8–10px butoane/inputuri.
- Umbre: aproape invizibile (`0 1px 2px rgba(31,46,38,0.06)`) sau deloc. Fără umbre aurii/colorate.
- Borduri: hairline `1px` în `--nora-ivory-2` sau `--nora-fog` la opacitate mică. **Elimină toate bordurile aurii existente.**
- Spațiere: crește paddingul general cu ~20–30% față de acum. Respirația e parte din brand.
- Butoane primare: fundal `--nora-pine`, text ivory. Secundare: outline fin, text `--nora-ink`. Fără gradienturi.
- Sentence case peste tot în UI (nu Title Case), în afara eyebrow labels uppercase.

---

## Plan de implementare (pași + commit-uri)

**Pas 1 — Tokens & fonts.** Adaugă noile variabile de culoare, importă Cormorant Garamond, mapează vechile variabile spre cele noi (fără să atingi componentele încă). Verificare: aplicația arată aproape la fel, dar fonturile de titlu s-au schimbat. → commit `rebrand: design tokens + typography (Fog & Pine)`

**Pas 2 — Curățenie aur + frunză.** Elimină avatarul cu frunză din mesajele Norei și toate bordurile/ornamentele aurii. Restilizează cardul mesajelor Norei (pine + Cormorant italic). Verificare în My Day. → commit `rebrand: remove gold ornaments + leaf avatar, restyle Nora messages`

**Pas 3 — Wordmark + favicon.** Wordmark „nora" în header și pe login; generează favicon/app icon „n". → commit `rebrand: wordmark + favicon`

**Pas 4 — Login atmosferic.** Ecranul de login/register cu fotografia de pădure (sau placeholder gradient) + overlay + wordmark. → commit `rebrand: atmospheric login`

- **Tratament "frosted glass":** fotografia de pădure ocupă tot ecranul de login; formularul stă pe o suprafață de sticlă mată semi-transparentă (`backdrop-filter: blur(...)` + fundal alb/ivory la opacitate mică), efect gen lock screen de iPhone — nu card opac clasic peste imagine.
- Headerul superior al aplicației (banda de sus, dacă are fotografie de fundal conform brief-ului) primește același tratament, dar blur mai subtil.
- Zonele de conținut (taburi, carduri) rămân pe ivory solid, fără blur — frosted glass e exclusiv pentru login și eventual header.

**Pas 5 — Trecere prin taburi.** Tab cu tab (My Day → Eat → Move → Ritual → Boost → Ask Nora → Me): aliniază la noile tokens, mărește spațierea, verifică contrastul. Un commit per tab sau per 2 taburi. → commit-uri `rebrand: <tab> aligned to Fog & Pine`

- Verifică și ordinea taburilor din bara de navigare: **My Day, Eat, Move, Ritual, Boost, Ask Nora, Me** (Journey rămâne ascuns/înghețat, nu apare în bară).
- Decizii de ordine internă neluate încă (vezi `IDEI-TABURI.md`) — principiu: **acțiunea zilnică sus, biblioteca/arhiva jos**:
  - **Ritual**: unde intră "Active Challenges" față de challenge-ul zilei și Circadian Rhythm? (candidat: rămâne imediat sub challenge-ul zilei, e tot acțiune zilnică)
  - **Ritual**: conținutul de tip Journey (streak săptămânal, grafic) trăiește încă în `Ritual.jsx` — rămâne acolo sau se mută complet în tabul Journey când se dezgheață (C1)?
  - **Ritual**: "Cycle Phase Insights" / "Performance Windows" (personalizare biologică opt-in) — sus lângă challenge, sau jos ca secțiune extra?
  - **Ritual**: butoanele "Library" (catalog complet) și "Saved" (bookmark-uri) sunt utilitare de sus — rămân acolo (bibliotecă = jos ca principiu, dar ca buton de acces sus e ok) sau se mută la finalul tabului?
  - **Move**: tabul nu există încă (Capitolul D) — ordinea din `PLAYBOOK.md` e doar target, de confirmat la construire.

**Pas 6 — Actualizare CLAUDE.md.** Rescrie secțiunea de design rules din CLAUDE.md cu tot ce e în acest brief (tokens, tipografie, regula 70/25/5, regula fotografiilor, „fără simboluri desenate", „auriu = max un element pe ecran"), ca sesiunile viitoare să respecte automat direcția. → commit `docs: CLAUDE.md design rules → Fog & Pine`

**Reguli de proces:** niciun pas nou fără confirmare vizuală de la Izabela; nu modifica logică/funcționalitate în timpul rebrand-ului — doar stil; dacă un pas cere schimbări structurale de componente, întreabă înainte.
