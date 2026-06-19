import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['concepts', 'books', 'podcasts'];

function client(serviceRole = false) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default async function handler(req, res) {
  const { table } = req.query;
  if (!ALLOWED.includes(table)) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'GET') {
    const { data, error } = await client()
      .from(table)
      .select('*')
      .order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { data, error } = await client(true)
      .from(table)
      .insert(req.body)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await client(true).from(table).delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
