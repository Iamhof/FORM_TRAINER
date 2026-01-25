import React from 'react';
import { BarChart3 } from 'lucide-react-native';
import ComingSoonScreen from '@/components/ComingSoonScreen';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnalyticsScreen() {
  const { accent } = useTheme();

  return (
    <ComingSoonScreen
      feature="Advanced Analytics"
      description="View detailed statistics about your training progress, volume trends, and strength progression over time."
      icon={<BarChart3 size={64} color={accent} strokeWidth={1.5} />}
      eta="Version 1.1"
    />
  );
}
