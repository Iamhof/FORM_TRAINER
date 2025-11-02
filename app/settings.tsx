import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Bell, Lock, HelpCircle, FileText, ChevronRight } from 'lucide-react-native';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { accent } = useTheme();

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <Card style={styles.menuCard}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                  <Bell size={20} color={accent} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Notifications</Text>
                  <Text style={styles.menuSubtitle}>Manage notification preferences</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Card style={styles.menuCard}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                  <Lock size={20} color={accent} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Privacy & Security</Text>
                  <Text style={styles.menuSubtitle}>Manage your data and security</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <Card style={styles.menuCard}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: `${accent}20` }]}>
                  <HelpCircle size={20} color={accent} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Help & Support</Text>
                  <Text style={styles.menuSubtitle}>Get help with the app</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </View>
            </Card>

            <Card style={styles.menuCard}>
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
            </Card>
          </View>

          <View style={styles.versionSection}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
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
  versionSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
