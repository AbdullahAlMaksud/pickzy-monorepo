'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Always holds the newest value. Use it when a delayed callback (setTimeout…) must call the version
 * of a function from the render that exists *then*, not the one from when the callback was scheduled.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
