export type Title = {
  name: string;
  threshold: number;
};

export const TITLES: Title[] = [
  { name: '見習いカメラマン', threshold: 0 },
  { name: '駆け出しフォトグラファー', threshold: 10 },
  { name: '一人前の撮影家', threshold: 110 },
  { name: 'ベテランパシャリスト', threshold: 240 },
  { name: 'カリスマパシャリスト', threshold: 550 },
  { name: 'パシャの達人', threshold: 830 },
  { name: '伝説のパシャリスト', threshold: 1200 },
];

export function getTitleForScore(score: number): Title {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (score >= t.threshold) current = t;
  }
  return current;
}

export function getNextTitle(score: number): Title | null {
  for (const t of TITLES) {
    if (score < t.threshold) return t;
  }
  return null;
}
