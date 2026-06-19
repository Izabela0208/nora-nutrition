# Nora Library — Implementation Guide for Claude Code

## Ce trebuie făcut

Ai primit 3 fișiere JSON:
- `concepts.json` — 35 concepte wellness (beginner/intermediate/advanced)
- `books.json` — 40 cărți organizate pe categorii
- `podcasts.json` — 25 podcasturi organizate pe categorii

### Pasul 1 — Plasează fișierele JSON în proiect
Copiază toate 3 fișierele în `/data/` sau `/public/data/` în proiectul nora-nutrition.

---

### Pasul 2 — Concepts Tab

Înlocuiește conceptele hardcodate cu datele din `concepts.json`.

**Ce să faci:**
1. Importă/fetch `concepts.json`
2. Adaugă un **search bar** în partea de sus cu placeholder "Search concepts..."
3. Adaugă **filtre pe level**: All | Beginner | Intermediate | Advanced
4. Adaugă **filtre pe categorie** (extrase dinamic din JSON)
5. Afișează fiecare concept ca un card expandabil care arată `summary` în stare colapsată și `body` + `keyPoints` când e expandat
6. Filtrare în timp real pe `title`, `summary`, `tags`, și `body`

**Card design:**
```
[Level badge] [Category badge]
Title
Summary (1 line)
▼ (expand pentru body + key points)
```

---

### Pasul 3 — Books Tab

Înlocuiește cărțile hardcodate cu datele din `books.json`.

**Ce să faci:**
1. Importă/fetch `books.json`  
2. Adaugă **search bar**: caută în `title`, `author`, `description`, `tags`
3. Adaugă **filtre pe category** (dinamic din JSON)
4. Adaugă **filtre pe level**: All | Beginner | Intermediate | Advanced
5. Fiecare carte afișează: cover placeholder cu inițialele, title, author, year, rating (stele), description, keyTakeaway, și buton "View on Amazon" cu `amazonUrl`

---

### Pasul 4 — Podcasts Tab

Înlocuiește podcasturile hardcodate cu datele din `podcasts.json`.

**Ce să faci:**
1. Importă/fetch `podcasts.json`
2. Adaugă **search bar**: caută în `title`, `host`, `description`, `tags`
3. Adaugă **filtre pe category** (dinamic)
4. Fiecare podcast afișează: title, host, category, description, frequency, avgDuration, și butoane "Spotify" + "Apple Podcasts" cu URL-urile respective
5. Afișează `topEpisodes` ca o listă mică de episoade recomandate

---

### Pasul 5 — Articles Tab (SEARCH BAR NOU)

Adaugă un **search bar funcțional** la tab-ul Articles care caută în PubMed.

**Ce să faci:**
1. Adaugă un `<input>` cu placeholder "Search medical literature... (e.g. magnesium sleep)"
2. La submit, apelează PubMed API:
```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax=10&retmode=json
```
3. Apoi fetch detaliile cu:
```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids}&retmode=json
```
4. Afișează rezultatele în același format ca articolele existente

---

### Pasul 6 — Deploy

```bash
npx vercel --prod
```

---

## Note importante

- Toate filtrele și search-urile trebuie să fie **în timp real** (onChange, nu onSubmit)
- Păstrează același design system al Norei: forest green, ivory, gold, Playfair Display
- Level badges: beginner = verde deschis, intermediate = amber, advanced = roșu/bordo
- Pe mobile, filtrele se transformă în dropdown în loc de tab-uri orizontale
