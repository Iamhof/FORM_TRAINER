import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { COLORS, SPACING } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Terms of Service',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.text}>
              Welcome to OJ | Form ("we," "our," or "us"). These Terms of Service ("Terms") 
              govern your use of our mobile application and services. By accessing or using 
              OJ | Form, you agree to be bound by these Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
            <Text style={styles.text}>
              By creating an account or using our services, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms. If you do not agree to these Terms, 
              you may not use our services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Description of Service</Text>
            <Text style={styles.text}>
              OJ | Form is a fitness and workout tracking application that allows users to:
            </Text>
            <Text style={styles.bulletPoint}>• Create and manage workout programmes</Text>
            <Text style={styles.bulletPoint}>• Track exercise sessions and progress</Text>
            <Text style={styles.bulletPoint}>• Monitor body metrics and analytics</Text>
            <Text style={styles.bulletPoint}>• Connect with personal trainers</Text>
            <Text style={styles.bulletPoint}>• Participate in leaderboards</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Accounts</Text>
            <Text style={styles.text}>
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to notify us immediately of any unauthorized use of your account. We reserve 
              the right to suspend or terminate accounts that violate these Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. User Conduct</Text>
            <Text style={styles.text}>
              You agree not to:
            </Text>
            <Text style={styles.bulletPoint}>• Use the service for any illegal purpose</Text>
            <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
            <Text style={styles.bulletPoint}>• Interfere with or disrupt the service</Text>
            <Text style={styles.bulletPoint}>• Share false or misleading information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
            <Text style={styles.text}>
              All content, features, and functionality of OJ | Form are owned by us and are 
              protected by copyright, trademark, and other intellectual property laws. You may not 
              reproduce, distribute, or create derivative works without our permission.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.text}>
              OJ | Form is provided "as is" without warranties of any kind. We are not liable for 
              any injuries or health issues that may result from using our app. Always consult with 
              a healthcare professional before beginning any exercise program.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Termination</Text>
            <Text style={styles.text}>
              We may terminate or suspend your account at any time for violations of these Terms. 
              You may also delete your account at any time through the app settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
            <Text style={styles.text}>
              We reserve the right to modify these Terms at any time. We will notify users of 
              significant changes. Continued use of the service after changes constitutes acceptance 
              of the new Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Contact Information</Text>
            <Text style={styles.text}>
              If you have questions about these Terms, please contact us at:
            </Text>
            <Text style={styles.contact}>Email: support@yourapp.com</Text>
            <Text style={styles.contact}>Website: https://yourapp.com</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Governing Law</Text>
            <Text style={styles.text}>
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be 
              resolved in the courts of [Your Jurisdiction].
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  contact: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});

