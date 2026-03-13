import { Stack, useRouter } from 'expo-router';
import {
  Check,
  Crown,
  Dumbbell,
  BarChart3,
  Trophy,
  Zap,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';

import type { PurchasesPackage } from 'react-native-purchases';

type FeatureItem = {
  icon: typeof Dumbbell;
  title: string;
  free: boolean;
  premium: boolean;
};

const FEATURES: FeatureItem[] = [
  { icon: Dumbbell, title: '1 Training Programme', free: true, premium: true },
  { icon: Zap, title: 'Exercise Library (100+)', free: true, premium: true },
  { icon: Dumbbell, title: 'Workout Logging', free: true, premium: true },
  { icon: Crown, title: 'Unlimited Programmes', free: false, premium: true },
  { icon: BarChart3, title: 'Advanced Analytics', free: false, premium: true },
  { icon: Trophy, title: 'Global Leaderboard', free: false, premium: true },
];

export default function PaywallScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { offerings, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'annual'>('annual');

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.monthly;
  const annualPackage = currentOffering?.annual;

  const getSelectedPkg = (): PurchasesPackage | null | undefined => {
    return selectedPackage === 'annual' ? annualPackage : monthlyPackage;
  };

  const getSavingsPercent = (): number => {
    if (!monthlyPackage || !annualPackage) return 0;
    const monthlyAnnualized = monthlyPackage.product.price * 12;
    const annualPrice = annualPackage.product.price;
    return Math.round(((monthlyAnnualized - annualPrice) / monthlyAnnualized) * 100);
  };

  const handlePurchase = async () => {
    const pkg = getSelectedPkg();
    if (!pkg) {
      Alert.alert('Error', 'No subscription package available. Please try again later.');
      return;
    }

    const result = await purchase(pkg);
    if (result.success) {
      router.back();
    } else if (!result.cancelled && result.error) {
      Alert.alert('Purchase Failed', result.error);
    }
  };

  const handleRestore = async () => {
    const result = await restore();
    if (result.isPremium) {
      router.back();
    }
  };

  const savingsPercent = getSavingsPercent();
  const isBusy = isPurchasing || isRestoring;

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.crownBadge, { backgroundColor: `${accent}20` }]}>
              <Crown size={32} color={accent} strokeWidth={2} />
            </View>
            <Text style={styles.heroTitle}>Upgrade to Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock unlimited programmes and premium features
            </Text>
          </View>

          {/* Feature Comparison */}
          <Card style={styles.featuresCard}>
            <View style={styles.featureHeader}>
              <Text style={[styles.featureHeaderText, { flex: 1 }]}>Feature</Text>
              <Text style={[styles.featureHeaderText, styles.featureCol]}>Free</Text>
              <Text style={[styles.featureHeaderText, styles.featureCol, { color: accent }]}>
                Pro
              </Text>
            </View>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureLabel}>
                  <feature.icon size={16} color={COLORS.textSecondary} strokeWidth={2} />
                  <Text style={styles.featureText}>{feature.title}</Text>
                </View>
                <View style={styles.featureCol}>
                  {feature.free ? (
                    <Check size={18} color={COLORS.success} strokeWidth={2.5} />
                  ) : (
                    <X size={18} color={COLORS.textTertiary} strokeWidth={2} />
                  )}
                </View>
                <View style={styles.featureCol}>
                  <Check size={18} color={accent} strokeWidth={2.5} />
                </View>
              </View>
            ))}
          </Card>

          {/* Plan Selection */}
          {currentOffering && (
            <View style={styles.plans}>
              {annualPackage && (
                <Pressable
                  onPress={() => setSelectedPackage('annual')}
                  disabled={isBusy}
                >
                  <Card
                    style={{
                      ...styles.planCard,
                      ...(selectedPackage === 'annual' ? {
                        borderColor: accent,
                        borderWidth: 2,
                      } : {}),
                    }}
                  >
                    {savingsPercent > 0 && (
                      <View style={[styles.saveBadge, { backgroundColor: accent }]}>
                        <Text style={styles.saveBadgeText}>
                          Save {savingsPercent}%
                        </Text>
                      </View>
                    )}
                    <Text style={styles.planName}>Annual</Text>
                    <Text style={styles.planPrice}>
                      {annualPackage.product.priceString}
                      <Text style={styles.planPeriod}>/year</Text>
                    </Text>
                  </Card>
                </Pressable>
              )}
              {monthlyPackage && (
                <Pressable
                  onPress={() => setSelectedPackage('monthly')}
                  disabled={isBusy}
                >
                  <Card
                    style={{
                      ...styles.planCard,
                      ...(selectedPackage === 'monthly' ? {
                        borderColor: accent,
                        borderWidth: 2,
                      } : {}),
                    }}
                  >
                    <Text style={styles.planName}>Monthly</Text>
                    <Text style={styles.planPrice}>
                      {monthlyPackage.product.priceString}
                      <Text style={styles.planPeriod}>/month</Text>
                    </Text>
                  </Card>
                </Pressable>
              )}
            </View>
          )}

          {/* No offerings fallback */}
          {!currentOffering && (
            <Card style={styles.noOfferingsCard}>
              <Text style={styles.noOfferingsText}>
                Subscription plans are loading. Please try again in a moment.
              </Text>
            </Card>
          )}

          {/* Purchase Button */}
          <Pressable
            style={[styles.purchaseButton, { backgroundColor: accent }, isBusy && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isBusy || !currentOffering}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isBusy}
          >
            {isRestoring ? (
              <ActivityIndicator color={COLORS.textSecondary} size="small" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </Pressable>

          {/* Legal */}
          <Text style={styles.legalText}>
            Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscription automatically renews unless cancelled at least 24 hours before the
            end of the current period. You can manage and cancel your subscriptions in your
            App Store account settings.
          </Text>

          <View style={styles.legalLinks}>
            <Pressable onPress={() => router.push('/legal/terms')}>
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>|</Text>
            <Pressable onPress={() => router.push('/legal/privacy')}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  crownBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
  },
  featureHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  featureCol: {
    width: 50,
    alignItems: 'center',
  },
  plans: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  planCard: {
    padding: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  saveBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  noOfferingsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  noOfferingsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  purchaseButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  restoreButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  restoreButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  legalLinkText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
