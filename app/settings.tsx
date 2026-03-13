import { Stack, useRouter } from 'expo-router';
import { FileText, ChevronRight, Bug, Trash2 } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { narrowError } from '@/lib/error-utils';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc';

export default function SettingsScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { signout } = useUser();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  // Hidden debug menu: tap version text 5 times to reveal
  const [debugEnabled, setDebugEnabled] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const handleVersionTap = useCallback(() => {
    const now = Date.now();
    // Reset counter if more than 2 seconds between taps
    if (now - lastTapRef.current > 2000) {
      tapCountRef.current = 0;
    }
    lastTapRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setDebugEnabled(prev => !prev);
    }
  }, []);

  const handleShareLogs = useCallback(async () => {
    const logs = logger.getRecentLogsFormatted(100);
    if (!logs) {
      Alert.alert('No Logs', 'No recent log entries to share.');
      return;
    }
    try {
      await Share.share({
        message: `--- FORM Debug Logs ---\n${logs}`,
        title: 'FORM Debug Logs',
      });
    } catch {
      // User cancelled or share failed
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently erase all your data including workouts, programmes, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm you want to permanently delete your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccountMutation.mutateAsync();
                      await signout();
                    } catch (error) {
                      const err = narrowError(error);
                      Alert.alert('Error', err.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteAccountMutation, signout]);

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.textPrimary,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>

            <Card style={styles.menuCard}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  Alert.alert(
                    'Legal Documents',
                    'Choose a document to view',
                    [
                      {
                        text: 'Terms of Service',
                        onPress: () => router.push('/legal/terms'),
                      },
                      {
                        text: 'Privacy Policy',
                        onPress: () => router.push('/legal/privacy'),
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]
                  );
                }}
              >
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                    <FileText size={20} color={accent} strokeWidth={2} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Terms & Privacy</Text>
                    <Text style={styles.menuSubtitle}>View our terms and privacy policy</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                </View>
              </Pressable>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Card style={{ ...styles.menuCard, ...styles.dangerCard }}>
              <Pressable style={styles.menuItem} onPress={handleDeleteAccount}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Delete Account</Text>
                  <Text style={styles.menuSubtitle}>Permanently delete your account and all data</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </Pressable>
            </Card>
          </View>

          {/* Hidden debug section — revealed by tapping version text 5 times */}
          {debugEnabled && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Developer</Text>

              <Card style={styles.menuCard}>
                <Pressable style={styles.menuItem} onPress={handleShareLogs}>
                  <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                    <Bug size={20} color={accent} strokeWidth={2} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Share Debug Logs</Text>
                    <Text style={styles.menuSubtitle}>Export recent logs for troubleshooting</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                </Pressable>
              </Card>
            </View>
          )}

          <Pressable style={styles.versionSection} onPress={handleVersionTap}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </Pressable>
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
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
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
  versionSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
