import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserCheck, Mail, Calendar, Dumbbell, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';

export default function MyPTScreen() {
  const { accent } = useTheme();
  const router = useRouter();

  const ptQuery = trpc.clients.getMyPT.useQuery();
  const sharedProgrammesQuery = trpc.clients.listSharedProgrammes.useQuery();

  const pt = ptQuery.data;
  const sharedProgrammes = sharedProgrammesQuery.data || [];

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <UserCheck size={28} color={accent} strokeWidth={2.5} />
            <Text style={styles.title}>My Personal Trainer</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!pt ? (
            <Card style={styles.emptyCard}>
              <View style={[styles.emptyIcon, { backgroundColor: `${accent}20` }]}>
                <UserCheck size={32} color={accent} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>No PT Assigned</Text>
              <Text style={styles.emptyText}>
                You don&apos;t have a personal trainer yet. Ask your PT to send you an invitation.
              </Text>
            </Card>
          ) : (
            <>
              <Card style={styles.ptCard}>
                <View style={[styles.ptAvatar, { backgroundColor: `${accent}30` }]}>
                  <Text style={[styles.ptInitial, { color: accent }]}>
                    {pt.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.ptName}>{pt.name}</Text>
                <View style={styles.ptInfo}>
                  <Mail size={16} color={COLORS.textSecondary} strokeWidth={2} />
                  <Text style={styles.ptEmail}>{pt.email}</Text>
                </View>
                <View style={styles.ptInfo}>
                  <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                  <Text style={styles.ptMeta}>
                    Connected since {new Date(pt.connectedAt).toLocaleDateString()}
                  </Text>
                </View>
              </Card>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Dumbbell size={20} color={accent} strokeWidth={2} />
                    <Text style={styles.sectionTitle}>Shared Programmes</Text>
                  </View>
                  <Text style={styles.sectionCount}>{sharedProgrammes.length}</Text>
                </View>

                {sharedProgrammes.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No programmes shared yet. Your PT will share training programmes with you.
                    </Text>
                  </Card>
                ) : (
                  sharedProgrammes.map((programme) => (
                    <Pressable
                      key={programme.id}
                      onPress={() => router.push(`/programme/${programme.id}` as any)}
                    >
                      <Card style={styles.programmeCard}>
                        <View style={styles.programmeContent}>
                          <View style={styles.programmeInfo}>
                            <Text style={styles.programmeName}>{programme.name}</Text>
                            <Text style={styles.programmeMeta}>
                              {programme.days} days • {programme.weeks} weeks
                            </Text>
                            <Text style={styles.programmeShared}>
                              Shared {new Date(programme.sharedAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                        </View>
                      </Card>
                    </Pressable>
                  ))
                )}
              </View>
            </>
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
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  ptCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  ptAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  ptInitial: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  ptName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  ptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  ptEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ptMeta: {
    fontSize: 13,
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
  sectionCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
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
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  programmeMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  programmeShared: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
