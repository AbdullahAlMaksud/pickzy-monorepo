import { vi } from 'vitest';

/** The fake Next.js router used by every component test (see `tests/setup.ts`). */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const navigation = { pathname: '/' };
