import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import Card from '@/components/Card';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import type { LeaderboardType, GenderFilter } from '@/types/leaderboard';

type TabOption = { value: LeaderboardType; label: string };
type GenderOption = { value: GenderFilter; label: string };

const TABS: TabOption[] = [
  { value: 'total_volume', label: 'Total Volume' },
  { value: 'monthly_volume', label: 'Monthly Volume' },
  { value: 'total_sessions', label: 'Total Sessions' },
  { value: 'monthly_sessions', label: 'Monthly Sessions' },
];

const GENDER_FILTERS: GenderOption[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
];

export default function LeaderboardScreen() {
  const { accent } = useTheme();
  const {
    profile,
    rankings,
    myRank,
    isLoading,
    selectedType,
    setSelectedType,
    selectedGender,
    setSelectedGender,
  } = useLeaderboard();
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;

  const formatValue = (value: number) => {
    if (selectedType.includes('volume')) {
      return `${value.toLocaleString()} kg`;
    }
    return `${value} sessions`;
  };

  if (!profile?.is_opted_in) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.optInContainer}>
            <View style={[styles.optInIcon, { backgroundColor: `${accent}20` }]}>
              <Trophy size={48} color={accent} strokeWidth={2} />
            </View>
            <Text style={styles.optInTitle}>Join the Leaderboard</Text>
            <Text style={styles.optInDescription}>
              Compete with other athletes, track your progress, and climb the rankings!
              Your data will be displayed with a custom name to protect your privacy.
            </Text>
            <Pressable
              style={[styles.optInButton, { backgroundColor: accent }]}
              onPress={() => router.push('/leaderboard/opt-in' as any)}
            >
              <Text style={styles.optInButtonText}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.subtitle}>Compete and climb the ranks</Text>
          </View>
          <Pressable
            style={[styles.settingsButton, { backgroundColor: `${accent}20` }]}
            onPress={() => router.push('/leaderboard/settings' as any)}
          >
            <Settings size={20} color={accent} strokeWidth={2} />
          </Pressable>
        </View>

        {myRank && (
          <Card style={[styles.myRankCard, { borderColor: accent, borderWidth: 2 }]}>
            <View style={styles.myRankContent}>
              <View>
                <Text style={styles.myRankLabel}>Your Rank</Text>
                <Text style={[styles.myRankValue, { color: accent }]}>#{myRank.rank}</Text>
              </View>
              <View style={styles.myRankStats}>
                <Text style={styles.myRankStatValue}>{formatValue(myRank.value)}</Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {TABS.map((tab) => (
              <Pressable
                key={tab.value}
                style={[
                  styles.tab,
                  selectedType === tab.value && { backgroundColor: accent },
                ]}
                onPress={() => setSelectedType(tab.value)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedType === tab.value && { color: COLORS.textPrimary, fontWeight: '600' },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {(selectedType === 'total_volume' || selectedType === 'monthly_volume') && (
            <View style={styles.genderFilter}>
              {GENDER_FILTERS.map((filter) => (
                <Pressable
                  key={filter.value}
                  style={[
                    styles.genderButton,
                    selectedGender === filter.value && { backgroundColor: accent },
                  ]}
                  onPress={() => setSelectedGender(filter.value)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      selectedGender === filter.value && { color: COLORS.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
            showsVerticalScrollIndicator={false}
          >
            {rankings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Trophy size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Rankings Yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to compete! Start logging workouts to appear on the leaderboard.
                </Text>
              </View>
            ) : (
              rankings.map((entry) => (
                <Card
                  key={entry.user_id}
                  style={[
                    styles.rankCard,
                    entry.is_current_user && { borderColor: accent, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.rankContent}>
                    <View style={styles.rankLeft}>
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: entry.rank <= 3 ? accent : COLORS.cardBorder },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankNumber,
                            { color: entry.rank <= 3 ? COLORS.textPrimary : COLORS.textSecondary },
                          ]}
                        >
                          #{entry.rank}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.displayName,
                          entry.is_current_user && { fontWeight: '700', color: accent },
                        ]}
                      >
                        {entry.display_name}
                        {entry.is_current_user && ' (You)'}
                      </Text>
                    </View>
                    <Text style={styles.rankValue}>{formatValue(entry.value)}</Text>
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  optInIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  optInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  optInDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  optInButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl * 2,
    borderRadius: 12,
  },
  optInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  myRankCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
  },
  myRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myRankLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  myRankValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  myRankStats: {
    alignItems: 'flex-end',
  },
  myRankStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  tabsScroll: {
    marginBottom: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.cardBackground,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  genderFilter: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  genderButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },
  rankCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
