import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Trophy, Medal } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
  formatValue: (value: number) => string;
  accentColor: string;
}

export default function LeaderboardPodium({ entries, formatValue, accentColor }: LeaderboardPodiumProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate podium appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim1, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim2, {
        toValue: 0,
        delay: 100,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim3, {
        toValue: 0,
        delay: 200,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (entries.length < 3) {
    return null;
  }

  const [first, second, third] = entries.slice(0, 3);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Top Performers</Text>
      <View style={styles.podium}>
        {/* 2nd Place (Left) */}
        <Animated.View
          style={[
            styles.podiumItem,
            styles.secondPlace,
            { transform: [{ translateY: slideAnim2 }] },
          ]}
        >
          <View style={[styles.medalContainer, styles.silverMedal]}>
            <Medal size={32} color="#C0C0C0" strokeWidth={2} fill="#E8E8E8" />
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNumber}>2</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {second.display_name}
          </Text>
          <Text style={styles.value}>{formatValue(second.value)}</Text>
          <View style={[styles.podiumBase, styles.silverBase]} />
        </Animated.View>

        {/* 1st Place (Center) */}
        <Animated.View
          style={[
            styles.podiumItem,
            styles.firstPlace,
            { transform: [{ translateY: slideAnim1 }] },
          ]}
        >
          <View style={[styles.medalContainer, styles.goldMedal]}>
            <Trophy size={40} color="#FFD700" strokeWidth={2.5} fill="#FFF9C4" />
          </View>
          <View style={[styles.rankBadge, styles.goldBadge]}>
            <Text style={[styles.rankNumber, styles.goldText]}>1</Text>
          </View>
          <Text style={[styles.name, styles.firstName]} numberOfLines={1}>
            {first.display_name}
          </Text>
          <Text style={[styles.value, styles.firstValue]}>{formatValue(first.value)}</Text>
          <View style={[styles.podiumBase, styles.goldBase]} />
        </Animated.View>

        {/* 3rd Place (Right) */}
        <Animated.View
          style={[
            styles.podiumItem,
            styles.thirdPlace,
            { transform: [{ translateY: slideAnim3 }] },
          ]}
        >
          <View style={[styles.medalContainer, styles.bronzeMedal]}>
            <Medal size={32} color="#CD7F32" strokeWidth={2} fill="#E6C19A" />
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNumber}>3</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {third.display_name}
          </Text>
          <Text style={styles.value}>{formatValue(third.value)}</Text>
          <View style={[styles.podiumBase, styles.bronzeBase]} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  firstPlace: {
    zIndex: 3,
  },
  secondPlace: {
    zIndex: 2,
  },
  thirdPlace: {
    zIndex: 1,
  },
  medalContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  goldMedal: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  silverMedal: {
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  bronzeMedal: {
    backgroundColor: '#E6C19A',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  goldText: {
    color: COLORS.textPrimary,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    maxWidth: '100%',
  },
  firstName: {
    fontSize: 16,
    fontWeight: '700',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  firstValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  podiumBase: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  goldBase: {
    backgroundColor: '#FFD700',
    height: 12,
  },
  silverBase: {
    backgroundColor: '#C0C0C0',
    height: 10,
  },
  bronzeBase: {
    backgroundColor: '#CD7F32',
    height: 8,
  },
});

