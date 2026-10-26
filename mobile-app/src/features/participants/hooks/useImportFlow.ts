import { useCallback, useMemo, useState } from 'react';
import { pickAndOpenImportFile } from '@/import/documentPicker';
import {
  buildImportPreview,
  columnCount,
  detectColumns,
  detectHeaderRow,
  suggestColumn,
} from '@/import/importValidation';
import { ImportError, type ColumnInfo, type ImportDocument, type ImportErrorCode, type ImportPreview } from '@/import/types';
import type { DuplicatePolicy } from '../types';

interface LoadedFile {
  document: ImportDocument;
  sheetIndex: number;
  rows: string[][];
}

export interface ImportFlow {
  loading: boolean;
  errorCode: ImportErrorCode | null;
  fileName: string | null;
  sheetNames: string[];
  sheetIndex: number;
  columns: ColumnInfo[];
  columnIndex: number;
  hasHeader: boolean;
  policy: DuplicatePolicy;
  preview: ImportPreview | null;
  /** Names that will be added if the user confirms. */
  names: string[];
  chooseFile: () => Promise<void>;
  selectSheet: (index: number) => Promise<void>;
  setColumn: (index: number) => void;
  setHasHeader: (value: boolean) => void;
  setPolicy: (policy: DuplicatePolicy) => void;
  reset: () => void;
}

/**
 * State machine behind the import UI: pick file -> parse (off the UI thread in slices) -> choose
 * worksheet / name column / header -> live preview -> confirm. Nothing is added until the caller
 * uses `names`.
 */
export function useImportFlow(existingNames: readonly string[], initialPolicy: DuplicatePolicy = 'keep'): ImportFlow {
  const [loaded, setLoaded] = useState<LoadedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ImportErrorCode | null>(null);
  const [columnIndex, setColumnIndex] = useState(0);
  const [hasHeader, setHasHeaderState] = useState(false);
  const [policy, setPolicy] = useState<DuplicatePolicy>(initialPolicy);

  const applyRows = useCallback((rows: string[][]) => {
    const header = detectHeaderRow(rows);
    setHasHeaderState(header);
    setColumnIndex(suggestColumn(rows, header));
  }, []);

  const fail = useCallback((error: unknown) => {
    setErrorCode(error instanceof ImportError ? error.code : 'READ_FAILED');
  }, []);

  const chooseFile = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);
    try {
      const document = await pickAndOpenImportFile();
      if (!document) return; // cancelled
      const rows = await document.loadSheet(0);
      if (columnCount(rows) === 0) throw new ImportError('NO_VALID_ROWS');
      setLoaded({ document, sheetIndex: 0, rows });
      applyRows(rows);
    } catch (error) {
      setLoaded(null);
      fail(error);
    } finally {
      setLoading(false);
    }
  }, [applyRows, fail]);

  const selectSheet = useCallback(
    async (index: number) => {
      if (!loaded || index === loaded.sheetIndex) return;
      setLoading(true);
      setErrorCode(null);
      try {
        const rows = await loaded.document.loadSheet(index);
        setLoaded({ document: loaded.document, sheetIndex: index, rows });
        applyRows(rows);
      } catch (error) {
        fail(error);
      } finally {
        setLoading(false);
      }
    },
    [loaded, applyRows, fail],
  );

  const setHasHeader = useCallback(
    (value: boolean) => {
      setHasHeaderState(value);
      if (loaded) setColumnIndex(suggestColumn(loaded.rows, value));
    },
    [loaded],
  );

  const reset = useCallback(() => {
    setLoaded(null);
    setErrorCode(null);
    setLoading(false);
  }, []);

  const columns = useMemo(() => (loaded ? detectColumns(loaded.rows, hasHeader) : []), [loaded, hasHeader]);

  const preview = useMemo(() => {
    if (!loaded) return null;
    return buildImportPreview(loaded.rows, { columnIndex, hasHeader, duplicatePolicy: policy, existingNames });
  }, [loaded, columnIndex, hasHeader, policy, existingNames]);

  // buildImportPreview already returns the final names; keep them alongside the numbers.
  const names = preview?.names ?? [];

  return {
    loading,
    errorCode,
    fileName: loaded?.document.fileName ?? null,
    sheetNames: loaded?.document.sheetNames ?? [],
    sheetIndex: loaded?.sheetIndex ?? 0,
    columns,
    columnIndex,
    hasHeader,
    policy,
    preview,
    names,
    chooseFile,
    selectSheet,
    setColumn: setColumnIndex,
    setHasHeader,
    setPolicy,
    reset,
  };
}
