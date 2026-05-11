import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flame, RotateCcw, Share2, Trophy, WalletCards } from 'lucide-react';
import { applyChoice, calculateScore, endingText, makeInitial, pickEvent, rupiah, type Choice, type GameState, type StatKey } from './game';
import './styles.css';

const saveKey = 'survive-sampai-gajian:v3';
const boardKey = 'survive-sampai-gajian:leaderboard';
const statLabel: Record<StatKey,string> = { money:'Duit', mental:'Mental', health:'Badan', love:'Relasi', family:'Keluarga', debt:'Utang' };
type Board = { name: string; score: number; day: number; ending: string; at: number }[];
function load(): GameState { try { const raw = localStorage.getItem(saveKey); return raw ? JSON.parse(raw) : makeInitial(); } catch { return makeInitial(); } }
function board(): Board { try { return JSON.parse(localStorage.getItem(boardKey) || '[]'); } catch { return []; } }
function deltaText(effects: Partial<Record<StatKey, number>>) { return Object.entries(effects).map(([k,v]) => `${v!>0?'+':''}${k==='money'||k==='debt'?rupiah(v!):v} ${statLabel[k as StatKey]}`).join(' · '); }
function mood(state: GameState) { const s = state.stats; if (s.mental < 25 || s.health < 25) return 'capek'; if (s.money < 120000) return 'panik'; if (s.love > 70 || s.family > 70) return 'lega'; return 'normal'; }

