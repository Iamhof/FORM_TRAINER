import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { env } from '@/lib/env';

/**
 * Component that checks for missing environment variables and displays
 * a helpful error message if they're missing.
 * This prevents silent failures and helps developers identify configuration issues.
 */
export function EnvCheck({ children }: { children: React.ReactNode }) {
  const missingVars: string[] = [];
  
  if (!env.EXPO_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL === 'MISSING_ENV_VAR') {
    missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  
  if (!env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'MISSING_ENV_VAR') {
    missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  if (missingVars.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Configuration Error</Text>
        <Text style={styles.message}>
          Missing required environment variables:
        </Text>
        <Text style={styles.varsList}>
          {missingVars.join('\n')}
        </Text>
        <Text style={styles.instructions}>
          For EAS builds, set these as secrets:{'\n\n'}
          eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value &lt;your-url&gt;{'\n'}
          eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value &lt;your-key&gt;
        </Text>
        <Text style={styles.note}>
          After setting secrets, rebuild your app with: eas build --platform ios --profile production
        </Text>
      </View>
    );
  }
  
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  varsList: {
    fontSize: 14,
    color: '#ffd93d',
    fontFamily: 'monospace',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 16,
    textAlign: 'left',
    lineHeight: 18,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
