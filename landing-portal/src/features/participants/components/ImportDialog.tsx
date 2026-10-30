'use client';

import { FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { useImportFlow } from '../hooks/useImportFlow';
import { DuplicatePolicyToggle } from './DuplicatePolicyToggle';
import type { DuplicatePolicy } from '../types';

const PREVIEW_LIMIT = 40;

export interface ImportReport {
  duplicatesFound: number;
  duplicatesSkipped: number;
  blankSkipped: number;
  truncated: number;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: readonly string[];
  policy: DuplicatePolicy;
  onPolicyChange: (policy: DuplicatePolicy) => void;
  /** Called when the person confirms; the report lets the parent say what was skipped. */
  onConfirm: (names: string[], report: ImportReport) => void;
}

/** File import: choose or drop a .txt / .csv / .xlsx, pick worksheet + name column, review, confirm. */
export function ImportDialog({ open, onOpenChange, existingNames, policy, onPolicyChange, onConfirm }: ImportDialogProps) {
  const { t } = useTranslation(['projects', 'common']);
  const { number } = useLocale();
  const flow = useImportFlow(existingNames, policy);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { preview } = flow;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void flow.openFile(file);
  };

  const changePolicy = (value: DuplicatePolicy) => {
    flow.setPolicy(value);
    onPolicyChange(value);
  };

  const close = (next: boolean) => {
    if (!next) flow.reset();
    onOpenChange(next);
  };

  const confirm = () => {
    if (!preview) return;
    onConfirm(flow.names, {
      duplicatesFound: preview.duplicatesFound,
      duplicatesSkipped: preview.duplicatesSkipped,
      blankSkipped: preview.blankSkipped,
      truncated: preview.truncated,
    });
    flow.reset();
    onOpenChange(false);
  };

  const shown = flow.names.slice(0, PREVIEW_LIMIT);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl" closeLabel={t('common:close')}>
        <DialogHeader>
          <DialogTitle>{t('projects:import.title')}</DialogTitle>
          <DialogDescription>{t('projects:import.supports')}</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv,.xlsx,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          tabIndex={-1}
          aria-label={t('projects:import.choose')}
          data-testid="import-file-input"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // allow choosing the same file again
          }}
        />

        {!flow.fileName ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
              dragging && 'border-primary bg-primary/5',
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Upload aria-hidden />
            </div>
            <p className="font-semibold">{t('projects:import.dropTitle')}</p>
            {flow.errorCode ? (
              <p role="alert" className="text-sm text-destructive" data-testid="import-error">
                {t(`projects:import.errors.${flow.errorCode}`)}
              </p>
            ) : null}
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={flow.loading} data-testid="import-choose-file">
              {flow.loading ? t('projects:import.reading') : t('projects:import.choose')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4" data-testid="import-preview">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileSpreadsheet className="size-5 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('projects:import.file')}</p>
                <p className="truncate font-medium">{flow.fileName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={flow.loading}>
                {t('projects:import.choose')}
              </Button>
            </div>

            {flow.errorCode ? (
              <p role="alert" className="text-sm text-destructive">
                {t(`projects:import.errors.${flow.errorCode}`)}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {flow.sheetNames.length > 1 ? (
                <div className="grid gap-2">
                  <Label>{t('projects:import.sheet')}</Label>
                  <Select value={String(flow.sheetIndex)} onValueChange={(v) => void flow.selectSheet(Number(v))}>
                    <SelectTrigger className="w-full" data-testid="import-sheet">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {flow.sheetNames.map((name, i) => (
                        <SelectItem key={`${i}-${name}`} value={String(i)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {flow.columns.length > 1 ? (
                <div className="grid gap-2">
                  <Label>{t('projects:import.column')}</Label>
                  <Select value={String(flow.columnIndex)} onValueChange={(v) => flow.setColumn(Number(v))}>
                    <SelectTrigger className="w-full" data-testid="import-column">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {flow.columns.map((c) => (
                        <SelectItem key={c.index} value={String(c.index)}>
                          {t('projects:import.columnOption', { label: c.label, count: c.nonEmpty })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Switch id="import-header" checked={flow.hasHeader} onCheckedChange={flow.setHasHeader} data-testid="import-header-switch" />
              <Label htmlFor="import-header">{t('projects:import.hasHeader')}</Label>
            </div>
            {preview?.headerSkipped ? (
              <p className="text-sm text-muted-foreground">{t('projects:import.headerSkipped', { name: preview.headerSkipped })}</p>
            ) : null}

            <DuplicatePolicyToggle value={flow.policy} onChange={changePolicy} />

            {preview ? (
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('projects:import.stats.rows')} value={number(preview.totalRows)} />
                <Stat label={t('projects:import.stats.valid')} value={number(preview.validRows)} />
                <Stat label={t('projects:import.stats.blank')} value={number(preview.blankSkipped)} />
                <Stat label={t('projects:import.stats.duplicates')} value={number(preview.duplicatesFound)} />
              </dl>
            ) : null}

            <div className="grid gap-2">
              <p className="font-medium">{t('projects:import.previewTitle', { count: flow.names.length })}</p>
              {flow.names.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('projects:import.nothingToImport')}</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader className="sr-only">
                      <TableRow>
                        <TableHead>{t('projects:manage.editLabel')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shown.map((name, i) => (
                        <TableRow key={`${i}-${name}`}>
                          <TableCell className="px-3">{name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {flow.names.length > shown.length ? (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      {t('projects:import.moreRows', { count: flow.names.length - shown.length })}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                {t('common:cancel')}
              </Button>
              <Button onClick={confirm} disabled={flow.names.length === 0 || flow.loading} data-testid="import-confirm">
                {t('projects:import.confirm', { count: flow.names.length })}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <dd className="text-xl font-bold text-primary">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
