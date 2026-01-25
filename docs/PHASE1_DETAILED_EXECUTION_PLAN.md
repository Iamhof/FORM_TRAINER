# Phase 1: Code Cleanup & Production Readiness - Detailed Execution Plan

## Overview

This document provides step-by-step instructions for executing Phase 1 of the App Store submission plan. Phase 1 focuses on code cleanup, implementing legal documents, and configuring production environment variables.

**Estimated Time:** 2-3 days
**Priority:** Critical - Must complete before building for production

---

## 1.1 Replace console.log with logger

### Step 1.1.1: Audit and Categorize console.log Usage

**Action:** Run comprehensive search to identify all console statements

**Command:**
```bash
cd rork-OJ-form-main
grep -r "console\.\(log\|error\|warn\|info\)" --include="*.ts" --include="*.tsx" . | wc -l
```

**Expected Result:** ~336 matches across 93 files

**Categorization:**

1. **Critical Production Files** (must fix):
   - `app/**/*.tsx` - 12 files
   - `contexts/*.tsx` - 5 files  
   - `backend/trpc/routes/**/*.ts` - 29 files
   - `components/*.tsx` - Check for any
   - `lib/*.ts` - Check for any

2. **Development/Debug Files** (can keep or remove):
   - `scripts/debug-env.js`
   - `scripts/diagnose.js`
   - Test files in `tests/`

**Action Items:**
1. Run the grep command above
2. Create a list of files to update
3. Prioritize: contexts → app screens → backend routes → components → lib files

---

### Step 1.1.2: Create Replacement Strategy Document

**File:** `rork-OJ-form-main/docs/console-replacement-strategy.md`

**Create this file with the following content:**

```markdown
# Console.log Replacement Strategy

## Mapping Rules:
- `console.log(...)` → `logger.debug(...)` (development only)
- `console.info(...)` → `logger.info(...)` (development only)
- `console.warn(...)` → `logger.warn(...)` (always logs)
- `console.error(...)` → `logger.error(...)` (always logs)

## Context-Specific Rules:
- Error handling: Use `logger.error()`
- Debug information: Use `logger.debug()`
- Important info: Use `logger.info()`
- Warnings: Use `logger.warn()`

## Files to Skip:
- `scripts/debug-env.js` - Development tool
- `scripts/diagnose.js` - Development tool
- Test files - Can keep console for test output

## Import Pattern:
```typescript
import { logger } from '@/lib/logger';
```

## Examples:

### Before:
```typescript
console.log('User context initialized');
console.error('Failed to load user:', error);
console.warn('Deprecated API used');
```

### After:
```typescript
logger.debug('User context initialized');
logger.error('Failed to load user:', error);
logger.warn('Deprecated API used');
```
```

---

### Step 1.1.3: Replace in Contexts (Priority 1)

**Files to update:**
1. `rork-OJ-form-main/contexts/ThemeContext.tsx`
2. `rork-OJ-form-main/contexts/UserContext.tsx`
3. `rork-OJ-form-main/contexts/ProgrammeContext.tsx`
4. `rork-OJ-form-main/contexts/LeaderboardContext.tsx`
5. `rork-OJ-form-main/contexts/BodyMetricsContext.tsx`

**Process for each file:**

1. **Open the file** in your editor
2. **Add import** at the top (if not present):
   ```typescript
   import { logger } from '@/lib/logger';
   ```
3. **Search for console statements:**
   - Search for: `console.`
   - Review each occurrence
4. **Replace based on mapping:**
   - `console.log` → `logger.debug`
   - `console.info` → `logger.info`
   - `console.warn` → `logger.warn`
   - `console.error` → `logger.error`
5. **Save the file**
6. **Verify syntax** - no TypeScript errors

**Example replacement:**

```typescript
// BEFORE:
console.log('User context initialized');
console.error('Failed to load user:', error);

// AFTER:
logger.debug('User context initialized');
logger.error('Failed to load user:', error);
```

**Testing after each file:**
- Run: `bun run typecheck` to verify no TypeScript errors
- If the app is running, check that it still works

---

### Step 1.1.4: Replace in App Screens (Priority 2)

