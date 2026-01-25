import createContextHook from '@nkzw/create-context-hook';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import type { LeaderboardType, GenderFilter, LeaderboardEntry, LeaderboardRankingsResponse } from '@/types/leaderboard';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

const [LeaderboardProviderRaw, useLeaderboard] = createContextHook(() => {
  const utils = trpc.useUtils();
  const [selectedType, setSelectedType] = useState<LeaderboardType>('total_volume');
  const [selectedGender, setSelectedGender] = useState<GenderFilter>('all');
  const [offset, setOffset] = useState(0);
  const [allEntries, setAllEntries] = useState<Array<{ rank: number; user_id: string; display_name: string; value: number; is_current_user: boolean; accentColor?: string }>>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousFiltersRef = useRef<{ type: LeaderboardType; gender: GenderFilter } | null>(null);
  // Track filter version to prevent race conditions with rapid filter changes
  const filterVersionRef = useRef(0);
  const currentQueryVersionRef = useRef(0);
  // Track whether user has accessed leaderboard features to avoid unnecessary queries
  const [hasAccessedLeaderboard, setHasAccessedLeaderboard] = useState(false);

  // Only enable profileQuery when user has accessed leaderboard features
  // This prevents unnecessary network requests for users who don't use leaderboard
  const profileQuery = trpc.leaderboard.getProfile.useQuery(undefined, {
    enabled: hasAccessedLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Conditionally enable rankingsQuery and myRankQuery based on opt-in status
  // Memoize to prevent unnecessary re-renders
  const isOptedIn = useMemo(() => profileQuery.data?.is_opted_in === true, [profileQuery.data?.is_opted_in]);

  const rankingsQuery = trpc.leaderboard.getRankings.useQuery({
    type: selectedType,
    gender: selectedGender,
    limit: PAGE_SIZE,
    offset: 0,
  }, {
    enabled: isOptedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes - data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    placeholderData: (previousData) => previousData, // Smooth pagination transitions (formerly keepPreviousData)
  });

  // Handle query data updates (onSuccess replacement in React Query v5)
  useEffect(() => {
    if (rankingsQuery.data) {
      // Only update state if this data is for the current filter version
      // This prevents race conditions when filters change rapidly
      if (currentQueryVersionRef.current !== filterVersionRef.current) {
        // Stale data from a previous filter state, ignore it
        return;
      }

      const data = rankingsQuery.data;
      setAllEntries(data.entries);
      setTotalCount(data.total_count);
      setHasMore(data.has_more);
      setIsFilterChanging(false); // Filter change complete, data loaded

      // Only set offset on initial load, not on refetches from filter changes
      // Filter changes are handled by the useEffect which sets offset to 0
      if (isInitialLoadRef.current) {
        setOffset(PAGE_SIZE);
        isInitialLoadRef.current = false;
      }
    }
  }, [rankingsQuery.data]);

  const myRankQuery = trpc.leaderboard.getMyRank.useQuery({
    type: selectedType,
    gender: selectedGender,
  }, {
    enabled: isOptedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Debounced refetch when filters change
  useEffect(() => {
    // Check if filters actually changed
    const currentFilters = { type: selectedType, gender: selectedGender };
    const filtersChanged = 
      !previousFiltersRef.current ||
      previousFiltersRef.current.type !== selectedType ||
      previousFiltersRef.current.gender !== selectedGender;

    // Only proceed if filters changed and user is opted in
    if (!filtersChanged || !isOptedIn) {
      previousFiltersRef.current = currentFilters;
      return;
    }

    // Set loading state immediately when filter changes
    setIsFilterChanging(true);

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the refetch
    debounceTimerRef.current = setTimeout(() => {
      // Increment filter version to mark this as a new filter state
      filterVersionRef.current += 1;
      const newVersion = filterVersionRef.current;

      setOffset(0);
      setAllEntries([]);
      // Reset initial load flag so onSuccess can set offset correctly for new filter results
      isInitialLoadRef.current = true;
      
      // Synchronize query version with filter version
      // This ensures only results from this filter state will be processed
      currentQueryVersionRef.current = newVersion;

      // Use utils to refetch instead of query object methods to avoid dependency issues
      utils.leaderboard.getRankings.invalidate({
        type: selectedType,
        gender: selectedGender,
        limit: PAGE_SIZE,
        offset: 0,
      });
      utils.leaderboard.getMyRank.invalidate({
        type: selectedType,
        gender: selectedGender,
      });
      previousFiltersRef.current = currentFilters;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedType, selectedGender, isOptedIn, utils]);

  const updateProfileMutation = trpc.leaderboard.updateProfile.useMutation({
    onSuccess: async () => {
      // Refetch all queries after profile update
      try {
        await Promise.all([
          profileQuery.refetch(),
          rankingsQuery.refetch(),
          myRankQuery.refetch(),
        ]);
      } catch (error) {
        logger.error('[LeaderboardContext] Error refetching after profile update:', error);
      }
    },
    onError: (error) => {
      logger.error('[LeaderboardContext] Profile update mutation error:', error);
    },
  });

  // Enable leaderboard queries when user accesses leaderboard features
  // This should be called when user navigates to leaderboard screens
  const enableLeaderboardQueries = useCallback(() => {
    setHasAccessedLeaderboard(true);
  }, []);

  const optIn = useCallback(async (displayName: string, userGender?: 'male' | 'female' | 'other' | 'prefer_not_to_say') => {
    // Ensure queries are enabled when user opts in
    setHasAccessedLeaderboard(true);
    
    // VALIDATION: Check gender before attempting opt-in
    // Leaderboard requires gender to be 'male' or 'female' for proper ranking
    if (!userGender) {
      const error = new Error('Please set your gender in your profile settings before joining the leaderboard.');
      logger.error('[LeaderboardContext] Opt-in failed: Gender not set', { userGender });
      throw error;
    }
    
    if (userGender !== 'male' && userGender !== 'female') {
      const error = new Error('Leaderboard requires male or female gender. Please update your profile gender in settings to join.');
      logger.error('[LeaderboardContext] Opt-in failed: Invalid gender for leaderboard', { userGender });
      throw error;
    }
    
    try {
      const result = await updateProfileMutation.mutateAsync({
        is_opted_in: true,
        display_name: displayName,
        // Gender will be fetched from profile by backend
      });
      // Ensure all queries are refetched after opt-in
      try {
        await Promise.all([
          profileQuery.refetch(),
          rankingsQuery.refetch(),
          myRankQuery.refetch(),
        ]);
      } catch (refetchError) {
        logger.error('[LeaderboardContext] Error refetching after opt-in:', refetchError);
        // Don't throw - opt-in was successful, refetch can happen later
      }
      return result;
    } catch (error) {
      logger.error('[LeaderboardContext] Opt-in error:', error);
      throw error;
    }
  }, [updateProfileMutation, profileQuery, rankingsQuery, myRankQuery]);

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

  const loadMore = useCallback(async () => {
    if (!hasMore || rankingsQuery.isFetching || !isOptedIn) {
      return;
    }

    try {
      const response = await utils.leaderboard.getRankings.fetch({
        type: selectedType,
        gender: selectedGender,
        limit: PAGE_SIZE,
        offset: offset,
      });

      setAllEntries((prev) => [...prev, ...response.entries]);
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (error) {
      logger.error('[LeaderboardContext] Error loading more:', error);
    }
  }, [hasMore, rankingsQuery.isFetching, isOptedIn, selectedType, selectedGender, offset, utils]);

  const jumpToRank = useCallback(async (targetRank: number) => {
    if (!isOptedIn || targetRank < 1) {
      return null;
    }

    try {
      // Fetch entries around the target rank (5 above, 5 below)
      const contextSize = 5;
      const startOffset = Math.max(0, targetRank - contextSize - 1);
      const limit = contextSize * 2 + 1; // 5 above + user + 5 below = 11 total

      const response = await utils.leaderboard.getRankings.fetch({
        type: selectedType,
        gender: selectedGender,
        limit: limit,
        offset: startOffset,
      });

      // Replace all entries with the context around the target rank
      setAllEntries(response.entries);
      setTotalCount(response.total_count);
      setHasMore((startOffset + response.entries.length) < response.total_count);
      setOffset(startOffset + response.entries.length);

      // Find the index of the target rank in the response
      const targetIndex = response.entries.findIndex((entry) => entry.rank === targetRank);
      return targetIndex >= 0 ? targetIndex : null;
    } catch (error) {
      logger.error('[LeaderboardContext] Error jumping to rank:', error);
      return null;
    }
  }, [isOptedIn, selectedType, selectedGender, utils]);

  const refetch = useCallback(() => {
    setOffset(0);
    setAllEntries([]);
    // Increment filter version to ensure fresh data
    filterVersionRef.current += 1;
    currentQueryVersionRef.current = filterVersionRef.current;
    isInitialLoadRef.current = true;
    setIsFilterChanging(true);
    profileQuery.refetch();
    rankingsQuery.refetch();
    myRankQuery.refetch();
  }, [profileQuery, rankingsQuery, myRankQuery]);

  // Determine if error is network-related
  const isNetworkError = useCallback((error: any) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      error.data?.code === 'TIMEOUT' ||
      error.data?.code === 'INTERNAL_SERVER_ERROR'
    );
  }, []);

  const getErrorMessage = useCallback((error: any) => {
    if (!error) return null;
    if (isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message || 'An error occurred. Please try again.';
  }, [isNetworkError]);

  const error = profileQuery.error || rankingsQuery.error || myRankQuery.error || updateProfileMutation.error;
  const errorMessage = getErrorMessage(error);

  return useMemo(() => ({
    profile: profileQuery.data,
    rankings: allEntries,
    myRank: myRankQuery.data,
    totalCount,
    hasMore,
    isLoading: profileQuery.isLoading || rankingsQuery.isLoading || myRankQuery.isLoading,
    isFetchingMore: rankingsQuery.isFetching && offset > 0,
    isFilterChanging, // New state to track filter changes in progress
    error,
    errorMessage,
    isNetworkError: error ? isNetworkError(error) : false,
    selectedType,
    setSelectedType,
    selectedGender,
    setSelectedGender,
    enableLeaderboardQueries,
    optIn,
    optOut,
    updateDisplayName,
    refetch,
    loadMore,
    jumpToRank,
  }), [
    profileQuery.data,
    profileQuery.isLoading,
    profileQuery.error,
    allEntries,
    totalCount,
    hasMore,
    rankingsQuery.isLoading,
    rankingsQuery.isFetching,
    rankingsQuery.error,
    myRankQuery.data,
    myRankQuery.isLoading,
    myRankQuery.error,
    updateProfileMutation.error,
    error,
    errorMessage,
    isFilterChanging,
    selectedType,
    selectedGender,
    enableLeaderboardQueries,
    optIn,
    optOut,
    updateDisplayName,
    refetch,
    loadMore,
    jumpToRank,
    offset,
    isNetworkError,
  ]);
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when parent contexts update but no relevant changes occur
export const LeaderboardProvider = React.memo(LeaderboardProviderRaw);

export { useLeaderboard };
