import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import type { LeaderboardType, GenderFilter } from '@/types/leaderboard';

export const [LeaderboardProvider, useLeaderboard] = createContextHook(() => {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('total_volume');
  const [selectedGender, setSelectedGender] = useState<GenderFilter>('all');

  const profileQuery = trpc.leaderboard.getProfile.useQuery(undefined, {
    enabled: false,
  });
  const rankingsQuery = trpc.leaderboard.getRankings.useQuery({
    type: selectedType,
    gender: selectedGender,
    limit: 50,
    offset: 0,
  }, {
    enabled: false,
  });
  const myRankQuery = trpc.leaderboard.getMyRank.useQuery({
    type: selectedType,
    gender: selectedGender,
  }, {
    enabled: false,
  });

  const updateProfileMutation = trpc.leaderboard.updateProfile.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
    },
  });

  const optIn = useCallback(async (displayName: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => {
    return updateProfileMutation.mutateAsync({
      is_opted_in: true,
      display_name: displayName,
      gender,
    });
  }, [updateProfileMutation]);

  const optOut = useCallback(async () => {
    return updateProfileMutation.mutateAsync({
      is_opted_in: false,
    });
  }, [updateProfileMutation]);

  const updateDisplayName = useCallback(async (displayName: string) => {
    return updateProfileMutation.mutateAsync({
      display_name: displayName,
    });
  }, [updateProfileMutation]);

  const refetch = useCallback(() => {
    profileQuery.refetch();
    rankingsQuery.refetch();
    myRankQuery.refetch();
  }, [profileQuery, rankingsQuery, myRankQuery]);

  return useMemo(() => ({
    profile: profileQuery.data,
    rankings: rankingsQuery.data || [],
    myRank: myRankQuery.data,
    isLoading: profileQuery.isLoading || rankingsQuery.isLoading,
    selectedType,
    setSelectedType,
    selectedGender,
    setSelectedGender,
    optIn,
    optOut,
    updateDisplayName,
    refetch,
  }), [
    profileQuery.data,
    profileQuery.isLoading,
    rankingsQuery.data,
    rankingsQuery.isLoading,
    myRankQuery.data,
    selectedType,
    selectedGender,
    optIn,
    optOut,
    updateDisplayName,
    refetch,
  ]);
});