**Files to update (12 files):**
1. `rork-OJ-form-main/app/index.tsx`
2. `rork-OJ-form-main/app/(tabs)/home.tsx`
3. `rork-OJ-form-main/app/(tabs)/workouts.tsx`
4. `rork-OJ-form-main/app/(tabs)/leaderboard.tsx`
5. `rork-OJ-form-main/app/edit-profile.tsx`
6. `rork-OJ-form-main/app/programme/[id].tsx`
7. `rork-OJ-form-main/app/session/[id].tsx`
8. `rork-OJ-form-main/app/leaderboard/opt-in.tsx`
9. `rork-OJ-form-main/app/leaderboard/settings.tsx`
10. `rork-OJ-form-main/app/client/my-pt.tsx`
11. `rork-OJ-form-main/app/create-programme/review.tsx`
12. `rork-OJ-form-main/app/api/test+api.ts` (can skip if dev-only)

**Process for each file:**

1. Open file
2. Add import: `import { logger } from '@/lib/logger';`
3. Find all `console.` statements
4. Replace each one
5. Save and verify

**Batch processing tip:**
You can use find-and-replace in your editor:
- Find: `console.log(`
- Replace: `logger.debug(`
- Then repeat for other console methods

**Important:** Review each replacement to ensure it makes sense contextually.

---

### Step 1.1.5: Replace in Backend Routes (Priority 3)

**Files to update (29 files in `backend/trpc/routes/`):**

**Group by category for easier tracking:**
- Analytics routes (3 files)
  - `analytics/overview/route.ts`
  - `analytics/get-volume/route.ts`
  - `analytics/sync/route.ts`
  - `analytics/get/route.ts`
- Body metrics routes (4 files)
  - `body-metrics/log/route.ts`
  - `body-metrics/list/route.ts`
  - `body-metrics/latest/route.ts`
  - `body-metrics/delete/route.ts`
- Leaderboard routes (3 files)
  - `leaderboard/update-profile/route.ts`
  - `leaderboard/get-my-rank/route.ts`
  - `leaderboard/get-profile/route.ts`
- Personal records routes (2 files)
  - `personal-records/list/route.ts`
  - `personal-records/check-and-record/route.ts`
- Profile routes (2 files)
  - `profile/update/route.ts`
  - `profile/update-color/route.ts`
- Programmes routes (3 files)
  - `programmes/list/route.ts`
  - `programmes/create/route.ts`
  - `programmes/delete/route.ts`
- PT routes (9 files)
  - `pt/list-invitations/route.ts`
  - `pt/cancel-invitation/route.ts`
  - `pt/resend-invitation/route.ts`
  - `pt/accept-invitation/route.ts`
  - `pt/unshare-programme/route.ts`
  - `pt/share-programme/route.ts`
  - `pt/remove-client/route.ts`
  - `pt/invite-client/route.ts`
- Schedules routes (1 file)
  - `schedules/toggle-day/route.ts`
- Workouts routes (1 file)
  - `workouts/history/route.ts`
- Exercises routes (1 file)
  - `exercises/list/route.ts`

**Process for each file:**

1. Add import: `import { logger } from '@/lib/logger';`
2. Replace console statements
3. **Pay special attention to error handling** - use `logger.error()` for all errors

**Example for backend route:**

```typescript
// BEFORE:
try {
  // ... code
} catch (error) {
  console.error('Database error:', error);
  return { error: 'Failed to fetch data' };
}

// AFTER:
try {
  // ... code
} catch (error) {
  logger.error('Database error:', error);
  return { error: 'Failed to fetch data' };
}
```

---

### Step 1.1.6: Replace in Components (if any)

**Action:** Check components directory for console statements

**Command:**
```bash
grep -r "console\." rork-OJ-form-main/components/ --include="*.tsx"
```

**If found:** Replace using same strategy as app screens

**Files to check:**
- All files in `rork-OJ-form-main/components/`

---

### Step 1.1.7: Replace in Lib Files

**Files to check:**
- `rork-OJ-form-main/lib/trpc.ts`
- `rork-OJ-form-main/lib/supabase.ts`
- `rork-OJ-form-main/lib/env.ts` (already has console.error on line 50 - review if should keep)
- `rork-OJ-form-main/lib/connection-test.ts`

**Note:** `lib/logger.ts` itself uses console internally - this is correct and should NOT be changed.

