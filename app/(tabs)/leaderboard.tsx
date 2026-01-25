import React from 'react';
import { Trophy } from 'lucide-react-native';
import ComingSoonScreen from '@/components/ComingSoonScreen';
import { useTheme } from '@/contexts/ThemeContext';

export default function LeaderboardScreen() {
  const { accent } = useTheme();

  return (
    <ComingSoonScreen
      feature="Global Leaderboard"
      description="Compete with other users, track your rankings, and see how you stack up against the community."
      icon={<Trophy size={64} color={accent} strokeWidth={1.5} />}
      eta="Version 1.2"
    />
  );
}
