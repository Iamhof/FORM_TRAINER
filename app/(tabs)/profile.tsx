import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, UserCheck, Settings, LogOut, ChevronRight, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';


export default function ProfileScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { user, signout } = useUser();
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

  const isPT = user?.is_pt || false;

  const handleSignOut = async () => {
    await signout();
    router.replace('/auth');
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: `${accent}30` }]}>
              <Text style={[styles.avatarText, { color: accent }]}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
            {isPT && (
              <View style={[styles.badge, { backgroundColor: `${accent}20` }]}>
                <Text style={[styles.badgeText, { color: accent }]}>Personal Trainer</Text>
              </View>
            )}
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Pressable onPress={() => router.push('/edit-profile')}>
              <Card style={styles.menuCard}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                    <User size={20} color={accent} strokeWidth={2} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Edit Profile</Text>
                    <Text style={styles.menuSubtitle}>Update your name and theme color</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                </View>
              </Card>
            </Pressable>

            {isPT ? (
              <Pressable onPress={() => router.push('/pt/clients')}>
                <Card style={styles.menuCard}>
                  <View style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                      <Users size={20} color={accent} strokeWidth={2} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>My Clients</Text>
                      <Text style={styles.menuSubtitle}>Manage your clients and programmes</Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                  </View>
                </Card>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push('/client/my-pt')}>
                <Card style={styles.menuCard}>
                  <View style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                      <UserCheck size={20} color={accent} strokeWidth={2} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>My Personal Trainer</Text>
                      <Text style={styles.menuSubtitle}>View your PT and shared programmes</Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                  </View>
                </Card>
              </Pressable>
            )}

            <Card style={styles.menuCard}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                  <Settings size={20} color={accent} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Settings</Text>
                  <Text style={styles.menuSubtitle}>App preferences and account settings</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Pressable onPress={handleSignOut}>
              <Card style={styles.menuCard}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: `${COLORS.error}20` }]}>
                    <LogOut size={20} color={COLORS.error} strokeWidth={2} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: COLORS.error }]}>Sign Out</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  profileCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  menuCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