**For `lib/env.ts`:**
- Line 50 has: `console.error('[Env] Validation failed:', error);`
- This is in a client-side validation block
- Consider: Should this use logger? Probably yes, but it's in a try-catch that prevents throwing
- Decision: Replace with `logger.error()` for consistency

---

### Step 1.1.8: Verify No Console Statements Remain

**Command:**
```bash
# Find remaining console statements (excluding logger.ts and debug files)
grep -r "console\.\(log\|error\|warn\|info\)" \
  --include="*.ts" --include="*.tsx" \
  --exclude="logger.ts" --exclude="scripts/debug-env.js" --exclude="scripts/diagnose.js" \
  rork-OJ-form-main/
```

**Expected:** Only intentional console statements in test files or development tools

**If console statements remain:**
- Review each one
- Determine if it should be replaced or kept (test files, dev tools)
- Document why it's kept in a comment if needed

---

### Step 1.1.9: Test After Replacement

**Actions:**

1. **Run type check:**
   ```bash
   bun run typecheck
   ```
   - Should pass with no errors

2. **Run linter:**
   ```bash
   bun run lint
   ```
   - Should pass with no errors (or fix any new issues)

3. **Start dev server:**
   ```bash
   bun run start
   ```
   - Should start without errors

4. **Test key flows:**
   - Sign in/up
   - Create programme
   - Log workout
   - View analytics
   - Navigate between screens

5. **Check console output:**
   - In development mode, you should see logger-prefixed messages like:
     - `[DEBUG] ...`
     - `[INFO] ...`
     - `[WARN] ...`
     - `[ERROR] ...`
   - No raw `console.log` output (except from logger.ts itself)

**If issues occur:**
- Check that logger import is correct: `import { logger } from '@/lib/logger';`
- Verify logger is being called correctly
- Check TypeScript errors for any import issues

---

## 1.2 Implement Terms of Service & Privacy Policy

### Step 1.2.1: Create Legal Directory Structure

**Action:** Create directory for legal documents

**Command:**
```bash
mkdir -p rork-OJ-form-main/app/legal
```

**Verify:**
```bash
ls -la rork-OJ-form-main/app/legal
```

---

### Step 1.2.2: Create Terms of Service Screen

**File:** `rork-OJ-form-main/app/legal/terms.tsx`

**Create this file with the following structure:**

```typescript
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

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
```

**Important Notes:**
- Replace placeholder contact information with your actual contact details
- Replace `[Your Jurisdiction]` with your actual jurisdiction
- Consider having a lawyer review the content before production
- Update the "Last Updated" date when you make changes

---

### Step 1.2.3: Create Privacy Policy Screen

**File:** `rork-OJ-form-main/app/legal/privacy.tsx`

**Create this file with similar structure but privacy-specific content:**

```typescript
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
    color: COLORS.primary,
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
```

**Critical Information to Include:**
- Supabase as data processor
- Face ID biometric data usage (stored locally, not transmitted)
- Location data (if collected)
- Analytics/tracking (if any)
- Contact email for privacy inquiries

**Important:** Replace placeholder emails with your actual contact information.

---

### Step 1.2.4: Update Settings Screen to Link Legal Pages

**File:** `rork-OJ-form-main/app/settings.tsx`

**Changes needed:**

1. **Add imports:**
   ```typescript
   import { useRouter } from 'expo-router';
   import { Alert, Pressable } from 'react-native';
   ```

2. **Add router hook:**
   ```typescript
   export default function SettingsScreen() {
     const { accent } = useTheme();
     const router = useRouter();
     // ... rest of component
   ```

3. **Make "Terms & Privacy" card pressable:**
   
   Find the card at lines 84-95 and replace with:

   ```typescript
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
   ```

**Note:** The nested `View` with `menuItem` style is needed to maintain the layout. The `Pressable` wraps it to make it tappable.

---

### Step 1.2.5: Test Legal Page Navigation

**Actions:**

1. **Start dev server:**
   ```bash
   bun run start
   ```

2. **Navigate to Settings:**
   - Open the app
   - Go to Profile tab
   - Navigate to Settings

3. **Test "Terms & Privacy" button:**
   - Tap the "Terms & Privacy" card
   - Verify action sheet appears
   - Select "Terms of Service"
   - Verify Terms page loads
   - Test back navigation
   - Repeat for "Privacy Policy"

