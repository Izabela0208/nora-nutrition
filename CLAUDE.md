# Nora — Instrucțiuni pentru Claude Code

## Despre proiect

Nora (nora-nutrition) este o aplicație web de wellness construită în Next.js, deployată pe Vercel la `nora-nutrition.vercel.app`. Dezvoltator solo: Izabela, relativ nouă în web development — explică deciziile tehnice în termeni simpli atunci când sunt neevidente.

## Stack tehnic

- **Framework:** Next.js (deploy pe Vercel, repo GitHub: Izabela0208/nora-nutrition)
- **Backend/DB:** Supabase (proiect "Nora", free tier — atenție la auto-pauză după inactivitate)
- **AI:** Anthropic API (inclusiv Claude Vision pentru analiza foto a mâncării)
- **Date nutriționale:** Spoonacular, USDA FoodData Central, Open Food Facts
- **Științific:** PubMed

## Structura aplicației (taburi)

- **My Day** — brief zilnic (ecran de start): salut, un insight, o acțiune recomandată, challenge-ul zilei. NU dashboard cu date duplicate.
- **Eat** — logare mese: barcode, foto (Claude Vision), căutare. După fiecare masă logată, Nora oferă un comentariu scurt (1 frază).
- **Ritual** — challenge biohacking zilnic (rotație 60 zile, fără repetiție) + timeline circadian cu sunrise/sunset pe geolocalizare.
- **Boost** — recomandări de suplimente legate de mesele logate. Fiecare recomandare are explicație transparentă ("de ce vezi asta") + disclaimer UE.
- **Ask Nora** — chat AI cu context personal (mesele de azi, challenge curent, tendințe).
- **Me** — doar setări esențiale: profil, obiective, unități, notificări.
- **Journey** — înghețat momentan; va deveni rezumatul săptămânal.

## Identitate vizuală: "old money luxury wellness"

Reguli stricte de design — respectă-le la ORICE modificare de UI:

- **Fonturi:** Playfair Display DOAR pentru titluri mari (H1, H2, cifre-hero). Body text, butoane, label-uri: sans-serif (Inter sau echivalent).
- **Culori:** forest green (verde pădure închis), warm ivory (fundal), aged gold (accente).
- **Regula aurului:** MAXIM un element auriu vizibil per ecran (linie sub titlu, icon activ, sau divider). Niciodată butoane mari aurii, borduri aurii multiple sau fundaluri aurii.
- **Ierarhie prin tonuri:** folosește nuanțe de verde + ivory, nu culori noi. Nu introduce culori în afara paletei fără aprobare explicită.
- **Spațiere:** generoasă. Padding mare pe carduri, line-height 1.6–1.7. Când ai dubii, adaugă spațiu, nu elemente.
- **Colțuri rotunjite:** 12px, consecvent peste tot.
- **Tranziții:** 300–400ms, lente și elegante. Niciodată sub 200ms.
- **Umbre:** foarte subtile sau borduri hairline 1px. Fără box-shadow agresiv.
- **Iconografie:** line-style subțire (stroke 1.5px). Niciodată icons filled colorate.
- **Botanice:** doar ca watermark subtil (opacitate 4–6%) în header-e sau empty states.
- **Dark mode:** NU există și nu se adaugă.

## Reguli de lucru — OBLIGATORII

1. **Modifică DOAR ce se cere explicit. NU schimba nimic altceva** — fără refactorizări, redenumiri, "îmbunătățiri" sau curățenie neceruta, oricât de tentant ar fi.
2. Înainte de modificări care ating mai mult de un fișier, prezintă un plan scurt și așteaptă confirmarea.
3. Nu șterge niciodată cod comentându-l "pentru siguranță" — dacă trebuie șters, șterge; dacă e risc, întreabă.
4. Nu adăuga dependențe (npm install) fără să întrebi mai întâi și să explici de ce.
5. Chei API și secrete: NICIODATĂ hardcodate. Doar variabile de mediu (.env.local local, Environment Variables pe Vercel). Nu afișa valorile cheilor în output.
6. La orice modificare de UI, verifică respectarea regulilor de design de mai sus.
7. După modificări, spune exact ce fișiere au fost atinse și ce s-a schimbat, pe scurt.
8. Explică în română. Termenii tehnici pot rămâne în engleză.

## Mediu de lucru

- Windows + PowerShell. Prefixul `!` este necesar pentru comenzi.
- Calea proiectului: `C:\Users\Izabela\Desktop\nora-nutrition` (navigare din `C:\Users\Izabela` cu `cd Desktop/nora-nutrition`).

## Principii de produs (contextul deciziilor)

- Diferențiatorii Nora: AI conversațional cu context personal + identitate vizuală puternică. Orice funcție nouă trebuie să servească unul dintre acești doi piloni.
- Mai bine 4 taburi excelente decât 7 mediocre.
- Vocea Nora apare transversal: comentarii în Eat, explicații în Ritual, justificări în Boost.
- Public țintă inițial: validare cu 5 utilizatori reali înainte de investiții.
