import { dayPartOf, formatDate, formatNumber, formatOrdinal, formatRelativeDateTime, formatTime, localizeDigits } from '@/lib/format';
import { contrastRatio, readableTextColor } from '@/lib/color';
import { wheelPalette } from '@/features/wheel/constants';

describe('number and date formatting', () => {
  it('uses Bengali digits only in Bengali', () => {
    expect(formatNumber(1205, 'bn')).toBe('১২০৫');
    expect(formatNumber(1205, 'en')).toBe('1205');
    expect(localizeDigits('Apr 14', 'bn')).toBe('Apr ১৪');
  });

  it('formats dates and times per language', () => {
    const d = new Date(2025, 3, 14, 14, 30).getTime();
    expect(formatDate(d, 'en')).toBe('Apr 14, 2025');
    expect(formatDate(d, 'bn')).toBe('১৪ এপ্রিল, ২০২৫');
    expect(formatTime(d, 'en')).toBe('2:30 PM');
    expect(formatTime(d, 'bn')).toBe('২:৩০ অপরাহ্ণ');
    expect(formatTime(new Date(2025, 0, 1, 0, 5).getTime(), 'en')).toBe('12:05 AM');
  });

  it('says Today/Yesterday for recent dates', () => {
    const now = new Date(2025, 3, 14, 18, 0).getTime();
    expect(formatRelativeDateTime(new Date(2025, 3, 14, 14, 30).getTime(), 'en', now)).toBe('Today, 2:30 PM');
    expect(formatRelativeDateTime(new Date(2025, 3, 13, 9, 5).getTime(), 'en', now)).toBe('Yesterday, 9:05 AM');
    expect(formatRelativeDateTime(new Date(2025, 3, 1, 9, 5).getTime(), 'en', now)).toBe('Apr 1, 2025, 9:05 AM');
    expect(formatRelativeDateTime(new Date(2025, 3, 14, 14, 30).getTime(), 'bn', now)).toMatch(/^আজ,/);
  });

  it('chooses the greeting part of the day', () => {
    expect(dayPartOf(new Date(2025, 0, 1, 8).getTime())).toBe('morning');
    expect(dayPartOf(new Date(2025, 0, 1, 13).getTime())).toBe('afternoon');
    expect(dayPartOf(new Date(2025, 0, 1, 20).getTime())).toBe('evening');
  });
});

describe('wheel label contrast', () => {
  it('picks a readable text color for every wheel segment color (WCAG >= 3:1 for large text)', () => {
    for (const color of wheelPalette) {
      expect(contrastRatio(color, readableTextColor(color))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('formatOrdinal', () => {
  it('formats English ordinals including 11th-13th', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 112].map((n) => formatOrdinal(n, 'en'))).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st', '112th',
    ]);
  });
  it('formats Bengali ordinals', () => {
    expect([1, 2, 3, 4, 5, 6, 10, 11, 25].map((n) => formatOrdinal(n, 'bn'))).toEqual([
      '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '১০ম', '১১তম', '২৫তম',
    ]);
  });
});