4. **Verify content:**
   - Check that text is readable
   - Verify styling matches app design
   - Test scrolling works
   - Check on both iOS and Android if possible

**If navigation doesn't work:**
- Check that routes are correct: `/legal/terms` and `/legal/privacy`
- Verify files are in `app/legal/` directory
- Check for TypeScript errors: `bun run typecheck`

---

## 1.3 Production Environment Configuration

### Step 1.3.1: Review Current Environment Setup

**File:** `rork-OJ-form-main/lib/env.ts`

**Review the current validation:**

1. **Required variables:**
   - `EXPO_PUBLIC_SUPABASE_URL` - Must be valid URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Must be non-empty string

2. **Optional variables:**
   - `EXPO_PUBLIC_RORK_API_BASE_URL` - Optional URL
   - `EXPO_PUBLIC_LOG_LEVEL` - Optional enum
   - `EXPO_PUBLIC_WEB_URL` - Optional URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Optional (server-side only)
   - `NODE_ENV` - Optional, defaults to 'development'

**Action:** Review the validation logic and ensure it's appropriate for production.

**Check:**
- Are error messages clear?
- Are URL validations working?
- Should any optional variables be required in production?

---

### Step 1.3.2: Document Production Environment Variables

**File:** `rork-OJ-form-main/ENV_SETUP_GUIDE.md` (update existing or create new section)

**Add a new section: "Production Environment Setup"**

**Content to add:**

```markdown
## Production Environment Variables

### Required Variables (Client-Side)
These are bundled into the app and visible in the app bundle:

1. **EXPO_PUBLIC_SUPABASE_URL**
   - Description: Your Supabase project URL
   - Example: `https://your-project.supabase.co`
   - How to get: Supabase Dashboard > Project Settings > API > Project URL
   - Security: Public (safe to expose, protected by RLS)

2. **EXPO_PUBLIC_SUPABASE_ANON_KEY**
   - Description: Supabase anonymous/public key
   - Example: `eyJhbGci...`
   - How to get: Supabase Dashboard > Project Settings > API > anon/public key
   - Security: Public (designed to be exposed, protected by RLS)

### Optional Variables (Client-Side)

3. **EXPO_PUBLIC_RORK_API_BASE_URL**
   - Description: Backend API base URL for production
   - Example: `https://api.yourapp.com` or `https://your-app.vercel.app`
   - Default: Uses localhost in development
   - Security: Public

4. **EXPO_PUBLIC_LOG_LEVEL**
   - Description: Logging level for production
   - Values: `debug`, `info`, `warn`, `error`
   - Default: `error` in production, `debug` in development
   - Security: Public
   - Recommendation: Set to `error` for production

5. **EXPO_PUBLIC_WEB_URL**
   - Description: Web app URL (if applicable)
   - Example: `https://yourapp.com`
   - Security: Public

### Server-Side Only Variables

6. **SUPABASE_SERVICE_ROLE_KEY**
   - Description: Supabase service role key (full access)
   - How to get: Supabase Dashboard > Project Settings > API > service_role key
   - Security: SECRET - Never expose to client
   - Usage: Only in backend/server code
   - Note: Not used in Expo app, but needed if you have a separate backend

7. **NODE_ENV**
   - Description: Environment mode
   - Values: `development`, `production`, `test`
   - Default: `development`
   - Security: Can be public

## Setting Production Variables

### For EAS Builds

Use EAS Secrets (recommended for production):

```bash
# Install EAS CLI (if not already installed)
bun i -g @expo/eas-cli

# Login to Expo
eas login

# Set secrets (replace with your actual values)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
eas secret:create --scope project --name EXPO_PUBLIC_RORK_API_BASE_URL --value "https://api.yourapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_LOG_LEVEL --value "error"

# List all secrets to verify
eas secret:list

# Delete a secret if needed
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL
```

**Important:** EAS secrets are automatically injected during the build process. You don't need to create a `.env` file for production builds.

### For Local Production Testing

Create `.env.production` file (DO NOT commit to git):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.yourapp.com
EXPO_PUBLIC_LOG_LEVEL=error
EXPO_PUBLIC_WEB_URL=https://yourapp.com
```

**Note:** Expo doesn't automatically load `.env.production`. You may need to use a tool like `dotenv` or manually set variables.

## Verification

After setting variables, verify they load correctly:

```bash
# In development
bun run start

