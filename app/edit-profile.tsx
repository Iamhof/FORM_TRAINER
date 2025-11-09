import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import Card from '@/components/Card';
import ColorPicker from '@/components/ColorPicker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUser();
  const { accent, setAccentColor } = useTheme();
  
  const [name, setName] = useState(user?.name || '');
  const [selectedColor, setSelectedColor] = useState(user?.accentColor || accent);
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileMutation = trpc.profile.update.useMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSelectedColor(user.accentColor || accent);
    }
  }, [user, accent]);

  const hasChanges = () => {
    return (
      name !== user?.name ||
      selectedColor !== (user?.accentColor || accent)
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!hasChanges()) {
      router.back();
      return;
    }

    setIsSaving(true);

    try {
      const updates: { name?: string; accentColor?: string } = {};
      
      if (name !== user?.name) {
        updates.name = name.trim();
      }
      
      if (selectedColor !== (user?.accentColor || accent)) {
        updates.accentColor = selectedColor;
      }

      const result = await updateProfileMutation.mutateAsync(updates);

      if (result.success) {
        await updateProfile(updates);
        
        if (updates.accentColor) {
          const colorMap: Record<string, 'orange' | 'purple' | 'blue' | 'red' | 'yellow' | 'green' | 'teal' | 'pink'> = {
            '#ff6b55': 'orange',
            '#b266ff': 'purple',
            '#6699ff': 'blue',
            '#f44336': 'red',
            '#ffc107': 'yellow',
            '#4caf50': 'green',
            '#009688': 'teal',
            '#ec407a': 'pink',
          };
          
          const colorName = colorMap[updates.accentColor.toLowerCase()] || 'orange';
          console.log('[EditProfile] Setting accent color to:', colorName, 'from hex:', updates.accentColor);
          setAccentColor(colorName);
        }

        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('[EditProfile] Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile';
      
      if (error?.message) {
        if (error.message.includes('<!DOCTYPE') || error.message.includes('HTML')) {
          errorMessage = 'Server error. Please check if the backend is running correctly.';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={isSaving || !hasChanges()}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Check
                size={24}
                color={hasChanges() ? accent : COLORS.textTertiary}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.avatarCard}>
              <View style={[styles.avatar, { backgroundColor: `${selectedColor}30` }]}>
                <Text style={[styles.avatarText, { color: selectedColor }]}>
                  {name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Card style={styles.inputCard}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </Card>

              <Card style={styles.inputCard}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.emailText}>{user?.email}</Text>
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </Card>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <Card style={styles.colorCard}>
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                />
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  avatarCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700' as const,
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
  inputCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emailText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  colorCard: {
    padding: SPACING.lg,
    minHeight: 400,
  },
});
