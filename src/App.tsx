import { useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import RankingScreen from '@/components/RankingScreen';
import MissionScreen from '@/components/MissionScreen';
import type { Mission } from '@/lib/supabase';

export type Screen = 'home' | 'ranking' | 'mission';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  const navigate = (next: Screen, mission?: Mission) => {
    if (mission) setActiveMission(mission);
    setScreen(next);
  };

  if (screen === 'ranking') return <RankingScreen onNavigate={navigate} />;
  if (screen === 'mission' && activeMission)
    return <MissionScreen mission={activeMission} onNavigate={navigate} />;
  return <HomeScreen onNavigate={navigate} />;
}
