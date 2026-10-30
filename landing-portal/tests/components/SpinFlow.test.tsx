import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpinScreen } from '@/features/wheel/components/SpinScreen';
import { renderApp } from '../helpers/renderApp';
import { router } from '../helpers/router';
import { sequenceRng } from '../helpers/rng';
import { createTestApp } from '../helpers/testServices';

const confetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: confetti }));

const SLOW = { timeout: 5000 };

/** The animation is shortened to 600 ms when the person prefers reduced motion. */
function preferReducedMotion() {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as MediaQueryList,
  );
}

async function setUpDraw(names = ['Ayesha', 'Bilal', 'Chitra']) {
  const app = createTestApp({ rng: sequenceRng([0]) });
  const projectId = await app.services.projects.createProject({ name: 'Team lunch', description: '', participantNames: names });
  const { drawId } = await app.services.draws.startOrResume(projectId);
  return { app, drawId };
}

beforeEach(() => {
  confetti.mockClear();
  preferReducedMotion();
});
afterEach(() => vi.restoreAllMocks());

describe('SpinScreen', () => {
  it('shows the wheel, the progress and a spin button before the first spin', async () => {
    const { app, drawId } = await setUpDraw();
    await renderApp(<SpinScreen drawId={drawId} />, { app });

    expect(await screen.findByTestId('spin-button')).toBeEnabled();
    expect(screen.getByTestId('draw-progress')).toHaveTextContent('0');
    const list = within(screen.getByTestId('wheel-list'));
    expect(list.getAllByRole('listitem')).toHaveLength(3);
  });

  it('picks a winner, saves it, and finishes the draw on the result page', async () => {
    const { app, drawId } = await setUpDraw();
    await renderApp(<SpinScreen drawId={drawId} />, { app });

    fireEvent.click(await screen.findByTestId('spin-button'));
    expect(await screen.findByTestId('winner-name', {}, SLOW)).toHaveTextContent('Ayesha');
    expect(screen.getByTestId('winner-place')).toHaveTextContent(/1st/);
    // the result was saved before the animation ended
    expect((await app.services.draws.load(drawId))?.winners.map((w) => w.displayName)).toEqual(['Ayesha']);

    fireEvent.click(screen.getByTestId('winner-finish'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`/draw/${drawId}/result`));
    const detail = await app.services.history.getDetail(drawId);
    expect(detail?.winners.map((w) => w.displayName)).toEqual(['Ayesha']);
  });

  it('lets the person keep going for 2nd place, and removes the first winner from the wheel', async () => {
    const { app, drawId } = await setUpDraw();
    await renderApp(<SpinScreen drawId={drawId} />, { app });

    fireEvent.click(await screen.findByTestId('spin-button'));
    expect(await screen.findByTestId('winner-name', {}, SLOW)).toHaveTextContent('Ayesha');

    fireEvent.click(screen.getByTestId('winner-next'));
    await waitFor(() => expect(screen.getByTestId('winner-name')).toHaveTextContent('Bilal'), { timeout: 8000 });
    expect(screen.getByTestId('winner-place')).toHaveTextContent(/2nd/);

    fireEvent.click(screen.getByTestId('winner-finish'));
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    const detail = await app.services.history.getDetail(drawId);
    expect(detail?.winners.map((w) => w.displayName)).toEqual(['Ayesha', 'Bilal']);
    expect(detail?.session.requestedWinnerCount).toBe(2);
  });
});
