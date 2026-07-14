# MICI — reparații mărunte (se fac în loturi, la ferestrele dintre capitole)
- Lista de cumpărături: ingredientele identice apar de mai multe ori — trebuie agregate (2 cepe + 1 ceapă = 3 cepe)
- Generarea de mese are butoane de selecție (mai puține / menținere / mai multe kcal), dar alegerea NU influențează rezultatul generat — sistemul generează la fel indiferent de buton. De verificat: butonul selectat ajunge ca parametru în apelul de generare (Spoonacular sau Claude), sau se pierde pe drum.
- De retestat: persistența `biological_context` la refresh; onboarding nou fără întrebări cycle/perimenopauză
- Toggle-ul "Notifications" din Me (A3 sub-pas 4) salvează doar preferința (`user_settings.notifications_enabled`) — nu există încă niciun sistem real de notificări/push/email. De construit la C4.
- De decis canal de contact (email dedicat sau formular) înainte de primii utilizatori externi — pagina de Confidențialitate (A4) are momentan „Contact details will be published here before public launch" la secțiunea de Contact.

## Idei prioritare
- **Onboarding conversațional:** 1-2 ecrane după înregistrare în care Nora se prezintă și explică ce face aplicația (nutrition + rituals + ghidare personalizată) — aici se rezolvă înțelegerea aplicației, nu pe login. De construit odată cu / imediat după capitolul B (vocea).
- **Weekly Intelligence Report** (Journey, când se dezgheață — C1): va acoperi și nevoia de retrospectivă săptămânală vizuală — fostul Weekly Energy, șters 13.07.
- **Fasting opt-in** — CONSTRUIT 13.07: toggle în Me (fereastră recurentă cu presetări 16:8/14:10/12:12 + "Other" pentru post custom peste 24h, cu disclaimer de siguranță), banda din My Day citește setarea (recurring: în fereastră/fasting; extended: countdown). Rămân neconstruite: cele 2-3 ecrane scurte de ghidare la prima activare și articolele de adâncime în Library — sfaturile ulterioare rămân doar prin insight-uri contextuale, picătură cu picătură.
- **Bug rezolvat 13.07** — eating window (My Day) nu se distingea vizual / se suprapunea conceptual cu un card vechi din Circadian tip, cu același nume ("Eating Window") dar calculat din răsărit/apus, nu din fasting-ul real. Componenta veche (`EatingWindowTimeline`) a fost eliminată complet; acum există un singur eating window, poziționat fix deasupra logării rapide, cu bordură vizibilă și status live.

## Idei post-validare
- **Login biometric (Face ID/amprentă) prin passkeys/WebAuthn** — suportat nativ de Supabase Auth; telefonul verifică, noi primim doar confirmarea, zero date biometrice stocate la noi. De adăugat când există utilizatori recurenți, ca reducere de fricțiune la login.
