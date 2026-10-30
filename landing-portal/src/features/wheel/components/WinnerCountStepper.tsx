'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';

interface WinnerCountStepperProps {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/** − / + control for a whole number between `min` and `max`. */
export function WinnerCountStepper({ value, min, max, disabled, onChange }: WinnerCountStepperProps) {
  const { t } = useTranslation('wheel');
  const { number } = useLocale();
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={t('settingsScreen.decrease')}
        data-testid="winners-decrease"
      >
        <Minus />
      </Button>
      <output className="min-w-10 text-center text-xl font-bold" aria-live="polite" data-testid="winners-value">
        {number(value)}
      </output>
      <Button
        variant="outline"
        size="icon"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={t('settingsScreen.increase')}
        data-testid="winners-increase"
      >
        <Plus />
      </Button>
    </div>
  );
}
