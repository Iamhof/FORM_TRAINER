import { describe, expect, it, vi, afterEach } from 'vitest';

import { formatTimeAgo } from '@/lib/date-utils';

describe('formatTimeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const fixedNow = new Date('2026-03-16T12:00:00Z');

  function setNow(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  it('returns "Just now" for very recent dates', () => {
    setNow(fixedNow);
    const tenMinutesAgo = new Date(fixedNow.getTime() - 10 * 60 * 1000).toISOString();
    expect(formatTimeAgo(tenMinutesAgo)).toBe('Just now');
  });

  it('returns "Just now" for future dates', () => {
    setNow(fixedNow);
    const future = new Date(fixedNow.getTime() + 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(future)).toBe('Just now');
  });

  it('returns hours ago for same day', () => {
    setNow(fixedNow);
    const threeHoursAgo = new Date(fixedNow.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3 hours ago');
  });

  it('returns "1 hour ago" for singular', () => {
    setNow(fixedNow);
    const oneHourAgo = new Date(fixedNow.getTime() - 1 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    setNow(fixedNow);
    const yesterday = new Date(fixedNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(yesterday)).toBe('Yesterday');
  });

  it('returns "X days ago" for 2-6 days', () => {
    setNow(fixedNow);
    const threeDaysAgo = new Date(fixedNow.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns "Last [weekday]" for 7-13 days ago', () => {
    setNow(fixedNow);
    const tenDaysAgo = new Date(fixedNow.getTime() - 10 * 24 * 60 * 60 * 1000);
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][tenDaysAgo.getDay()];
    expect(formatTimeAgo(tenDaysAgo.toISOString())).toBe(`Last ${weekday}`);
  });

  it('returns "X weeks ago" for 14+ days', () => {
    setNow(fixedNow);
    const threeWeeksAgo = new Date(fixedNow.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeWeeksAgo)).toBe('3 weeks ago');
  });

  it('returns "2 weeks ago" for exactly 14 days', () => {
    setNow(fixedNow);
    const twoWeeksAgo = new Date(fixedNow.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(twoWeeksAgo)).toBe('2 weeks ago');
  });
});
