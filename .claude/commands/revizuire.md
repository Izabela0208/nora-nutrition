Fă o revizuire a fișierului sau zonei de cod indicate de mine.

Caută și raportează, în ordinea importanței:
1. **Securitate:** chei API expuse, date sensibile în cod, lipsă validare pe input-uri, probleme RLS Supabase.
2. **Bug-uri probabile:** erori de logică, cazuri limită netratate (date lipsă, API care nu răspunde, utilizator fără date logate).
3. **Performanță:** apeluri API repetate inutil, re-render-uri evitabile, imagini neoptimizate.
4. **Consecvență cu design-ul Nora:** doar dacă fișierul conține UI.

Format raport: pentru fiecare problemă — severitate (critică/medie/minoră), fișier + zonă, explicație pe scurt în termeni simpli, și ce ai propune ca rezolvare.

NU modifica nimic. Doar raportează. Decid eu ce corectăm și îți cer explicit.
