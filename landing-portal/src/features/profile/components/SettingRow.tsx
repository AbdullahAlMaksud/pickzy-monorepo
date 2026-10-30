import type { ReactNode } from 'react';

interface SettingRowProps {
  id: string;
  label: string;
  hint?: string;
  /** The control (switch, select…) shown at the end of the row. */
  children: ReactNode;
}

/** Label and hint on the left, the control on the right. */
export function SettingRow({ id, label, hint, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
