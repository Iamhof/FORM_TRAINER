import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenState from '@/components/ScreenState';
import { UserCheck, Mail, Calendar, Dumbbell, ChevronRight, Clock4 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { logger } from '@/lib/logger';

export default function MyPTScreen() {
  const { accent } = useTheme();
  const router = useRouter();

  useEffect(() => {
    logger.debug('[MyPT] Component mounted');
    logger.debug('[MyPT] trpc object:', typeof trpc);
    logger.debug('[MyPT] trpc.clients:', typeof trpc?.clients);
  }, []);

  const ptQuery = trpc.clients.getMyPT.useQuery();
  const sharedProgrammesQuery = trpc.clients.listSharedProgrammes.useQuery();

  useEffect(() => {
    if (ptQuery.error) {
      logger.error('[MyPT] getMyPT error:', ptQuery.error);
    }
    if (sharedProgrammesQuery.error) {
      logger.error('[MyPT] listSharedProgrammes error:', sharedProgrammesQuery.error);
    }
  }, [ptQuery.error, sharedProgrammesQuery.error]);

  const pt = ptQuery.data;
  const sharedProgrammes = sharedProgrammesQuery.data || [];
  const connectedSince = pt?.connectedAt
    ? new Date(pt.connectedAt).toLocaleDateString()
    : null;
  const ptDisplayName = pt ? (pt.name || pt.email || 'Personal Trainer') : '';
  const ptEmail = pt?.email || 'No email available';
  const ptInitial = ptDisplayName.charAt(0).toUpperCase();

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header} accessibilityRole="header">
          <View style={styles.titleRow}>
            <UserCheck
              size={28}
              color={accent}
              strokeWidth={2.5}
              accessibilityRole="image"
              aria-label="Personal trainer icon"
            />
            <Text style={styles.title}>My Personal Trainer</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Personal trainer content"
        >
          {!pt ? (
            <ScreenState
              icon={<Clock4 size={28} color={accent} strokeWidth={2} />}
              title="No PT Assigned"
              description="You don't have a personal trainer yet. Ask your coach to send you an invitation to get started."
              actionLabel="View invites"
              onActionPress={() => router.push('/pt/clients' as any)}
              accentColor={accent}
              testID="pt-empty-state"
            />
          ) : (
            <>
              <Card style={styles.ptCard}>
                <View style={[styles.ptAvatar, { backgroundColor: `${accent}30` }]}>
                  <Text style={[styles.ptInitial, { color: accent }]}>
                    {ptInitial}
                  </Text>
                </View>
                <Text style={styles.ptName}>{ptDisplayName}</Text>
                <View style={styles.ptInfo}>
                  <Mail size={16} color={COLORS.textSecondary} strokeWidth={2} />
                  <Text style={styles.ptEmail}>{ptEmail}</Text>
                </View>
                <View style={styles.ptInfo}>
                  <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                  {connectedSince ? (
                    <Text style={styles.ptMeta}>
                      Connected since {connectedSince}
                    </Text>
                  ) : null}
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
                  <Card style={styles.emptyInnerCard}>
                    <ScreenState
                      icon={<Dumbbell size={24} color={accent} strokeWidth={2} />}
                      title="No Programmes Shared"
                      description="Once your trainer shares a programme, you'll see it listed here with quick navigation into each workout."
                      accentColor={accent}
                    />
                  </Card>
                ) : (
                  sharedProgrammes.map((programme) => (
                    <Pressable
                      key={programme.id}
                      onPress={() =>
                        router.push(`/programme/${programme.programmeId}` as any)
                      }
                    >
                      <Card style={styles.programmeCard}>
                        <View style={styles.programmeContent}>
                          <View style={styles.programmeInfo}>
                            <Text style={styles.programmeName}>
                              {programme.programmeName}
                            </Text>
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
    backgroundColor: COLORS.background,
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
  emptyInnerCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});
