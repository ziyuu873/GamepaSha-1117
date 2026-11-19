import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Search, Hash } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';
import type { Screen } from '@/App';

type Props = {
  onNavigate: (screen: Screen) => void;
};

export default function RankingScreen({ onNavigate }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Point lookup
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResult, setLookupResult] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'not_found' }
    | { status: 'found'; player: Player; rank: number }
  >({ status: 'idle' });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('score', { ascending: false });
      if (!error && data) setPlayers(data as Player[]);
      setLoading(false);
    })();
  }, []);

  const handleLookup = async () => {
    const num = parseInt(lookupInput.trim(), 10);
    if (Number.isNaN(num)) {
      setLookupResult({ status: 'not_found' });
      return;
    }

    setLookupResult({ status: 'loading' });

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('player_number', num)
      .maybeSingle();

    if (error || !data) {
      setLookupResult({ status: 'not_found' });
      return;
    }

    const player = data as Player;

    let computedRank = players.findIndex((p) => p.id === player.id) + 1;
    if (computedRank === 0) {
      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .gt('score', player.score);
      computedRank = (count ?? 0) + 1;
    }

    setLookupResult({ status: 'found', player, rank: computedRank });
  };

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          <span className="text-lg font-bold">ランキング</span>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
          aria-label="ホームに戻る"
        >
          <span className="text-lg font-bold">×</span>
        </button>
      </header>

      {/* Point lookup */}
      <section className="px-5 pb-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-bold text-white">
              プレイヤー番号を入力してポイントを確認
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup();
              }}
              placeholder="番号を入力（例: 1）"
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              onClick={handleLookup}
              className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 active:scale-95"
            >
              確認
            </button>
          </div>

          {lookupResult.status === 'loading' && (
            <p className="mt-3 text-sm text-slate-400">検索中…</p>
          )}
          {lookupResult.status === 'not_found' && (
            <p className="mt-3 text-sm text-rose-300">
              その番号のプレイヤーは見つかりませんでした
            </p>
          )}
          {lookupResult.status === 'found' && (
            <div className="mt-3 rounded-xl bg-sky-400/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 font-bold text-white">
                  {lookupResult.player.player_number}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">
                    プレイヤー #{lookupResult.player.player_number}
                  </p>
                  <p className="text-lg font-extrabold text-sky-300">
                    {lookupResult.player.score.toLocaleString()} pt
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300">順位</p>
                  <p className="text-lg font-extrabold text-amber-300">
                    {lookupResult.rank}位
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ranking list */}
      {loading ? (
        <div className="px-5">
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : players.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="text-sm text-slate-400">まだプレイヤーがいません</p>
          <p className="mt-1 text-xs text-slate-500">
            最初のミッションをクリアしてトップを目指そう
          </p>
        </div>
      ) : (
        <>
          {podium.length > 0 && (
            <section className="px-5 pb-6">
              <div className="flex items-end justify-center gap-3">
                {podium[1] && (
                  <PodiumCard player={podium[1]} rank={2} height="h-24" />
                )}
                {podium[0] && (
                  <PodiumCard player={podium[0]} rank={1} height="h-32" />
                )}
                {podium[2] && (
                  <PodiumCard player={podium[2]} rank={3} height="h-20" />
                )}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="px-5 pb-10">
              <div className="space-y-2">
                {rest.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                  >
                    <span className="w-6 text-center text-sm font-bold text-slate-400">
                      {i + 4}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-bold text-white">
                      {p.player_number}
                    </div>
                    <span className="flex-1 truncate font-medium text-white">
                      #{p.player_number}
                    </span>
                    <span className="text-sm font-bold text-amber-300">
                      {p.score.toLocaleString()} pt
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="px-5 pb-10">
        <button
          onClick={() => onNavigate('home')}
          className="w-full rounded-2xl bg-white/10 py-3 font-bold text-white transition hover:bg-white/20 active:scale-[0.98]"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

function PodiumCard({
  player,
  rank,
  height,
}: {
  player: Player;
  rank: number;
  height: string;
}) {
  const colors =
    rank === 1
      ? 'from-amber-400 to-yellow-500'
      : rank === 2
        ? 'from-slate-300 to-slate-400'
        : 'from-orange-400 to-orange-500';
  const icon =
    rank === 1 ? (
      <Crown className="h-6 w-6 text-amber-300" />
    ) : rank === 2 ? (
      <Medal className="h-5 w-5 text-slate-200" />
    ) : (
      <Medal className="h-5 w-5 text-orange-300" />
    );

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="relative mb-2">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colors} text-lg font-bold text-slate-900 shadow-lg`}
        >
          {player.player_number}
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          {icon}
        </div>
      </div>
      <p className="mb-1 text-sm font-bold text-white">
        #{player.player_number}
      </p>
      <p className="mb-2 text-xs text-amber-300">
        {player.score.toLocaleString()} pt
      </p>
      <div
        className={`flex w-full ${height} items-start justify-center rounded-t-lg bg-gradient-to-t ${colors} pt-2`}
      >
        <span className="text-2xl font-extrabold text-slate-900">{rank}</span>
      </div>
    </div>
  );
}
