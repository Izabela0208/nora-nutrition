// Romanian overlay for data/podcasts.json (Ritual → Library → Podcasts tab).
// Keyed by podcast id — merged over the English base object at render time.
// Only "description" is translated (Nora's own blurb about the show). title/host/topEpisodes
// stay English always — these are real, published podcast/episode names with no official
// Romanian translation, same rule as book titles.
const podcastsRo = {
  p001: { description:"Neurologul Andrew Huberman, de la Stanford, oferă protocoale detaliate, bazate pe știință, despre somn, concentrare, fitness, stres, nutriție și performanță. Fiecare episod acoperă un singur subiect, cu instrumente aplicabile direct." },
  p002: { description:"Biochimista Rhonda Patrick explorează mecanismele din spatele nutriției, exercițiului fizic și îmbătrânirii, cu rigoare științifică. Cunoscută pentru interviurile ample cu experți și pentru cercetările proprii despre saună și expunerea la frig." },
  p003: { description:"Medicul specializat în longevitate Peter Attia intervievează experți de top și abordează în profunzime sănătatea metabolică, cancerul, bolile cardiovasculare, exercițiul fizic și știința unei vieți lungi și sănătoase." },
  p004: { description:"Conversații premiate cu Peabody Award despre marile întrebări ale sensului uman — cu oameni de știință, poeți, teologi și activiști, la intersecția dintre spiritualitate și viața publică." },
  p005: { description:"Demontarea, bazată pe dovezi, a miturilor din wellness, a culturii dietelor și a modelor din sănătate — pune la îndoială cele mai populare afirmații ale industriei „wellness” prin cercetare riguroasă." },
  p006: { description:"Tim Ferriss disecă performeri de talie mondială — sportivi, autori, oameni de știință, investitori — pentru a extrage obiceiurile, instrumentele și rutinele de dimineață care le susțin performanța maximă." },
  p007: { description:"Prezentatorul ABC News Dan Harris privește meditația și mindfulness-ul cu ochi de sceptic — cu profesori și cercetători de top care fac aceste practici accesibile și bazate pe dovezi." },
  p008: { description:"Medicul de familie britanic și autor de bestselleruri Rangan Chatterjee intervievează experți de top în sănătate, cu accent pe schimbări simple și practice ale stilului de viață, cu cel mai mare impact asupra stării de bine." },
  p009: { description:"Fondatorul PhilosophersNotes, Brian Johnson, extrage cele mai bune idei ale celor mai mari gânditori despre o viață optimă — centrat pe „Areté” (a trăi la cel mai înalt potențial al tău), prin înțelepciune antică și modernă." },
  p010: { description:"Nutriționistul și autorul de bestselleruri Shawn Stevenson explică cele mai noi descoperiri științifice despre somn, nutriție, fitness și mentalitate, într-un format accesibil și captivant, cu invitați experți în fiecare săptămână." },
  p011: { description:"Echipa din spatele celui mai amplu studiu științific despre nutriție din lume (ZOE) prezintă cercetări de ultimă oră despre microbiom, nutriție personalizată și felul în care alimentele influențează corpul — alături de oameni de știință și medici." },
  p012: { description:"CEO-ul WHOOP, Will Ahmed, și echipa sa discută despre știința recuperării, performanța sportivilor, HRV, optimizarea somnului și datele din spatele performanței umane maxime — deseori alături de sportivi de elită și antrenori." },
  p013: { description:"Fiziologul sportiv și cercetătorul în performanță Andy Galpin (apărut și la Huberman Lab) acoperă știința performanței sportive — forță, anduranță, somn, nutriție și protocoale de recuperare." },
  p014: { description:"Jurnalistul de sănătate și autorul Max Lugavere (Genius Foods, Genius Kitchen) se concentrează pe sănătatea creierului, performanța cognitivă și prevenirea Alzheimerului, prin nutriție și stil de viață." },
  p015: { description:"Actorul și podcasterul Dax Shepard intervievează oameni de știință, psihologi, artiști și personalități publice, în conversații calde și sincere, care ating adesea teme precum sănătatea mintală, dependența, relațiile și comportamentul uman." },
  p016: { description:"Fizioterapeutul și nutriționistul Simon Hill intervievează cercetători de top în nutriție, în conversații ample, făcând legătura între tabere alimentare aflate în contradicție, cu nuanță și dovezi." },
  p017: { description:"Practicieni de medicină funcțională discută despre testele de laborator, analiza cauzelor profunde și optimizarea performanței pentru sportivi și persoane cu rezultate de top — cu accent pe profunzime clinică și interpretarea biomarkerilor." },
  p018: { description:"Sportivul de ultra-anduranță, adept al alimentației vegetale, Rich Roll intervievează sportivi, autori și gânditori de top despre performanța optimă, creșterea spirituală și puterea unui stil de viață bazat pe plante." },
  p019: { description:"Jurnalista de știință premiată Alie Ward intervievează oameni de știință (specialiști în „-ologii”) despre specialitatea lor — de la micologie la cronobiologie și somnologie — făcând știința accesibilă și captivantă." },
  p020: { description:"Pionierul medicinei funcționale Mark Hyman explorează ideea că alimentația este medicament — de la sănătatea intestinală, la toxine, hormoni și sistemul de sănătate defectuos, cu invitați experți săptămânal." },
  p021: { description:"Antreprenorul Dhru Purohit (fost CEO al companiei Dr. Mark Hyman) intervievează experți de top în sănătate, cu accent pe sănătatea mintală, optimizarea funcției creierului, traumă și cauzele profunde ale bolilor cronice." },
  p022: { description:"Fondatorul Impact Theory, Tom Bilyeu, intervievează experți de top în sănătate, cu accent pe idei aplicabile direct — nutriție, longevitate, sănătate mintală și performanță maximă." },
  p023: { description:"Trei antrenori personali cu experiență separă informația utilă de zgomotul din industria fitness-ului, cu sfaturi de antrenament și nutriție bazate pe dovezi — cunoscuți pentru demontarea miturilor și accentul pe abordări sustenabile, pe termen lung." },
  p024: { description:"Cofondatorul Commune, Jeff Krasno, explorează intersecția dintre sănătate, ecologie, spiritualitate și comunitate — cu gânditori vizionari, pe teme de la agricultura regenerativă la leadership conștient." },
  p025: { description:"Coach-ul certificat în sănătate Jenn Trepeck face nutriția și wellness-ul accesibile, fără pretenția perfecțiunii — cu instrumente practice pentru glicemie, sănătate intestinală, hormoni și construirea unor obiceiuri sustenabile." },
};

export default podcastsRo;
