const { createClient } = require('@supabase/supabase-js');
const concepts = require('../data/concepts.json');
const books    = require('../data/books.json');
const podcasts = require('../data/podcasts.json');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const mappedConcepts = concepts.map(c => ({
    id:               c.id,
    title:            c.title,
    slug:             c.slug,
    level:            c.level,
    category:         c.category,
    summary:          c.summary,
    body:             c.body,
    key_points:       c.keyPoints        || [],
    related_concepts: c.relatedConcepts  || [],
    tags:             c.tags             || [],
  }));

  const mappedBooks = books.map(b => ({
    id:          b.id,
    title:       b.title,
    author:      b.author,
    category:    b.category,
    level:       b.level,
    year:        b.year,
    pages:       b.pages,
    rating:      b.rating,
    description: b.description,
    key_takeaway:b.keyTakeaway,
    amazon_url:  b.amazonUrl,
    tags:        b.tags || [],
  }));

  const mappedPodcasts = podcasts.map(p => ({
    id:          p.id,
    title:       p.title,
    host:        p.host,
    category:    p.category,
    description: p.description,
    frequency:   p.frequency,
    avg_duration:p.avgDuration,
    level:       p.level,
    spotify_url: p.spotifyUrl,
    apple_url:   p.appleUrl,
    top_episodes:p.topEpisodes || [],
    tags:        p.tags        || [],
  }));

  console.log('Seeding concepts…');
  const { error: e1 } = await supabase.from('concepts').upsert(mappedConcepts);
  if (e1) console.error('  ✗ concepts:', e1.message);
  else    console.log(`  ✓ ${mappedConcepts.length} concepts`);

  console.log('Seeding books…');
  const { error: e2 } = await supabase.from('books').upsert(mappedBooks);
  if (e2) console.error('  ✗ books:', e2.message);
  else    console.log(`  ✓ ${mappedBooks.length} books`);

  console.log('Seeding podcasts…');
  const { error: e3 } = await supabase.from('podcasts').upsert(mappedPodcasts);
  if (e3) console.error('  ✗ podcasts:', e3.message);
  else    console.log(`  ✓ ${mappedPodcasts.length} podcasts`);

  console.log('Done.');
}

seed().catch(console.error);
