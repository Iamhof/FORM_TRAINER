import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from './UserContext';
import { useProgrammes } from './ProgrammeContext';

export type DayStatus = 'scheduled' | 'completed' | 'rest' | 'empty';

export type ScheduleDay = {
  dayOfWeek: number;
  status: DayStatus;
  weekStart: string;
};

export type WeekSchedule = {
  id?: string;
  userId: string;
  programmeId: string | null;
  weekStart: string;
  schedule: ScheduleDay[];
};

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getInitialSchedule(weekStart: string): ScheduleDay[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    status: 'empty' as DayStatus,
    weekStart,
  }));
}

export const [ScheduleProvider, useSchedule] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const { activeProgramme } = useProgrammes();
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [schedule, setSchedule] = useState<ScheduleDay[]>(getInitialSchedule(currentWeekStart));
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSchedule(getInitialSchedule(currentWeekStart));
      setIsLoading(false);
      return;
    }

    try {
      console.log('[ScheduleContext] Loading schedule for week:', currentWeekStart);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[ScheduleContext] Error loading schedule:');
        console.error('[ScheduleContext] Code:', error.code);
        console.error('[ScheduleContext] Message:', error.message);
        throw error;
      }

      if (data) {
        console.log('[ScheduleContext] Loaded schedule:', data);
        console.log('[ScheduleContext] Schedule data type:', typeof data.schedule);
        
        let parsedSchedule: ScheduleDay[];
        
        try {
          if (Array.isArray(data.schedule)) {
            parsedSchedule = data.schedule;
            console.log('[ScheduleContext] Using schedule array directly:', parsedSchedule);
          } else if (typeof data.schedule === 'string') {
            console.log('[ScheduleContext] Raw schedule string:', data.schedule);
            const trimmed = data.schedule.trim();
            
            const isCorrupted = 
              trimmed === '[object Object]' || 
              trimmed.startsWith('[object') || 
              trimmed.includes('[object') ||
              trimmed === 'null' || 
              trimmed === 'undefined' || 
              trimmed === '' ||
              !trimmed.startsWith('[');
            
            if (isCorrupted) {
              console.error('[ScheduleContext] Corrupted or invalid data detected:', trimmed);
              parsedSchedule = getInitialSchedule(currentWeekStart);
            } else {
              try {
                parsedSchedule = JSON.parse(trimmed);
                console.log('[ScheduleContext] Parsed schedule from string:', parsedSchedule);
                
                if (!Array.isArray(parsedSchedule)) {
                  console.error('[ScheduleContext] Parsed data is not an array, resetting');
                  parsedSchedule = getInitialSchedule(currentWeekStart);
                }
              } catch (parseError) {
                console.error('[ScheduleContext] JSON parse failed:', parseError);
                console.error('[ScheduleContext] Failed string was:', trimmed);
                parsedSchedule = getInitialSchedule(currentWeekStart);
              }
            }
          } else if (data.schedule && typeof data.schedule === 'object') {
            console.log('[ScheduleContext] Schedule is object, converting to array');
            const scheduleObj = data.schedule as any;
            if (scheduleObj.length !== undefined) {
              parsedSchedule = Array.from(scheduleObj);
            } else {
              parsedSchedule = getInitialSchedule(currentWeekStart);
            }
          } else {
            console.warn('[ScheduleContext] Unexpected schedule format:', typeof data.schedule);
            parsedSchedule = getInitialSchedule(currentWeekStart);
          }
          
          setSchedule(parsedSchedule);
        } catch (error) {
          console.error('[ScheduleContext] Error processing schedule data:', error);
          setSchedule(getInitialSchedule(currentWeekStart));
        }
      } else {
        console.log('[ScheduleContext] No schedule found, using empty schedule');
        setSchedule(getInitialSchedule(currentWeekStart));
      }
    } catch (error) {
      console.error('[ScheduleContext] Failed to load schedule:', error);
      setSchedule(getInitialSchedule(currentWeekStart));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, currentWeekStart]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const saveSchedule = useCallback(
    async (newSchedule: ScheduleDay[]) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      try {
        console.log('[ScheduleContext] Saving schedule:', newSchedule);
        console.log('[ScheduleContext] Schedule to save (stringified):', JSON.stringify(newSchedule));

        const { data: existing } = await supabase
          .from('schedules')
          .select('id')
          .eq('user_id', user.id)
          .eq('week_start', currentWeekStart)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('schedules')
            .update({
              schedule: JSON.parse(JSON.stringify(newSchedule)),
              programme_id: activeProgramme?.id || null,
            })
            .eq('id', existing.id);

          if (error) {
            console.error('[ScheduleContext] Error updating schedule:', error);
            throw error;
          }
        } else {
          const { error } = await supabase
            .from('schedules')
            .insert({
              user_id: user.id,
              programme_id: activeProgramme?.id || null,
              week_start: currentWeekStart,
              schedule: JSON.parse(JSON.stringify(newSchedule)),
            });

          if (error) {
            console.error('[ScheduleContext] Error creating schedule:', error);
            throw error;
          }
        }

        console.log('[ScheduleContext] Schedule saved successfully');
        setSchedule(newSchedule);
      } catch (error) {
        console.error('[ScheduleContext] Failed to save schedule:', error);
        throw error;
      }
    },
    [user, currentWeekStart, activeProgramme]
  );

  const toggleDay = useCallback(
    async (dayIndex: number) => {
      console.log('[ScheduleContext] toggleDay called for index:', dayIndex);
      console.log('[ScheduleContext] Current schedule length:', schedule.length);
      console.log('[ScheduleContext] Full schedule:', JSON.stringify(schedule));
      
      if (!activeProgramme) {
        console.log('[ScheduleContext] No active programme');
        return;
      }

      if (dayIndex < 0 || dayIndex >= schedule.length) {
        console.error('[ScheduleContext] Invalid day index:', dayIndex);
        return;
      }

      const dayData = schedule[dayIndex];
      if (!dayData) {
        console.error('[ScheduleContext] No data for day index:', dayIndex);
        return;
      }

      const currentStatus = dayData.status;
      console.log('[ScheduleContext] Current status for day', dayIndex, ':', currentStatus);
      console.log('[ScheduleContext] Day data:', JSON.stringify(dayData));

      if (currentStatus === 'completed') {
        console.log('[ScheduleContext] Cannot toggle completed day');
        return;
      }

      const scheduledCount = schedule.filter((d) => d?.status === 'scheduled').length;
      const requiredSessions = activeProgramme.days;
      console.log('[ScheduleContext] Scheduled count:', scheduledCount, '/ Required:', requiredSessions);

      let newStatus: DayStatus;

      if (currentStatus === 'scheduled') {
        newStatus = 'rest';
        console.log('[ScheduleContext] Changing from scheduled to rest');
      } else if (currentStatus === 'rest' || currentStatus === 'empty') {
        if (scheduledCount >= requiredSessions) {
          console.log('[ScheduleContext] Max sessions reached, cannot schedule more');
          return;
        }
        newStatus = 'scheduled';
        console.log('[ScheduleContext] Changing from', currentStatus, 'to scheduled');
      } else {
        console.log('[ScheduleContext] Unknown status:', currentStatus);
        return;
      }

      console.log('[ScheduleContext] Changing status from', currentStatus, 'to', newStatus);

      const newSchedule = schedule.map((day, idx) =>
        idx === dayIndex ? { ...day, status: newStatus } : day
      );

      console.log('[ScheduleContext] New schedule:', JSON.stringify(newSchedule));
      setSchedule(newSchedule);
      await saveSchedule(newSchedule);
    },
    [schedule, activeProgramme, saveSchedule]
  );

  const scheduledCount = useMemo(() => {
    return schedule.filter((d) => d.status === 'scheduled' || d.status === 'completed').length;
  }, [schedule]);

  const canScheduleMore = useMemo(() => {
    if (!activeProgramme) return false;
    return scheduledCount < activeProgramme.days;
  }, [scheduledCount, activeProgramme]);

  return useMemo(
    () => ({
      schedule,
      isLoading,
      scheduledCount,
      canScheduleMore,
      currentWeekStart,
      toggleDay,
      loadSchedule,
    }),
    [schedule, isLoading, scheduledCount, canScheduleMore, currentWeekStart, toggleDay, loadSchedule]
  );
});
