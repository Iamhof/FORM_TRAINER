import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, TrendingUp, Calendar, Dumbbell } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { useProgrammes } from '@/contexts/ProgrammeContext';

export default function PTClientDetailScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const clientId = id as string;
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { programmes } = useProgrammes();
  const clientsQuery = trpc.pt.listClients.useQuery();
  const analyticsQuery = trpc.pt.getClientAnalytics.useQuery({ clientId });
  const workoutsQuery = trpc.pt.getClientWorkouts.useQuery({ clientId });
  const shareProgrammeMutation = trpc.pt.shareProgramme.useMutation();
  const unshareProgrammeMutation = trpc.pt.unshareProgramme.useMutation();

  const client = clientsQuery.data?.find((c) => c.id === clientId);
  const analytics = analyticsQuery.data || [];
  const workouts = workoutsQuery.data || [];

  const exerciseIds = [...new Set(analytics.map((a) => a.exerciseId))];
  const selectedAnalytics = selectedExercise
    ? analytics.filter((a) => a.exerciseId === selectedExercise)
    : analytics.slice(0, 10);

  const chartData = selectedAnalytics.map((a) => ({
    month: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: a.maxWeight,
  }));

  const handleShareProgramme = (programmeId: string, programmeName: string) => {
    Alert.alert(
      'Share Programme',
      `Share "${programmeName}" with ${client?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              await shareProgrammeMutation.mutateAsync({ programmeId, clientId });
              Alert.alert('Success', 'Programme shared successfully');
              clientsQuery.refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to share programme');
            }
          },
        },
      ]
    );
  };

  const handleUnshareProgramme = (sharedProgrammeId: string, programmeName: string) => {
    Alert.alert(
      'Unshare Programme',
      `Remove "${programmeName}" from ${client?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unshare',
          style: 'destructive',
          onPress: async () => {
            try {
              await unshareProgrammeMutation.mutateAsync({ sharedProgrammeId });
              Alert.alert('Success', 'Programme unshared successfully');
              clientsQuery.refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unshare programme');
            }
          },
        },
      ]
    );
  };

  if (!client) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={COLORS.textPrimary} strokeWidth={2} />
            </Pressable>
            <Text style={styles.title}>Client Not Found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={styles.title}>{client.name}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.clientCard}>
            <View style={[styles.clientAvatar, { backgroundColor: `${accent}30` }]}>
              <Text style={[styles.clientInitial, { color: accent }]}>
                {client.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientEmail}>{client.email}</Text>
            <View style={styles.clientStats}>
              <View style={styles.clientStat}>
                <Text style={styles.clientStatValue}>{workouts.length}</Text>
                <Text style={styles.clientStatLabel}>Workouts</Text>
              </View>
              <View style={styles.clientStat}>
                <Text style={styles.clientStatValue}>{client.sharedProgrammes}</Text>
                <Text style={styles.clientStatLabel}>Programmes</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={20} color={accent} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Progress Analytics</Text>
              </View>
            </View>

            {analytics.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No analytics data yet</Text>
              </Card>
            ) : (
              <>
                {exerciseIds.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.exerciseScroll}
                    contentContainerStyle={styles.exerciseScrollContent}
                  >
                    <Pressable
                      style={[
                        styles.exerciseChip,
                        !selectedExercise && { backgroundColor: accent },
                      ]}
                      onPress={() => setSelectedExercise(null)}
                    >
                      <Text
                        style={[
                          styles.exerciseChipText,
                          !selectedExercise && { color: COLORS.background },
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>
                    {exerciseIds.map((exerciseId) => (
                      <Pressable
                        key={exerciseId}
                        style={[
                          styles.exerciseChip,
                          selectedExercise === exerciseId && { backgroundColor: accent },
                        ]}
                        onPress={() => setSelectedExercise(exerciseId)}
                      >
                        <Text
                          style={[
                            styles.exerciseChipText,
                            selectedExercise === exerciseId && { color: COLORS.background },
                          ]}
                        >
                          {exerciseId}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <Card style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Max Weight Progress</Text>
                  <LineChart data={chartData} color={accent} height={200} />
                </Card>
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Calendar size={20} color={accent} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Recent Workouts</Text>
              </View>
            </View>

            {workouts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No workouts logged yet</Text>
              </Card>
            ) : (
              workouts.slice(0, 5).map((workout) => (
                <Card key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{workout.programmeName}</Text>
                    <Text style={styles.workoutDate}>
                      {new Date(workout.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.workoutMeta}>
                    Day {workout.day} • Week {workout.week} • {workout.exercises.length} exercises
                  </Text>
                </Card>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Dumbbell size={20} color={accent} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Share Programmes</Text>
              </View>
            </View>

            {programmes.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No programmes available to share</Text>
              </Card>
            ) : (
              programmes.map((programme) => {
                const sharedProgramme = client.sharedProgrammeIds?.find((sp: any) => sp.programmeId === programme.id);
                const isShared = !!sharedProgramme;
                return (
                  <Card key={programme.id} style={styles.programmeCard}>
                    <View style={styles.programmeContent}>
                      <View style={styles.programmeInfo}>
                        <Text style={styles.programmeName}>{programme.name}</Text>
                        <Text style={styles.programmeMeta}>
                          {programme.days} days • {programme.weeks} weeks
                        </Text>
                      </View>
                      <Pressable
                        style={[
                          styles.shareButton,
                          isShared
                            ? { backgroundColor: COLORS.cardBorder }
                            : { backgroundColor: accent },
                        ]}
                        onPress={() =>
                          isShared
                            ? handleUnshareProgramme(sharedProgramme.id, programme.name)
                            : handleShareProgramme(programme.id, programme.name)
                        }
                      >
                        <Share2
                          size={18}
                          color={isShared ? COLORS.textSecondary : COLORS.background}
                          strokeWidth={2}
                        />
                        <Text
                          style={[
                            styles.shareButtonText,
                            isShared
                              ? { color: COLORS.textSecondary }
                              : { color: COLORS.background },
                          ]}
                        >
                          {isShared ? 'Unshare' : 'Share'}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  clientCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  clientInitial: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  clientEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  clientStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  clientStat: {
    alignItems: 'center',
  },
  clientStatValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  clientStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
  },
  exerciseScroll: {
    marginBottom: SPACING.md,
  },
  exerciseScrollContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  exerciseChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  exerciseChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  chartCard: {
    padding: SPACING.lg,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  workoutCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  workoutDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  programmeCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  programmeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programmeInfo: {
    flex: 1,
  },
  programmeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  programmeMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
