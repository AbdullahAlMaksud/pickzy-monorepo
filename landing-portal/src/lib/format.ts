import type { LocaleCode } from '@/features/profile/types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Replaces ASCII digits with Bengali digits when the locale is Bengali. */
export function localizeDigits(text: string, locale: string): string {
  if (locale !== 'bn') return text;
  return text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatNumber(value: number, locale: string): string {
  return localizeDigits(String(value), locale);
}

const MONTHS: Record<LocaleCode, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  bn: [
    'জানু',
    'ফেব্রু',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টে',
    'অক্টো',
    'নভে',
    'ডিসে',
  ],
};

const MERIDIEM: Record<LocaleCode, { am: string; pm: string }> = {
  en: { am: 'AM', pm: 'PM' },
  bn: { am: 'পূর্বাহ্ণ', pm: 'অপরাহ্ণ' },
};

const DAY_WORDS: Record<LocaleCode, { today: string; yesterday: string }> = {
  en: { today: 'Today', yesterday: 'Yesterday' },
  bn: { today: 'আজ', yesterday: 'গতকাল' },
};

function asLocale(locale: string): LocaleCode {
  return locale === 'bn' ? 'bn' : 'en';
}

/** "Apr 14, 2025" / "১৪ এপ্রিল, ২০২৫" */
export function formatDate(timestamp: number, locale: string): string {
  const loc = asLocale(locale);
  const d = new Date(timestamp);
  const month = MONTHS[loc][d.getMonth()];
  const text = loc === 'bn' ? `${d.getDate()} ${month}, ${d.getFullYear()}` : `${month} ${d.getDate()}, ${d.getFullYear()}`;
  return localizeDigits(text, loc);
}

/** "2:30 PM" / "২:৩০ অপরাহ্ণ" */
export function formatTime(timestamp: number, locale: string): string {
  const loc = asLocale(locale);
  const d = new Date(timestamp);
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const suffix = hours24 < 12 ? MERIDIEM[loc].am : MERIDIEM[loc].pm;
  return localizeDigits(`${hours12}:${minutes} ${suffix}`, loc);
}

export function formatDateTime(timestamp: number, locale: string): string {
  return `${formatDate(timestamp, locale)}, ${formatTime(timestamp, locale)}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Today, 2:30 PM", "Yesterday, 9:05 AM" or the full date and time. */
export function formatRelativeDateTime(timestamp: number, locale: string, now: number = Date.now()): string {
  const loc = asLocale(locale);
  const diffDays = Math.round((startOfDay(now) - startOfDay(timestamp)) / 86_400_000);
  if (diffDays === 0) return `${DAY_WORDS[loc].today}, ${formatTime(timestamp, locale)}`;
  if (diffDays === 1) return `${DAY_WORDS[loc].yesterday}, ${formatTime(timestamp, locale)}`;
  return formatDateTime(timestamp, locale);
}

/** Date only, with "Today"/"Yesterday" for recent days. */
export function formatRelativeDate(timestamp: number, locale: string, now: number = Date.now()): string {
  const loc = asLocale(locale);
  const diffDays = Math.round((startOfDay(now) - startOfDay(timestamp)) / 86_400_000);
  if (diffDays === 0) return DAY_WORDS[loc].today;
  if (diffDays === 1) return DAY_WORDS[loc].yesterday;
  return formatDate(timestamp, locale);
}

export type DayPart = 'morning' | 'afternoon' | 'evening';

export function dayPartOf(timestamp: number): DayPart {
  const h = new Date(timestamp).getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const BN_ORDINALS: Record<number, string> = { 1: '১ম', 2: '২য়', 3: '৩য়', 4: '৪র্থ', 5: '৫ম', 6: '৬ষ্ঠ', 7: '৭ম', 8: '৮ম', 9: '৯ম', 10: '১০ম' };

/** 1 → "1st" / "১ম", 2 → "2nd" / "২য়", 3 → "3rd" / "৩য়", 11 → "11th" / "১১তম". */
export function formatOrdinal(n: number, locale: string): string {
  if (locale === 'bn') return BN_ORDINALS[n] ?? `${formatNumber(n, 'bn')}তম`;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
  return `${n}${suffix}`;
}
