import { useEffect, useState } from 'react';
import { Camera, Trophy, X, ChevronRight, Sparkles, Hash } from 'lucide-react';
import {
  supabase,
  type Mission,
  getStoredPlayerNumber,
} from '@/lib/supabase';
import type { Screen } from '@/App';

type Props = {
  onNavigate: (screen: Screen, mission?: Mission) => void;
};

export default function HomeScreen({ onNavigate }: Props) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const playerNumber = getStoredPlayerNumber();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data) setMissions(data as Mission[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
            <Sparkles className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold tracking-tight">PhotoQuest</span>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Hero */}
      <section className="px-5 pt-4 pb-6 text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          写真で競い合おう
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          ミッションをクリアしてポイントを稼ぎ、ランキング上位を目指そう
        </p>
      </section>

      {/* Player number card */}
      {playerNumber !== null && (
        <section className="px-5 pb-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-blue-500/20">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-300">あなたの番号</p>
                <p className="text-xl font-extrabold text-sky-300">
                  #{playerNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ranking')}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
            >
              順位を見る
            </button>
          </div>
        </section>
      )}

      {/* Ranking button */}
      <section className="px-5 pb-6">
        <button
          onClick={() => onNavigate('ranking')}
          className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 backdrop-blur transition hover:from-amber-500/30 hover:to-orange-500/30 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
              <Trophy className="h-6 w-6 text-slate-900" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">ランキング</p>
              <p className="text-xs text-slate-300">プレイヤーたちと競争する</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/50 transition group-hover:translate-x-1" />
        </button>
      </section>

      {/* Missions */}
      <section className="px-5 pb-10">
        <div className="mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            ミッション
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
            現在挑戦できるミッションはありません
          </p>
        ) : (
          <div className="space-y-3">
            {missions.map((m) => {
              const unlimited = m.max_per_day === null;
              return (
                <button
                  key={m.id}
                  onClick={() => onNavigate('mission', m)}
                  className="group flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur transition hover:border-amber-400/40 hover:bg-white/10 active:scale-[0.98]"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800">
                    <Camera className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{m.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                      {m.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                        <Trophy className="h-3 w-3" />
                        {m.reward_points} pt
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                          unlimited
                            ? 'bg-emerald-400/15 text-emerald-300'
                            : 'bg-sky-400/15 text-sky-300'
                        }`}
                      >
                        {unlimited ? '何回でもOK' : '1日1回'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-amber-400" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
