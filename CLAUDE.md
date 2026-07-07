# Nora — Instrucțiuni pentru Claude Code

## Despre proiect

Nora (nora-nutrition) este o aplicație web de wellness construită în Next.js, deployată pe Vercel la `nora-nutrition.vercel.app`. Dezvoltator solo: Izabela, relativ nouă în web development — explică deciziile tehnice în termeni simpli atunci când sunt neevidente.

## Stack tehnic

* **Framework:** Next.js (deploy pe Vercel, repo GitHub: Izabela0208/nora-nutrition)
* **Backend/DB:** Supabase (proiect "Nora", free tier — atenție la auto-pauză după inactivitate)
* **AI:** Anthropic API (inclusiv Claude Vision pentru analiza foto a mâncării)
* **Date nutriționale:** Spoonacular, USDA FoodData Central, Open Food Facts
* **Științific:** PubMed

## Structura aplicației (taburi)

* **My Day** — brief zilnic (ecran de start): salut, un insight, o acțiune recomandată, challenge-ul zilei. NU dashboard cu date duplicate.
* **Eat** — logare mese: barcode, foto (Claude Vision), căutare. După fiecare masă logată, Nora oferă un comentariu scurt (1 frază).
* **Ritual** — challenge biohacking zilnic (rotație 60 zile, fără repetiție) + timeline circadian cu sunrise/sunset pe geolocalizare.
* **Move** — bibliotecă de rutine în trei categorii: Energie (fitness blând fără echipament), Calm (mobilitate, stretching, plimbări), Respirație (meditație și respirație ghidate în text). Fără video, fără tracking în v1.
* **Boost** — recomandări de suplimente legate de mesele logate. Fiecare recomandare are explicație transparentă ("de ce vezi asta") + disclaimer UE.
* **Ask Nora** — chat AI cu context personal (mesele de azi, challenge curent, tendințe).
* **Me** — doar setări esențiale: profil, obiective, unități, notificări.
* **Journey** — înghețat momentan; va deveni rezumatul săptămânal; ascuns din navigare până după testul cu utilizatori.



\## Identitate vizuală: "quiet luxury wellness" (neutru, unisex)



Direcția: eleganță tăcută, pădure nordică/englezească (brad, stejar, ferigă, ceață) — NU tropical/junglă exuberantă. Referințe de ton: Rhode, quiet luxury, old money. Aplicația se adresează egal femeilor și bărbaților.



Reguli stricte — respectă-le la ORICE modificare de UI:



\- \*\*Fonturi:\*\* Playfair Display DOAR pentru titluri mari (H1, H2, cifre-hero). Restul: sans-serif (Inter). Label-uri mici: uppercase, letter-spacing generos, corp mic — folosite consecvent.

\- \*\*Paleta:\*\* forest green închis (#1B3A2D și tonuri derivate), warm ivory (fundaluri), aged gold (accent unic), plus neutre de pământ: taupe, greige, piatră. INTERZISE: roz, piersică, corai, albastru, mentă, orice ton "dulce" sau viu.

\- \*\*Text:\*\* verde-cărbune închis în loc de negru pur. Contrast moale, nimic nu "sare".

\- \*\*Regula aurului:\*\* MAXIM un element auriu vizibil per ecran. Niciodată butoane mari aurii.

\- \*\*Ierarhie prin tonuri apropiate:\*\* carduri ivory pe fundal ivory-mai-cald, separate prin borduri hairline 1px sau umbre abia perceptibile.

\- \*\*Imagini (rețete etc.):\*\* tratament uniform obligatoriu — desaturare 10–15% + overlay subtil verde-cald, prin CSS, peste toate imaginile externe.

\- \*\*Iconografie:\*\* line-style subțire (stroke 1.5px), neutră. Bookmark în loc de inimă pentru favorite. Fără inimioare, flori delicate, ornamente "pretty".

\- \*\*Ilustrații botanice:\*\* doar watermark (opacitate 4–6%), motive nordice: ferigă, ramuri de conifer, stejar. NU monstera, palmieri, tropical.

\- \*\*Copy/voce:\*\* caldă dar sobră, FĂRĂ adresare de gen (nicio formă gramaticală care presupune genul utilizatorului), fără diminutive, fără exclamații entuziaste. Ton: "O zi așezată." nu "Bravo, super!!"

\- \*\*Spațiere:\*\* generoasă. Line-height 1.6–1.7. Empty states: o frază în Playfair + mult gol + eventual watermark botanic.

\- \*\*Colțuri:\*\* 12px pe carduri/butoane; 6px pe elemente micro (pastile); 50% doar pe elemente intenționat circulare.

\- \*\*Tranziții:\*\* 300–400ms.

\- \*\*Dark mode:\*\* NU există.

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

* Windows + PowerShell. Prefixul `!` este necesar pentru comenzi.
* Calea proiectului: `C:\\\\Users\\\\Izabela\\\\Desktop\\\\nora-nutrition` (navigare din `C:\\\\Users\\\\Izabela` cu `cd Desktop/nora-nutrition`).

## Principii de produs (contextul deciziilor)

* Diferențiatorii Nora: AI conversațional cu context personal + identitate vizuală puternică. Orice funcție nouă trebuie să servească unul dintre acești doi piloni.
* Mai bine 4 taburi excelente decât 7 mediocre.
* Vocea Nora apare transversal: comentarii în Eat, explicații în Ritual, justificări în Boost.
* Public țintă inițial: validare cu 5 utilizatori reali înainte de investiții.
* Aplicația se adresează egal femeilor și bărbaților — nimic nu presupune genul utilizatorului.
* Public global, estetică europeană: designul NU se adaptează pe piețe; doar limba se localizează.

