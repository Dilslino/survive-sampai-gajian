export type BoardEntry = { name: string; score: number; day: number; ending: string; at: number };
export type Board = BoardEntry[];

const localBoardKey = 'survive-sampai-gajian:leaderboard';
const endpoint = import.meta.env.VITE_LEADERBOARD_URL as string | undefined;

function top10(rows: Board) {
  return rows.sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10);
}

export function readLocalBoard(): Board {
  try { return top10(JSON.parse(localStorage.getItem(localBoardKey) || '[]')); } catch { return []; }
}

export function writeLocalScore(row: BoardEntry) {
  const next = top10([...readLocalBoard(), row]);
  localStorage.setItem(localBoardKey, JSON.stringify(next));
  return next;
}

export async function fetchBoard(): Promise<{ online: boolean; rows: Board }> {
  if (!endpoint) return { online: false, rows: readLocalBoard() };
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('Leaderboard gagal dimuat');
  const rows = await res.json();
  return { online: true, rows: top10(Array.isArray(rows) ? rows : rows.rows || []) };
}

export async function submitScore(row: BoardEntry): Promise<{ online: boolean; rows: Board }> {
  const local = writeLocalScore(row);
  if (!endpoint) return { online: false, rows: local };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error('Skor gagal dikirim');
  const rows = await res.json();
  return { online: true, rows: top10(Array.isArray(rows) ? rows : rows.rows || []) };
}
