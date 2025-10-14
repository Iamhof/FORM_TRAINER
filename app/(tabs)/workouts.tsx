import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';

export default function WorkoutsScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { programmes } = useProgrammes();

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Programme</Text>
            <Pressable 
              style={[styles.addButton, { backgroundColor: accent }]}
              onPress={() => router.push('/create-programme')}
            >
              <Plus size={20} color={COLORS.background} strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Track your current training programme</Text>

          {programmes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Programmes Yet</Text>
              <Text style={styles.emptyText}>
                Create your first training programme to get started
              </Text>
              <Button
                title="Create Programme"
                onPress={() => router.push('/create-programme')}
                variant="primary"
                style={styles.createButton}
              />
            </Card>
          ) : (
            <View style={styles.programmeList}>
              {programmes.map((programme) => (
                <Pressable
                  key={programme.id}
                  onPress={() => router.push(`/programme/${programme.id}` as any)}
                >
                  <Card style={styles.programmeCard}>
                    <View style={styles.programmeHeader}>
                      <View style={styles.programmeTitleRow}>
                        <Text style={styles.programmeName}>{programme.name}</Text>
                        {programme.isActive && (
                          <View style={[styles.activeBadge, { backgroundColor: `${accent}30` }]}>
                            <Text style={[styles.activeBadgeText, { color: accent }]}>Active</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.programmeDetails}>
                      {programme.frequency} days per week • {programme.duration} weeks
                    </Text>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Programme Progress</Text>
                        <Text style={[styles.progressValue, { color: accent }]}>
                          Week {programme.progress.currentWeek} of {programme.duration}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(programme.progress.currentWeek / programme.duration) * 100}%`,
                              backgroundColor: accent,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>This Week</Text>
                        <Text style={styles.statValue}>
                          {programme.progress.completedSessions}/{programme.frequency} sessions
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Days</Text>
                        <Text style={styles.statValue}>{programme.days.length}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: SPACING.lg,
  },
  createButton: {
    minWidth: 200,
  },
  programmeList: {
    gap: SPACING.md,
  },
  programmeCard: {
    padding: SPACING.lg,
  },
  programmeHeader: {
    marginBottom: SPACING.xs,
  },
  programmeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  programmeName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  programmeDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
});
