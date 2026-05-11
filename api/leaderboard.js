import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'survive-sampai-gajian:leaderboard';

function clean(row) {
  return {
    name: String(row.name || 'Anak Kos').trim().replace(/\s+/g, ' ').slice(0, 18),
    score: Math.max(0, Math.min(99999, Number(row.score) || 0)),
    day: Math.max(1, Math.min(30, Number(row.day) || 1)),
    ending: String(row.ending || 'SELESAI').slice(0, 32),
    at: Number(row.at) || Date.now(),
  };
}

async function getRows() {
  const rows = (await redis.get(KEY)) || [];
  return Array.isArray(rows) ? rows.sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10) : [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json(await getRows());
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const rows = await getRows();
  const next = [...rows, clean(req.body)].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10);
  await redis.set(KEY, next);
  return res.status(200).json(next);
}
