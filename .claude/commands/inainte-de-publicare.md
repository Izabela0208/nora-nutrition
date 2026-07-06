Fă un control tehnic complet înainte de publicarea pe Vercel. NU publica nimic — doar verifică și raportează.

Rulează verificările în această ordine (comenzile în PowerShell, cu prefixul ! unde e cazul):

1. **Build local:** rulează `npm run build`. Dacă eșuează, oprește-te aici și explică-mi eroarea în termeni simpli + ce fișier o cauzează.
2. **Chei și secrete:** caută în tot codul (în afară de .env.local) valori care arată ca niște chei API, URL-uri Supabase cu chei incluse, sau parole hardcodate. Verifică și că .env.local e listat în .gitignore.
3. **Variabile de mediu:** listează toate variabilele de mediu pe care codul le folosește (process.env.*) și spune-mi care trebuie să existe în Vercel → Settings → Environment Variables. NU afișa valorile lor.
4. **Erori evidente:** caută console.log-uri uitate cu date sensibile, comentarii TODO critice, și importuri de fișiere care nu mai există.
5. **Pagini principale:** verifică rapid că rutele principale (My Day, Eat, Ritual, Boost, Ask Nora) există și nu au erori de sintaxă.

Format raport final:
- ✅ Ce a trecut
- ⚠️ Probleme minore (pot publica, dar de reparat curând)
- ⛔ Blocante (NU publica până nu se rezolvă) — cu explicație simplă pentru fiecare

La final, dacă totul e verde, spune-mi exact ce comandă rulez pentru commit + push ca Vercel să preia publicarea. Dacă există blocante, întreabă-mă dacă vreau să le reparăm pe rând.
