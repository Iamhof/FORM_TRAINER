import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus, Mail, ChevronRight, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';

export default function PTClientsScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const clientsQuery = trpc.pt.listClients.useQuery();
  const invitationsQuery = trpc.pt.listInvitations.useQuery();
  const inviteMutation = trpc.pt.inviteClient.useMutation();
  const removeMutation = trpc.pt.removeClient.useMutation();

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await inviteMutation.mutateAsync({ email: inviteEmail });
      Alert.alert('Success', 'Invitation sent successfully');
      setInviteEmail('');
      setShowInviteForm(false);
      invitationsQuery.refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    }
  };

  const handleRemoveClient = (clientId: string, clientName: string) => {
    Alert.alert(
      'Remove Client',
      `Are you sure you want to remove ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMutation.mutateAsync({ clientId });
              clientsQuery.refetch();
              Alert.alert('Success', 'Client removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove client');
            }
          },
        },
      ]
    );
  };

  const clients = clientsQuery.data || [];
  const invitations = invitationsQuery.data || [];

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleRow}>
              <Users size={28} color={accent} strokeWidth={2.5} />
              <Text style={styles.title}>My Clients</Text>
            </View>
            <Pressable
              style={[styles.inviteButton, { backgroundColor: accent }]}
              onPress={() => setShowInviteForm(!showInviteForm)}
            >
              <UserPlus size={20} color={COLORS.background} strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {clients.length} active client{clients.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showInviteForm && (
            <Card style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>Invite New Client</Text>
              <Text style={styles.inviteSubtitle}>
                Send an invitation to a client&apos;s email address
              </Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={COLORS.textSecondary} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="client@example.com"
                  placeholderTextColor={COLORS.textTertiary}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inviteActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                  }}
                  variant="outline"
                  style={styles.inviteActionButton}
                />
                <Button
                  title="Send Invite"
                  onPress={handleInvite}
                  style={styles.inviteActionButton}
                  disabled={inviteMutation.isPending}
                />
              </View>
            </Card>
          )}

          {invitations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Invitations</Text>
              {invitations.map((invitation) => (
                <Card key={invitation.id} style={styles.invitationCard}>
                  <View style={styles.invitationContent}>
                    <View style={[styles.invitationIcon, { backgroundColor: `${accent}20` }]}>
                      <Mail size={20} color={accent} strokeWidth={2} />
                    </View>
                    <View style={styles.invitationInfo}>
                      <Text style={styles.invitationEmail}>{invitation.clientEmail}</Text>
                      <Text style={styles.invitationStatus}>
                        Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Clients</Text>
            {clients.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={[styles.emptyIcon, { backgroundColor: `${accent}20` }]}>
                  <Users size={32} color={accent} strokeWidth={2} />
                </View>
                <Text style={styles.emptyTitle}>No Clients Yet</Text>
                <Text style={styles.emptyText}>
                  Invite clients to start managing their training programmes
                </Text>
              </Card>
            ) : (
              clients.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => router.push(`/pt/client/${client.id}` as any)}
                >
                  <Card style={styles.clientCard}>
                    <View style={styles.clientContent}>
                      <View style={[styles.clientAvatar, { backgroundColor: `${accent}30` }]}>
                        <Text style={[styles.clientInitial, { color: accent }]}>
                          {client.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <Text style={styles.clientEmail}>{client.email}</Text>
                        <Text style={styles.clientMeta}>
                          {client.sharedProgrammes} programme{client.sharedProgrammes !== 1 ? 's' : ''} shared
                        </Text>
                      </View>
                      <ChevronRight size={20} color={COLORS.textTertiary} strokeWidth={2} />
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveClient(client.id, client.name)}
                    >
                      <Trash2 size={18} color={COLORS.error} strokeWidth={2} />
                    </Pressable>
                  </Card>
                </Pressable>
              ))
            )}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  inviteCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inviteActionButton: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  invitationCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  invitationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  invitationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  invitationStatus: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
  },
  clientCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    position: 'relative' as const,
  },
  clientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  clientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitial: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  clientMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  removeButton: {
    position: 'absolute' as const,
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
