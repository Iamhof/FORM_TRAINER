import React from 'react';
import { StyleSheet, Text, View, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { COLORS, SPACING } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
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
              This Privacy Policy explains how OJ | Form ("we," "our," or "us") collects, uses, 
              and protects your personal information when you use our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            
            <Text style={styles.subsectionTitle}>Account Information</Text>
            <Text style={styles.text}>
              When you create an account, we collect:
            </Text>
            <Text style={styles.bulletPoint}>• Email address</Text>
            <Text style={styles.bulletPoint}>• Name</Text>
            <Text style={styles.bulletPoint}>• Password (encrypted)</Text>

            <Text style={styles.subsectionTitle}>Workout Data</Text>
            <Text style={styles.text}>
              We collect and store:
            </Text>
            <Text style={styles.bulletPoint}>• Exercise programmes you create</Text>
            <Text style={styles.bulletPoint}>• Workout session logs</Text>
            <Text style={styles.bulletPoint}>• Sets, reps, and weights</Text>
            <Text style={styles.bulletPoint}>• Personal records</Text>

            <Text style={styles.subsectionTitle}>Body Metrics</Text>
            <Text style={styles.text}>
              If you choose to log body metrics, we store:
            </Text>
            <Text style={styles.bulletPoint}>• Weight</Text>
            <Text style={styles.bulletPoint}>• Body measurements</Text>
            <Text style={styles.bulletPoint}>• Progress photos (if uploaded)</Text>

            <Text style={styles.subsectionTitle}>Biometric Data</Text>
            <Text style={styles.text}>
              We use Face ID / Touch ID for secure authentication. This biometric data is stored 
              locally on your device and is never transmitted to our servers. We do not have 
              access to your biometric data.
            </Text>

            <Text style={styles.subsectionTitle}>Device Information</Text>
            <Text style={styles.text}>
              We may collect device information such as:
            </Text>
            <Text style={styles.bulletPoint}>• Device type and model</Text>
            <Text style={styles.bulletPoint}>• Operating system version</Text>
            <Text style={styles.bulletPoint}>• App version</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Information</Text>
            <Text style={styles.text}>
              We use your information to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide and improve our services</Text>
            <Text style={styles.bulletPoint}>• Personalize your experience</Text>
            <Text style={styles.bulletPoint}>• Generate analytics and progress reports</Text>
            <Text style={styles.bulletPoint}>• Enable personal trainer features</Text>
            <Text style={styles.bulletPoint}>• Maintain leaderboard functionality</Text>
            <Text style={styles.bulletPoint}>• Send important service updates</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Storage</Text>
            <Text style={styles.text}>
              Your data is stored securely using Supabase, a third-party cloud database service. 
              Supabase provides:
            </Text>
            <Text style={styles.bulletPoint}>• Encrypted data transmission (SSL/TLS)</Text>
            <Text style={styles.bulletPoint}>• Encrypted data at rest</Text>
            <Text style={styles.bulletPoint}>• Row-level security policies</Text>
            <Text style={styles.bulletPoint}>• Regular security audits</Text>
            <Text style={styles.text}>
              For more information about Supabase's security practices, visit:{' '}
              <Text 
                style={styles.link}
                onPress={() => Linking.openURL('https://supabase.com/security')}
              >
                https://supabase.com/security
              </Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
            <Text style={styles.text}>
              We use the following third-party services:
            </Text>
            <Text style={styles.bulletPoint}>• Supabase: Database and authentication</Text>
            <Text style={styles.text}>
              These services have their own privacy policies. We recommend reviewing them.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Sharing</Text>
            <Text style={styles.text}>
              We do not sell your personal information. We may share data in the following 
              circumstances:
            </Text>
            <Text style={styles.bulletPoint}>• With personal trainers you connect with (only data you choose to share)</Text>
            <Text style={styles.bulletPoint}>• In anonymized form for leaderboards (if you opt in)</Text>
            <Text style={styles.bulletPoint}>• If required by law or legal process</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Your Rights</Text>
            <Text style={styles.text}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Access your personal data</Text>
            <Text style={styles.bulletPoint}>• Correct inaccurate data</Text>
            <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
            <Text style={styles.bulletPoint}>• Export your data</Text>
            <Text style={styles.bulletPoint}>• Opt out of data sharing</Text>
            <Text style={styles.text}>
              To exercise these rights, contact us at privacy@yourapp.com
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Security</Text>
            <Text style={styles.text}>
              We implement industry-standard security measures including:
            </Text>
            <Text style={styles.bulletPoint}>• Encrypted data transmission</Text>
            <Text style={styles.bulletPoint}>• Secure authentication</Text>
            <Text style={styles.bulletPoint}>• Regular security updates</Text>
            <Text style={styles.bulletPoint}>• Access controls and permissions</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
            <Text style={styles.text}>
              OJ | Form is not intended for users under the age of 13. We do not knowingly 
              collect personal information from children under 13. If you believe we have 
              collected information from a child under 13, please contact us immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.text}>
              We may update this Privacy Policy from time to time. We will notify you of 
              significant changes by updating the "Last Updated" date and, if necessary, 
              through in-app notifications.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.text}>
              If you have questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.contact}>Email: privacy@yourapp.com</Text>
            <Text style={styles.contact}>Website: https://yourapp.com</Text>
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
  link: {
    color: COLORS.accents.orange,
    textDecorationLine: 'underline',
  },
  contact: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});

