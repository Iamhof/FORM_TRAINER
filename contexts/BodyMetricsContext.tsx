import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from './UserContext';
import { BodyMetric, PersonalRecord } from '@/types/database';
import { logger } from '@/lib/logger';

export interface BodyMetricsData {
  weight: { date: string; value: number }[];
  muscleMass: { date: string; value: number }[];
  bodyFat: { date: string; value: number }[];
}

const [BodyMetricsProviderRaw, useBodyMetrics] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [isLoadingPRs, setIsLoadingPRs] = useState<boolean>(true);

  const bodyMetricsQuery = trpc.bodyMetrics.list.useQuery(
    {
      limit: 12,
    },
    {
      enabled: isAuthenticated,
    }
  );

  const latestMetricsQuery = trpc.bodyMetrics.latest.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const personalRecordsQuery = trpc.personalRecords.list.useQuery(
    {},
    {
      enabled: isAuthenticated,
    }
  );

  const logMetricsMutation = trpc.bodyMetrics.log.useMutation({
    onSuccess: () => {
      bodyMetricsQuery.refetch();
      latestMetricsQuery.refetch();
    },
  });

  const deleteMetricsMutation = trpc.bodyMetrics.delete.useMutation({
    onSuccess: () => {
      bodyMetricsQuery.refetch();
      latestMetricsQuery.refetch();
    },
  });

  // Store mutations in refs to avoid recreating callbacks on every mutation reference change
  const logMetricsMutationRef = useRef(logMetricsMutation);
  logMetricsMutationRef.current = logMetricsMutation;

  const deleteMetricsMutationRef = useRef(deleteMetricsMutation);
  deleteMetricsMutationRef.current = deleteMetricsMutation;

  // Store user in ref to avoid recreating callbacks when user reference changes
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (bodyMetricsQuery.data) {
      setBodyMetrics(bodyMetricsQuery.data);
      setIsLoadingMetrics(false);
    }
  }, [bodyMetricsQuery.data]);

  useEffect(() => {
    if (personalRecordsQuery.data) {
      setPersonalRecords(personalRecordsQuery.data);
      setIsLoadingPRs(false);
    }
  }, [personalRecordsQuery.data]);

  const logBodyMetrics = useCallback(
    async (data: {
      date: string;
      weight?: number;
      muscleMass?: number;
      bodyFatPercentage?: number;
      notes?: string;
    }) => {
      if (!userRef.current) {
        logger.error('[BodyMetricsContext] Cannot log body metrics: not authenticated');
        return;
      }

      try {
        logger.debug('[BodyMetricsContext] Logging body metrics:', data);
        await logMetricsMutationRef.current.mutateAsync(data);
        logger.debug('[BodyMetricsContext] Body metrics logged successfully');
      } catch (error) {
        logger.error('[BodyMetricsContext] Failed to log body metrics:', error);
        throw error;
      }
    },
    [] // Empty deps - using refs for stable references
  );

  const deleteBodyMetrics = useCallback(
    async (id: string) => {
      if (!userRef.current) {
        logger.error('[BodyMetricsContext] Cannot delete body metrics: not authenticated');
        return;
      }

      try {
        logger.debug('[BodyMetricsContext] Deleting body metric:', id);
        await deleteMetricsMutationRef.current.mutateAsync({ id });
        logger.debug('[BodyMetricsContext] Body metric deleted successfully');
      } catch (error) {
        logger.error('[BodyMetricsContext] Failed to delete body metric:', error);
        throw error;
      }
    },
    [] // Empty deps - using refs for stable references
  );

  const latestMetrics = useMemo(() => {
    return latestMetricsQuery.data || null;
  }, [latestMetricsQuery.data]);

  const metricsData = useMemo((): BodyMetricsData => {
    const weight: { date: string; value: number }[] = [];
    const muscleMass: { date: string; value: number }[] = [];
    const bodyFat: { date: string; value: number }[] = [];

    bodyMetrics
      .slice()
      .reverse()
      .forEach((metric) => {
        if (metric.weight !== null) {
          weight.push({ date: metric.date, value: metric.weight });
        }
        if (metric.muscle_mass !== null) {
          muscleMass.push({ date: metric.date, value: metric.muscle_mass });
        }
        if (metric.body_fat_percentage !== null) {
          bodyFat.push({ date: metric.date, value: metric.body_fat_percentage });
        }
      });

    return { weight, muscleMass, bodyFat };
  }, [bodyMetrics]);

  // refetch methods are stable references from tRPC queries, no dependencies needed
  const refetchMetrics = useCallback(() => {
    bodyMetricsQuery.refetch();
    latestMetricsQuery.refetch();
  }, []); // Refetch methods are stable

  const refetchPRs = useCallback(() => {
    personalRecordsQuery.refetch();
  }, []); // Refetch method is stable

  return useMemo(
    () => ({
      bodyMetrics,
      personalRecords,
      latestMetrics,
      metricsData,
      isLoadingMetrics,
      isLoadingPRs,
      logBodyMetrics,
      deleteBodyMetrics,
      refetchMetrics,
      refetchPRs,
      isLoggingMetrics: logMetricsMutation.isPending,
    }),
    [
      bodyMetrics,
      personalRecords,
      latestMetrics,
      metricsData,
      isLoadingMetrics,
      isLoadingPRs,
      logBodyMetrics,
      deleteBodyMetrics,
      refetchMetrics,
      refetchPRs,
      logMetricsMutation.isPending,
    ]
  );
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext updates but user/isAuthenticated haven't changed
export const BodyMetricsProvider = React.memo(BodyMetricsProviderRaw);

export { useBodyMetrics };
