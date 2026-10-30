import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WinnerDialog } from '@/features/wheel/components/WinnerDialog';
import { renderApp } from '../helpers/renderApp';

const confetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: confetti }));

const baseProps = {
  open: true,
  winnerName: 'Ayesha',
  projectName: 'Team lunch',
  order: 1,
  isLast: true,
  canContinue: true,
  removedFromWheel: true,
  busy: false,
  burstKey: 1,
  onNext: vi.fn(),
  onFinish: vi.fn(),
  onClose: vi.fn(),
};

beforeEach(() => {
  confetti.mockClear();
  Object.values(baseProps).forEach((v) => vi.isMockFunction(v) && v.mockClear());
});

describe('WinnerDialog', () => {
  it('announces the winner and offers 2nd place and finish', async () => {
    await renderApp(<WinnerDialog {...baseProps} />, { preferences: { confetti: false } });
    expect(screen.getByTestId('winner-name')).toHaveTextContent('Ayesha');
    expect(screen.getByTestId('winner-place')).toHaveTextContent('1st');
    expect(screen.getByTestId('winner-next')).toHaveTextContent('2nd');

    fireEvent.click(screen.getByTestId('winner-next'));
    expect(baseProps.onNext).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('winner-finish'));
    expect(baseProps.onFinish).toHaveBeenCalledTimes(1);
  });

  it('hides "next place" when nobody is left to draw', async () => {
    await renderApp(<WinnerDialog {...baseProps} canContinue={false} />, { preferences: { confetti: false } });
    expect(screen.queryByTestId('winner-next')).not.toBeInTheDocument();
    expect(screen.getByTestId('winner-finish')).toBeInTheDocument();
  });

  it('hides "finish" while more winners are still planned', async () => {
    await renderApp(<WinnerDialog {...baseProps} isLast={false} />, { preferences: { confetti: false } });
    expect(screen.queryByTestId('winner-finish')).not.toBeInTheDocument();
  });

  it('shoots confetti only when the preference is on', async () => {
    await renderApp(<WinnerDialog {...baseProps} />, { preferences: { confetti: true } });
    await vi.waitFor(() => expect(confetti).toHaveBeenCalled());

    confetti.mockClear();
    const { unmount } = await renderApp(<WinnerDialog {...baseProps} />, { preferences: { confetti: false } });
    await new Promise((r) => setTimeout(r, 50));
    expect(confetti).not.toHaveBeenCalled();
    unmount();
  });
});