# Check console for env validation messages
# Should see: [Env] Validation successful (or error if missing)
```

## Security Notes

- ✅ EXPO_PUBLIC_* variables are safe to expose (designed for client)
- ❌ Never expose SUPABASE_SERVICE_ROLE_KEY
- ✅ Use Supabase Row Level Security (RLS) to protect data
- ✅ Anon key is protected by RLS policies
- ✅ Always use HTTPS URLs in production
```

---

### Step 1.3.3: Verify Environment Validation

**File:** `rork-OJ-form-main/lib/env.ts`

**Review the validation logic:**

1. **Check `validateEnv()` function (lines 20-43):**
   - Does it throw clear errors for missing required vars?
   - Are URL validations working?
   - Are optional variables handled correctly?

2. **Check client-side validation (lines 46-53):**
   - Does it catch errors gracefully?
   - Should it throw or just log?

**Test scenarios:**

1. **Missing required variable:**
   - Temporarily remove `EXPO_PUBLIC_SUPABASE_URL` from `.env`
   - Start app: `bun run start`
   - Should see clear error message

2. **Invalid URL:**
   - Set `EXPO_PUBLIC_SUPABASE_URL` to `not-a-url`
   - Should fail validation with clear message

3. **Missing optional variable:**
   - Remove `EXPO_PUBLIC_RORK_API_BASE_URL`
   - Should not error (it's optional)

**If validation needs improvement:**
- Update error messages to be more user-friendly
- Add better URL validation
- Consider making some optional vars required in production

---

### Step 1.3.4: Remove Hardcoded Development URLs

**Action:** Search for hardcoded localhost or development URLs

**Command:**
```bash
grep -r "localhost\|127.0.0.1\|ngrok\|:8081\|:3000" \
  --include="*.ts" --include="*.tsx" \
  rork-OJ-form-main/ --exclude-dir=node_modules
```

**Files to check:**

1. **`rork-OJ-form-main/lib/trpc.ts`**
   - Check for hardcoded API URL
   - Should use `EXPO_PUBLIC_RORK_API_BASE_URL` or similar

2. **`rork-OJ-form-main/backend/hono.ts`**
   - Check CORS origins
   - Should allow production URLs, not just localhost

3. **Any test files**
   - Can keep localhost in tests (that's fine)

**For each hardcoded URL found:**

1. **Identify the purpose:**
   - Is it an API endpoint?
   - Is it a CORS origin?
   - Is it a webhook URL?

2. **Replace with environment variable:**
   ```typescript
   // BEFORE:
   const apiUrl = 'http://localhost:8081';
   
   // AFTER:
   const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:8081';
   ```

3. **Update documentation:**
   - Note which env var is used
   - Document the fallback behavior

---

### Step 1.3.5: Create Production Environment Checklist

**File:** `rork-OJ-form-main/docs/production-env-checklist.md`

**Create this file with:**

```markdown
# Production Environment Checklist

## Pre-Build Checklist

- [ ] Supabase production project created
- [ ] Supabase RLS policies configured and tested
- [ ] EXPO_PUBLIC_SUPABASE_URL set in EAS secrets
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY set in EAS secrets
- [ ] Backend API deployed (if separate from Supabase)
- [ ] EXPO_PUBLIC_RORK_API_BASE_URL set (if using backend)
- [ ] EXPO_PUBLIC_LOG_LEVEL set to "error" for production
- [ ] All hardcoded URLs removed
- [ ] Environment validation tested
- [ ] Production Supabase project has proper backups

## Post-Build Verification

- [ ] Build completes without errors
- [ ] App starts without environment errors
- [ ] Supabase connection works
- [ ] API calls succeed (if using backend)
- [ ] No console errors about missing env vars
- [ ] Logging level appropriate (no debug logs in production)
- [ ] All features work in production build

## Rollback Plan

If production env issues occur:

1. **Check EAS secrets:**
   ```bash
   eas secret:list
   ```
   Verify all required secrets are set

2. **Verify Supabase:**
   - Check Supabase project is active
   - Verify RLS policies are correct
   - Test connection manually

3. **Check backend API:**
   - Verify API is running (if applicable)
   - Check API logs for errors
   - Test API endpoints manually

4. **Review build logs:**
   - Check EAS build logs for env var errors
   - Look for validation failures

5. **Test locally:**
   - Set up local `.env` with production values
   - Test app locally to isolate issues
```

---

### Step 1.3.6: Update .gitignore for Environment Files

**File:** `rork-OJ-form-main/.gitignore`

**Verify these are ignored:**

```
.env
.env*.local
.env.production
env
```

**Action:** Add any missing patterns.

**Note:** `.env.example` should NOT be in `.gitignore` (it's a template).

---

### Step 1.3.7: Create Environment Template

**File:** `rork-OJ-form-main/.env.example`

**Purpose:** Template for developers to know what variables are needed

**Content:**

```env
# Required Environment Variables
# Copy this file to .env and fill in your values

# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API (Optional - only if using separate backend)
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081

# Logging (Optional)
EXPO_PUBLIC_LOG_LEVEL=debug

# Web URL (Optional)
EXPO_PUBLIC_WEB_URL=http://localhost:8081

# Server-side only (not used in Expo app, but for backend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=development
```

**Important:** This file CAN be committed to git (no secrets).

**Action:** Create this file and commit it.

---

## Phase 1 Completion Checklist

After completing all steps, verify:

### Code Cleanup
- [ ] All console.log statements replaced (except in debug/test files)
- [ ] Logger imported and used correctly throughout
- [ ] No TypeScript errors: `bun run typecheck`
- [ ] No linting errors: `bun run lint`
- [ ] App runs without errors: `bun run start`
- [ ] Console output shows logger-prefixed messages in dev mode

### Legal Documents
- [ ] Terms of Service screen created (`app/legal/terms.tsx`)
- [ ] Privacy Policy screen created (`app/legal/privacy.tsx`)
- [ ] Settings screen links to legal pages
- [ ] Legal pages styled consistently with app
- [ ] Navigation works correctly
- [ ] Content is readable and properly formatted
- [ ] Contact information updated with real values

### Environment Configuration
- [ ] Environment variables documented in `ENV_SETUP_GUIDE.md`
- [ ] Production environment guide created
- [ ] Hardcoded URLs removed
- [ ] `.env.example` created
- [ ] `.gitignore` updated
- [ ] Environment validation tested
- [ ] Production checklist created

### Final Verification
- [ ] All tests pass: `bun run ci`
- [ ] App runs without errors
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Legal pages accessible and functional
- [ ] No console statements in production code
- [ ] Environment setup documented

---

## Next Steps

After completing Phase 1, proceed to:
- **Phase 2:** EAS Build Configuration
- **Phase 3:** App Store Assets & Metadata

---

## Troubleshooting

### Console Replacement Issues

**Problem:** TypeScript errors after replacing console
- **Solution:** Ensure `import { logger } from '@/lib/logger';` is added
- **Check:** Verify logger is exported from `lib/logger.ts`

**Problem:** Logger not working
- **Solution:** Check that `lib/logger.ts` is correct
- **Verify:** Logger should use console internally (that's fine)

### Legal Pages Issues

**Problem:** Navigation doesn't work
- **Solution:** Verify routes are `/legal/terms` and `/legal/privacy`
- **Check:** Files must be in `app/legal/` directory

**Problem:** Styling looks wrong
- **Solution:** Verify COLORS and SPACING imports
- **Check:** Ensure theme constants are imported correctly

### Environment Issues

**Problem:** Environment variables not loading
- **Solution:** Check `.env` file is in root directory
- **Verify:** Restart dev server after changing `.env`
- **Check:** Variable names must start with `EXPO_PUBLIC_` for client-side

**Problem:** Build fails with env errors
- **Solution:** Set EAS secrets before building
- **Verify:** Use `eas secret:list` to check secrets are set

---

## Estimated Time Breakdown

- **Step 1.1 (Console Replacement):** 4-6 hours
- **Step 1.2 (Legal Documents):** 3-4 hours
- **Step 1.3 (Environment Config):** 2-3 hours
- **Testing & Verification:** 1-2 hours

**Total:** 10-15 hours (1.5-2 days)

---

## Notes

- Take breaks between sections to avoid fatigue
- Test after each major change
- Commit changes frequently with clear messages
- Don't rush - quality is more important than speed
- Consider having legal documents reviewed by a lawyer before production

