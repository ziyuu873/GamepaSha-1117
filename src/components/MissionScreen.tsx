import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  Trophy,
  ExternalLink,
  ChevronLeft,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Repeat,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Mission } from '@/lib/supabase';
import {
  supabase,
  getStoredPlayerNumber,
  storePlayerNumber,
  type SubmitResult,
} from '@/lib/supabase';
import { TITLES, getTitleForScore, getNextTitle } from '@/lib/titles';
import type { Screen } from '@/App';

const FORM_COOLDOWN_SECONDS = 20;

type Props = {
  mission: Mission;
  onNavigate: (screen: Screen) => void;
};

type Phase = 'intro' | 'form' | 'submitting' | 'done' | 'error';

export default function MissionScreen({ mission, onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [playerNumberInput, setPlayerNumberInput] = useState<string>('');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const formOpenedAtRef = useRef<number | null>(null);

  const storedNumber = getStoredPlayerNumber();
  const unlimited = mission.max_per_day === null;
  const limitLabel = unlimited ? '何回でも投稿OK' : '1日1回まで';
  const hasFormUrl = !!mission.form_url;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const openForm = () => {
    if (mission.form_url) {
      window.open(mission.form_url, '_blank', 'noopener,noreferrer');
      if (formOpenedAtRef.current === null) {
        formOpenedAtRef.current = Date.now();
        setCooldown(FORM_COOLDOWN_SECONDS);
      }
    }
    setPhase('form');
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    setErrorMsg('');

    const knownNumber = storedNumber ?? (playerNumberInput.trim() ? parseInt(playerNumberInput.trim(), 10) : null);
    const parsedNumber = Number.isNaN(knownNumber as number) ? null : knownNumber;

    try {
      const { data, error } = await supabase.rpc('submit_mission', {
        p_mission_id: mission.id,
        p_player_number: parsedNumber,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('DAILY_LIMIT_REACHED')) {
          throw new Error('このミッションは今日すでに投稿済みです（1日1回まで）');
        }
        if (msg.includes('プレイヤー番号')) {
          throw new Error('入力されたプレイヤー番号が見つかりませんでした');
        }
        throw new Error('うまく記録できませんでした。しばらくしてからもう一度お試しください');
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('サーバーから応答がありませんでした');
      }

      const res: SubmitResult = Array.isArray(data) ? data[0] : data;
      storePlayerNumber(res.player_number);
      setResult(res);
      setPhase('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'エラーが発生しました');
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
          aria-label="戻る"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
          ミッション
        </span>
        <button
          onClick={() => onNavigate('home')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="px-5 pb-10">
        {/* Visual */}
        <div className="relative mb-6 flex h-48 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-400 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-orange-500 blur-3xl" />
          </div>
          <Camera className="h-20 w-20 text-amber-400/80" />
        </div>

        {/* Title & description */}
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          {mission.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {mission.description}
        </p>

        {/* Reward & limit badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-300">
            <Trophy className="h-3.5 w-3.5" />
            {mission.reward_points} pt
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
              unlimited
                ? 'bg-emerald-400/15 text-emerald-300'
                : 'bg-sky-400/15 text-sky-300'
            }`}
          >
            {unlimited ? (
              <Repeat className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {limitLabel}
          </span>
        </div>

        {/* Phases */}
        {phase === 'intro' && (
          <IntroPhase onOpenForm={openForm} hasFormUrl={!!mission.form_url} onSkipForm={() => setPhase('form')} />
        )}

        {phase === 'form' && (
          <FormPhase
            mission={mission}
            storedNumber={storedNumber}
            playerNumberInput={playerNumberInput}
            setPlayerNumberInput={setPlayerNumberInput}
            onSubmit={handleSubmit}
            onOpenForm={openForm}
            hasFormUrl={hasFormUrl}
            cooldown={cooldown}
          />
        )}

        {phase === 'submitting' && <SubmittingPhase />}

        {phase === 'done' && result && (
          <DonePhase result={result} onNavigate={onNavigate} />
        )}

        {phase === 'error' && (
          <ErrorPhase
            message={errorMsg}
            onRetry={() => setPhase('form')}
            onHome={() => onNavigate('home')}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Sub-phases ---------- */

function IntroPhase({
  onOpenForm,
  hasFormUrl,
  onSkipForm,
}: {
  onOpenForm: () => void;
  hasFormUrl: boolean;
  onSkipForm: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <h2 className="mb-2 text-sm font-bold text-white">挑戦方法</h2>
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
              1
            </span>
            投稿フォームで写真をアップロードする
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
              2
            </span>
            投稿が終わったら「完了報告」をタップ
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
              3
            </span>
            ポイントが加算され、プレイヤー番号が発行されます
          </li>
        </ol>
      </div>

      {hasFormUrl ? (
        <button
          onClick={onOpenForm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 font-bold text-slate-900 shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Camera className="h-5 w-5" />
          写真を投稿する
          <ExternalLink className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={onSkipForm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 font-bold text-slate-900 shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Camera className="h-5 w-5" />
          ミッションを完了する
        </button>
      )}
    </div>
  );
}

function FormPhase({
  mission,
  storedNumber,
  playerNumberInput,
  setPlayerNumberInput,
  onSubmit,
  onOpenForm,
  hasFormUrl,
  cooldown,
}: {
  mission: Mission;
  storedNumber: number | null;
  playerNumberInput: string;
  setPlayerNumberInput: (v: string) => void;
  onSubmit: () => void;
  onOpenForm: () => void;
  hasFormUrl: boolean;
  cooldown: number;
}) {
  const canSubmit = cooldown <= 0;

  return (
    <div className="mt-6 space-y-4">
      {hasFormUrl && (
        <button
          onClick={onOpenForm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />
          投稿フォームをもう一度開く
        </button>
      )}

      {/* Player number */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <Hash className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">プレイヤー番号</h2>
        </div>

        {storedNumber !== null ? (
          <div className="rounded-xl bg-amber-400/10 p-3">
            <p className="text-xs text-slate-300">あなたの番号</p>
            <p className="text-2xl font-extrabold text-amber-300">
              #{storedNumber}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-300">
              以前発行された番号があれば入力してください。初めての場合は空欄のままでOKです（新しい番号が発行されます）。
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={playerNumberInput}
              onChange={(e) => setPlayerNumberInput(e.target.value)}
              placeholder="例: 1（空欄で新規発行）"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-lg transition active:scale-[0.98] ${
          canSubmit
            ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 shadow-emerald-500/20 hover:brightness-110'
            : 'cursor-not-allowed bg-white/10 text-slate-400 shadow-none'
        }`}
      >
        <CheckCircle2 className="h-5 w-5" />
        {canSubmit
          ? '完了報告してポイント獲得'
          : `あと${cooldown}秒`}
      </button>
    </div>
  );
}

function SubmittingPhase() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 py-10">
      <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      <p className="text-sm text-slate-300">記録しています…</p>
    </div>
  );
}

function DonePhase({
  result,
  onNavigate,
}: {
  result: SubmitResult;
  onNavigate: (screen: Screen) => void;
}) {
  const prevScore = result.total_score - result.awarded_points;
  const newScore = result.total_score;
  const newTitle = getTitleForScore(newScore);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-orange-500/10 p-6 text-center backdrop-blur">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
          <CheckCircle2 className="h-8 w-8 text-slate-900" />
        </div>
        <h2 className="text-xl font-extrabold text-white">ミッションクリア！</h2>
        <p className="mt-1 text-sm text-slate-300">{result.mission_title}</p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 text-lg font-extrabold text-amber-300">
          <Trophy className="h-5 w-5" />
          +{result.awarded_points} pt
        </div>

        {result.is_new_player ? (
          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-300">あなたのプレイヤー番号</p>
            <p className="mt-1 text-4xl font-extrabold text-amber-300">
              #{result.player_number}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              この番号をメモしておけば、次回以降も同じプレイヤーとして記録できます
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-300">プレイヤー番号</p>
            <p className="mt-1 text-3xl font-extrabold text-amber-300">
              #{result.player_number}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-slate-300">合計スコア</span>
          <span className="font-bold text-white">
            {newScore.toLocaleString()} pt
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm">
          <span className="text-slate-300">現在の称号</span>
          <span className="font-bold text-amber-300">{newTitle.name}</span>
        </div>

        <TitleGauge prevScore={prevScore} newScore={newScore} />
      </div>

      <button
        onClick={() => onNavigate('ranking')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 font-bold text-slate-900 shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-[0.98]"
      >
        <Trophy className="h-5 w-5" />
        ランキングを見る
      </button>
      <button
        onClick={() => onNavigate('home')}
        className="w-full rounded-2xl bg-white/10 py-3 font-bold text-white transition hover:bg-white/20 active:scale-[0.98]"
      >
        ホームに戻る
      </button>
    </div>
  );
}

function TitleGauge({/* ---------- Title gauge ---------- */

type GaugeSegment = {
  fromPct: number;
  toPct: number;
  fromScore: number;
  toScore: number;
  upper: number;
  unlockName: string | null;
};

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

function titleIndexOf(score: number): number {
  const t = getTitleForScore(score);
  const i = TITLES.findIndex((x) => x.name === t.name);
  return i < 0 ? 0 : i;
}

function pctInTitle(score: number, idx: number): number {
  const cur = TITLES[idx];
  const nxt = TITLES[idx + 1];
  if (!nxt) return 100;
  const range = nxt.threshold - cur.threshold;
  if (range <= 0) return 100;
  return clampPct(((score - cur.threshold) / range) * 100);
}

function buildSegments(prevScore: number, newScore: number): GaugeSegment[] {
  const segs: GaugeSegment[] = [];
  let idx = titleIndexOf(prevScore);
  const endIdx = titleIndexOf(newScore);
  let s = prevScore;

  while (idx < endIdx) {
    const nxt = TITLES[idx + 1];
    segs.push({
      fromPct: pctInTitle(s, idx),
      toPct: 100,
      fromScore: s,
      toScore: nxt.threshold,
      upper: nxt.threshold,
      unlockName: nxt.name,
    });
    s = nxt.threshold;
    idx += 1;
  }

  const nextTitle = TITLES[idx + 1];
  segs.push({
    fromPct: pctInTitle(s, idx),
    toPct: pctInTitle(newScore, idx),
    fromScore: s,
    toScore: newScore,
    upper: nextTitle ? nextTitle.threshold : TITLES[idx].threshold,
    unlockName: null,
  });

  return segs;
}

function TitleGauge({
  prevScore,
  newScore,
}: {
  prevScore: number;
  newScore: number;
}) {
  const segments = useMemo(
    () => buildSegments(prevScore, newScore),
    [prevScore, newScore]
  );

  const [pct, setPct] = useState<number>(segments[0].fromPct);
  const [shownScore, setShownScore] = useState<number>(prevScore);
  const [upper, setUpper] = useState<number>(segments[0].upper);
  const [celebrationName, setCelebrationName] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const newTitle = getTitleForScore(newScore);
  const isMaxTitle = newTitle.name === TITLES[TITLES.length - 1].name;
  const nextAfterNew = getNextTitle(newScore);

  useEffect(() => {
    if (isMaxTitle) return;

    let cancelled = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    setPct(segments[0].fromPct);
    setShownScore(prevScore);
    setUpper(segments[0].upper);
    setCelebrationName(null);
    setSettled(false);

    const runSegment = (i: number) => {
      const seg = segments[i];
      setUpper(seg.upper);
      const span = Math.max(0, seg.toPct - seg.fromPct);
      const duration = Math.max(500, 1500 * (span / 100));
      const start = performance.now();

      const step = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - start) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        setPct(seg.fromPct + (seg.toPct - seg.fromPct) * e);
        setShownScore(
          Math.round(seg.fromScore + (seg.toScore - seg.fromScore) * e)
        );
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          onSegmentEnd(i);
        }
      };
      raf = requestAnimationFrame(step);
    };

    const onSegmentEnd = (i: number) => {
      const seg = segments[i];
      setPct(seg.toPct);
      setShownScore(seg.toScore);

      if (seg.unlockName) {
        setCelebrationName(seg.unlockName);
        timer = setTimeout(() => {
          if (cancelled) return;
          setPct(0);
          runSegment(i + 1);
        }, 1000);
      } else {
        setSettled(true);
      }
    };

    runSegment(0);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [segments, prevScore, isMaxTitle]);

  if (isMaxTitle) {
    return (
      <div className="mt-5">
        <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/20 to-orange-500/20 p-4">
          <p className="flex items-center justify-center gap-2 text-base font-extrabold text-amber-300">
            <Sparkles className="h-5 w-5" />
            最高の称号に到達！
          </p>
          <p className="mt-1 text-sm text-amber-200">{newTitle.name}</p>
        </div>
      </div>
    );
  }

  const nextLabel = nextAfterNew
    ? `次の称号: ${nextAfterNew.name}(あと${nextAfterNew.threshold - newScore}pt)`
    : '';

  return (
    <div className="mt-5">
      {celebrationName && (
        <div className="mb-3 animate-title-pop">
          <div className="rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-400/25 to-orange-500/25 p-4 animate-title-glow">
            <p className="text-sm font-extrabold text-amber-300">称号を獲得！</p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {celebrationName}
            </p>
          </div>
        </div>
      )}

      <p className="mb-1.5 min-h-[1rem] text-xs text-slate-300">
        {settled ? nextLabel : '\u00A0'}
      </p>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        現在 {shownScore.toLocaleString()} pt / {upper.toLocaleString()} pt
      </p>
    </div>
  );
}

function ErrorPhase({
  message,
  onRetry,
  onHome,
}: {
  message: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-400/20">
          <AlertCircle className="h-7 w-7 text-red-300" />
        </div>
        <p className="text-sm font-bold text-red-200">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="w-full rounded-2xl bg-white/10 py-3 font-bold text-white transition hover:bg-white/20 active:scale-[0.98]"
      >
        もう一度試す
      </button>
      <button
        onClick={onHome}
        className="w-full rounded-2xl bg-white/5 py-3 font-bold text-slate-300 transition hover:bg-white/10 active:scale-[0.98]"
      >
        ホームに戻る
      </button>
    </div>
  );
}
