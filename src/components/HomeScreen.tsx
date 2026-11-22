import { useEffect, useState } from 'react';
import {
  Camera,
  Trophy,
  X,
  ChevronRight,
  Sparkles,
  Hash,
  HelpCircle,
  Award,
  Search,
} from 'lucide-react';
import {
  supabase,
  type Mission,
  getStoredPlayerNumber,
  type Player,
} from '@/lib/supabase';
import { TITLES, getTitleForScore } from '@/lib/titles';
import type { Screen } from '@/App';

type Props = {
  onNavigate: (screen: Screen, mission?: Mission) => void;
};

export default function HomeScreen({ onNavigate }: Props) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
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
          <span className="text-lg font-bold tracking-tight">撮ってパシャ！</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 text-white/80 transition hover:border-amber-400 hover:text-amber-400 active:scale-95"
            aria-label="遊び方"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowTitles(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 text-white/80 transition hover:border-amber-400 hover:text-amber-400 active:scale-95"
            aria-label="称号一覧"
          >
            <Award className="h-5 w-5" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-4 pb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          撮ってパシャ！
        </h1>
        <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
          研究目的に使います。写真を投稿するには、Googleアカウントが必要になります。
        </p>
        <p className="mt-3 text-sm text-slate-300">
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

      {/* Help popup */}
      {showHelp && <HelpPopup onClose={() => setShowHelp(false)} />}

      {/* Titles popup */}
      {showTitles && (
        <TitlesPopup
          onClose={() => setShowTitles(false)}
          storedNumber={playerNumber}
        />
      )}
    </div>
  );
}

function HelpPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">遊び方</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 active:scale-95"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="space-y-3 text-sm text-slate-300">
          {[
            '好きなミッションを選ぶ',
            '「写真を投稿する」を押して、投稿フォームから写真を送る（Googleアカウントが必要）',
            'アプリに戻って「完了報告してポイント獲得」を押す',
            '初めての人にはプレイヤー番号が発行されるので、メモしておく',
            '1日1回のミッションと、何度でもできるミッションがある',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3">
          <p className="text-xs leading-relaxed text-rose-200">
            ※顔・車のナンバー・住所が分かるものは写さないでください
          </p>
        </div>
      </div>
    </div>
  );
}

function TitlesPopup({
  onClose,
  storedNumber,
}: {
  onClose: () => void;
  storedNumber: number | null;
}) {
  const [inputNumber, setInputNumber] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auto-load if stored number exists
  useEffect(() => {
    if (storedNumber !== null) {
      (async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('player_number', storedNumber)
          .maybeSingle();
        setLoading(false);
        if (!error && data) setPlayer(data as Player);
      })();
    }
  }, [storedNumber]);

  const activeNumber = storedNumber ?? player?.player_number ?? null;
  const score = player?.score ?? 0;
  const earnedCount = TITLES.filter((t) => score >= t.threshold).length;

  const lookup = async () => {
    const n = parseInt(inputNumber.trim(), 10);
    if (Number.isNaN(n)) {
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('player_number', n)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      setPlayer(null);
      setNotFound(true);
      return;
    }
    setPlayer(data as Player);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">称号一覧</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 active:scale-95"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Number input or display */}
        {activeNumber !== null ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-slate-300">プレイヤー番号</p>
            <p className="text-2xl font-extrabold text-sky-300">
              #{activeNumber}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              現在の称号:
              <span className="ml-1 font-bold text-amber-300">
                {getTitleForScore(score).name}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              合計 {score.toLocaleString()} pt
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-400" />
              <p className="text-sm font-bold text-white">
                プレイヤー番号を入力
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') lookup();
                }}
                placeholder="例: 1"
                className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
              <button
                onClick={lookup}
                className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-2.5 font-bold text-white active:scale-95"
              >
                確認
              </button>
            </div>
            {notFound && (
              <p className="mt-2 text-xs text-rose-300">
                その番号のプレイヤーは見つかりませんでした
              </p>
            )}
            {loading && <p className="mt-2 text-xs text-slate-400">検索中…</p>}
          </div>
        )}

        {/* Earned count */}
        <p className="mb-3 text-sm font-bold text-white">
          獲得数 {earnedCount} / {TITLES.length}
        </p>

        {/* Titles list */}
        <div className="space-y-2">
          {TITLES.map((t) => {
            const earned = score >= t.threshold;
            const diff = t.threshold - score;
            return (
              <div
                key={t.name}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  earned
                    ? 'border-amber-400/30 bg-amber-400/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      earned
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        earned ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {earned ? t.name : '？？？'}
                    </p>
                    <p
                      className={`text-xs ${
                        earned ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      {earned ? `${t.threshold} pt` : `あと ${diff} ptで獲得`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
