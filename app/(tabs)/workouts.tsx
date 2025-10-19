import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react-native';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import { COLORS, SPACING, TYPOGRAPHY, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';

export default function WorkoutsScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { programmes, deleteProgramme, getProgrammeProgress } = useProgrammes();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      console.log('[Workouts] Starting deletion for programme:', confirmDelete.id, confirmDelete.name);
      setDeletingId(confirmDelete.id);
      await deleteProgramme(confirmDelete.id);
      console.log('[Workouts] Programme deleted successfully');
      setConfirmDelete(null);
    } catch (error) {
      console.error('[Workouts] Error deleting programme:', error);
      alert(`Failed to delete programme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
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
              {programmes.map((programme) => {
                const progress = getProgrammeProgress(programme.id);
                const isCompleted = progress.percentage === 100;

                const handleDeletePress = () => {
                  setConfirmDelete({ id: programme.id, name: programme.name });
                };

                return (
                  <Pressable
                    key={programme.id}
                    onPress={() => router.push(`/programme/${programme.id}` as any)}
                    disabled={deletingId === programme.id}
                  >
                    <Card style={styles.programmeCard}>
                      <View style={styles.programmeHeader}>
                        <View style={styles.programmeTitleRow}>
                          <Text style={styles.programmeName}>{programme.name}</Text>
                          {isCompleted && (
                            <View style={[styles.completedBadge, { backgroundColor: `${accent}20` }]}>
                              <CheckCircle2 size={12} color={accent} strokeWidth={2.5} />
                              <Text style={[styles.completedBadgeText, { color: accent }]}>Completed</Text>
                            </View>
                          )}
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeletePress();
                          }}
                          hitSlop={8}
                          style={styles.deleteButton}
                        >
                          <Trash2 size={18} color={COLORS.textSecondary} strokeWidth={2} />
                        </Pressable>
                      </View>
                      <Text style={styles.programmeDetails}>
                        {programme.days} days per week • {programme.weeks} weeks
                      </Text>

                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Progress</Text>
                          <Text style={[styles.progressValue, { color: accent }]}>
                            {progress.completed} / {progress.total} sessions • {progress.percentage}%
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                backgroundColor: accent,
                                width: `${progress.percentage}%`,
                              }
                            ]} 
                          />
                        </View>
                      </View>

                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Total Exercises</Text>
                          <Text style={styles.statValue}>{programme.exercises?.length || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Duration</Text>
                          <Text style={styles.statValue}>{programme.weeks} weeks</Text>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <ConfirmModal
          visible={confirmDelete !== null}
          title="Delete Programme"
          message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.` : ''}
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.sm,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  programmeTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  deleteButton: {
    padding: SPACING.xs,
    marginTop: -4,
    marginRight: -4,
  },
  programmeName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadgeText: {
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
