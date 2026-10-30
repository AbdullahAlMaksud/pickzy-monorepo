'use client';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DuplicatePolicy } from '../types';

interface DuplicatePolicyToggleProps {
  value: DuplicatePolicy;
  onChange: (policy: DuplicatePolicy) => void;
}

const POLICIES: readonly DuplicatePolicy[] = ['keep', 'skip'];

/** Chooses what happens to names that already exist: keep them (default) or skip them (and report). */
export function DuplicatePolicyToggle({ value, onChange }: DuplicatePolicyToggleProps) {
  const { t } = useTranslation('projects');
  const groupId = useId();
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{t('duplicates.title')}</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as DuplicatePolicy)} className="gap-2">
        {POLICIES.map((policy) => (
          <div key={policy} className="flex items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem value={policy} id={`${groupId}-${policy}`} className="mt-0.5" data-testid={`dup-policy-${policy}`} />
            <Label htmlFor={`${groupId}-${policy}`} className="grid cursor-pointer gap-1 font-normal">
              <span className="font-medium">{t(`duplicates.${policy}`)}</span>
              <span className="text-xs text-muted-foreground">{t(`duplicates.${policy}Hint`)}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
