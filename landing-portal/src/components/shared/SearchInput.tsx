'use client';

import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  testId?: string;
}

export function SearchInput({ value, onChange, placeholder, className, testId }: SearchInputProps) {
  const { t } = useTranslation('common');
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="px-9 [&::-webkit-search-cancel-button]:hidden"
        data-testid={testId}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => onChange('')}
          aria-label={t('clearSearch')}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
