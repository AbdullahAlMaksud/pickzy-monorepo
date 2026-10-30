'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useServices } from '@/lib/services-context';
import { useDrawErrorMessage } from './useDrawErrors';

/** Opens the project's unfinished draw or starts a new one, then goes to the wheel. */
export function useStartDraw(projectId: number) {
  const { draws } = useServices();
  const router = useRouter();
  const errorMessage = useDrawErrorMessage();
  const [starting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      const { drawId } = await draws.startOrResume(projectId);
      router.push(`/draw/${drawId}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setStarting(false);
    }
  }, [draws, projectId, router, errorMessage]);

  return { start, starting };
}
