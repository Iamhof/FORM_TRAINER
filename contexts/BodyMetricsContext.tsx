import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from './UserContext';
import { BodyMetric, PersonalRecord } from '@/types/database';

export interface BodyMetricsData {
  weight: { date: string; value: number }[];
  muscleMass: { date: string; value: number }[];
  bodyFat: { date: string; value: number }[];
}

export const [BodyMetricsProvider, useBodyMetrics] = createContextHook(() => {
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
      if (!user) {
        console.error('[BodyMetricsContext] Cannot log body metrics: not authenticated');
        return;
      }

      try {
        console.log('[BodyMetricsContext] Logging body metrics:', data);
        await logMetricsMutation.mutateAsync(data);
        console.log('[BodyMetricsContext] Body metrics logged successfully');
      } catch (error) {
        console.error('[BodyMetricsContext] Failed to log body metrics:', error);
        throw error;
      }
    },
    [user, logMetricsMutation]
  );

  const deleteBodyMetrics = useCallback(
    async (id: string) => {
      if (!user) {
        console.error('[BodyMetricsContext] Cannot delete body metrics: not authenticated');
        return;
      }

      try {
        console.log('[BodyMetricsContext] Deleting body metric:', id);
        await deleteMetricsMutation.mutateAsync({ id });
        console.log('[BodyMetricsContext] Body metric deleted successfully');
      } catch (error) {
        console.error('[BodyMetricsContext] Failed to delete body metric:', error);
        throw error;
      }
    },
    [user, deleteMetricsMutation]
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

  const refetchMetrics = useCallback(() => {
    bodyMetricsQuery.refetch();
    latestMetricsQuery.refetch();
  }, [bodyMetricsQuery, latestMetricsQuery]);

  const refetchPRs = useCallback(() => {
    personalRecordsQuery.refetch();
  }, [personalRecordsQuery]);

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