function App() {
  const [started, setStarted] = useState(() => !!localStorage.getItem(saveKey));
  const [state, setState] = useState<GameState>(load);
  const [leaders, setLeaders] = useState<Board>(board);
  const [copied, setCopied] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [toast, setToast] = useState('Hari awal santai dulu. Belum ada kos nagih, belum ada pinjol nyamperin.');
  const event = useMemo(() => pickEvent(state), [state]);
  const liveScore = calculateScore(state);
  useEffect(() => { if(started) localStorage.setItem(saveKey, JSON.stringify(state)); }, [state, started]);
  const recordScore = (finalState: GameState) => { if (!finalState.over) return; const score = calculateScore(finalState); const title = endingText(finalState.over, finalState).title; setLeaders(prev => { const row = { name: alias(score), score, day: Math.min(finalState.day - 1, 30), ending: title, at: Date.now() }; const next = [...prev, row].sort((a,b)=>b.score-a.score).slice(0,10); localStorage.setItem(boardKey, JSON.stringify(next)); return next; }); };
  const restart = () => { const s = makeInitial(Math.floor(Math.random()*999999)); setState(s); setStarted(true); localStorage.setItem(saveKey, JSON.stringify(s)); setCopied(false); setPulse(0); setToast('Run baru. Target simpel: jangan malu-maluin di leaderboard.'); };
  const choose = (choice: Choice) => { setPulse(p=>p+1); setToast(choice.sub); setState(s=>{ const next = applyChoice(s,event,choice); recordScore(next); return next; }); };
  const share = async () => { const end = state.over ? endingText(state.over, state) : undefined; const text = `Gue dapet ${end?.title ?? 'MASIH HIDUP'} di Survive Sampai Gajian. Skor ${liveScore}, hari ${Math.min(state.day,30)}/30, sisa ${rupiah(state.stats.money)}. Coba kalahin.`; try { if(navigator.share) await navigator.share({title:'Survive Sampai Gajian', text}); else await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } };

  if (!started) return <Shell><section className="intro"><div className="heroCard"><Character mood="normal" pulse={pulse}/><div><p className="stamp"><Flame size={14}/> LAGI TANGGAL TUA</p><h1>Survive<br/>Sampai<br/>Gajian</h1><p>30 hari sebelum gajian. Duit harus cukup, badan jangan tumbang, chat jangan dianggurin semua. Mainnya cepet, tapi pasti pengin ngulang karena “harusnya tadi gue pilih yang itu”.</p><button className="primary" onClick={restart}>Mulai hidup susah</button></div></div><Leaderboard leaders={leaders}/></section></Shell>;
  if (state.over) { const end = endingText(state.over, state); return <Shell><section className="ending"><p className="stamp">HASIL AKHIR</p><Character mood={state.over === 'payday' ? 'lega' : 'capek'} pulse={pulse}/><h1>{end.title}</h1><p>{end.desc}</p><div className="score">Skor kamu <b>{end.score}</b></div><div className="actions"><button onClick={share}><Share2 size={18}/>{copied?'Udah kesalin':'Pamerin hasil'}</button><button onClick={restart}><RotateCcw size={18}/>Coba lagi</button></div><Stats stats={state.stats}/><Leaderboard leaders={leaders}/><History items={state.history}/></section></Shell>; }
  return <Shell><main className="game"><header className="top"><div><span className="eyebrow">Hari {state.day}/30 · Skor {liveScore}</span><h1>{event.title}</h1></div><div className="payday"><WalletCards size={18}/>Gajian {31-state.day} hari</div></header><div className="stage"><Character mood={mood(state)} pulse={pulse}/><div className="bubble"><b>Mode nggak bisa dihafal</b><p>Event ikut kondisi kamu. Pilihan yang sama bisa kena plot twist beda, jadi nggak ada rute sakti buat diulang mentah-mentah.</p><small>Main pakai feeling, bukan contekan.</small></div></div><Stats stats={state.stats}/><section className="scene"><p>{event.scene}</p></section><div className="notice"><span>catatan</span><p>{toast}</p></div><section className="choices" aria-label="Pilihan aksi">{event.choices.map((c,i)=><button key={c.text} className="choice" onClick={()=>choose(c)}><span className="num">0{i+1}</span><b>{c.text}</b><small>{c.sub}</small><em>{deltaText(c.effects)}</em></button>)}</section><Leaderboard leaders={leaders.slice(0,3)}/></main></Shell>;
}
function alias(score:number){ const names = ['Sultan Warteg','Anak Kos Kuat','Korban Promo','Admin Patungan','Si Paling Hemat']; return `${names[score % names.length]} #${String(score).slice(-3)}`; }
function Shell({children}:{children:React.ReactNode}){ return <div className="app"><div className="orb one"/><div className="orb two"/><div className="road"><i/><i/><i/></div><div className="noise"/>{children}</div>; }
function Character({mood,pulse}:{mood:string;pulse:number}){ return <div className={`char ${mood}`} key={pulse}><div className="hair"/><div className="head"><span/><span/></div><div className="body"><b>anak<br/>gajian</b></div><div className="legs"><i/><i/></div></div>; }
function Stats({stats}:{stats:GameState['stats']}){ const keys: StatKey[]=['money','mental','health','love','family','debt']; return <section className="stats">{keys.map(k=><div className={`stat ${k}`} key={k}><span>{statLabel[k]}</span><b>{k==='money'?rupiah(stats[k]):k==='debt'?rupiah(-stats[k]):stats[k]}</b>{k!=='money'&&k!=='debt'&&<i style={{width:`${stats[k]}%`}}/>}</div>)}</section>; }
function Leaderboard({leaders}:{leaders:Board}){ return <section className="leader"><h2><Trophy size={18}/> Papan skor kosan</h2>{leaders.length?leaders.map((r,i)=><div className="rank" key={r.at + r.name}><b>#{i+1}</b><span>{r.name}<small>{r.ending} · hari {r.day}</small></span><strong>{r.score}</strong></div>):<p>Belum ada skor. Gas dulu, nanti namamu nongol di sini.</p>}</section>; }
function History({items}:{items:string[]}){ if(!items.length) return null; return <aside className="history"><b>Jejak penderitaan</b>{items.map(x=><span key={x}>{x}</span>)}</aside>; }
createRoot(document.getElementById('root')!).render(<App />);
