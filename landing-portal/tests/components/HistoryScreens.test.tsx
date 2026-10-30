import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HistoryDetailScreen } from '@/features/history/components/HistoryDetailScreen';
import { HistoryScreen } from '@/features/history/components/HistoryScreen';
import { renderApp } from '../helpers/renderApp';
import { sequenceRng } from '../helpers/rng';
import { createTestApp, type TestApp } from '../helpers/testServices';

/** Runs a whole draw through the services and returns its id. */
async function finishedDraw(app: TestApp, name: string, names: string[], winners = 1) {
  const projectId = await app.services.projects.createProject({ name, description: '', participantNames: names });
  const { drawId } = await app.services.draws.startOrResume(projectId);
  for (let i = 0; i < winners; i++) {
    if (i > 0) await app.services.draws.addWinnerSlot(drawId);
    const { winner } = await app.services.draws.spin(drawId);
    await app.services.draws.acknowledgeWinner(winner.id);
  }
  await app.services.draws.finish(drawId);
  return drawId;
}

describe('HistoryScreen', () => {
  it('shows an empty state before any draw is finished', async () => {
    await renderApp(<HistoryScreen />);
    expect(await screen.findByText(/no draws yet/i)).toBeInTheDocument();
  });

  it('lists finished draws and filters them by project or winner name', async () => {
    const app = createTestApp({ rng: sequenceRng([0]) });
    const lunch = await finishedDraw(app, 'Team lunch', ['Ayesha', 'Bilal']);
    await finishedDraw(app, 'Book club', ['Chitra', 'Dev']);
    await renderApp(<HistoryScreen />, { app });

    const list = await screen.findByTestId('history-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByTestId(`history-${lunch}`)).toHaveAttribute('href', `/history/${lunch}`);

    fireEvent.change(screen.getByTestId('history-search'), { target: { value: 'chitra' } });
    await waitFor(() => expect(within(screen.getByTestId('history-list')).getAllByRole('listitem')).toHaveLength(1));
    expect(screen.getByText('Book club')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('history-search'), { target: { value: 'nobody' } });
    expect(await screen.findByText(/no draws match/i)).toBeInTheDocument();
  });
});

describe('HistoryDetailScreen', () => {
  it('shows winners in order, the rules and the roster snapshot', async () => {
    const app = createTestApp({ rng: sequenceRng([0]) });
    const id = await finishedDraw(app, 'Team lunch', ['Ayesha', 'Bilal', 'Chitra'], 2);
    await renderApp(<HistoryDetailScreen historyId={id} />, { app });

    const winners = await screen.findByTestId('history-winners');
    expect(within(winners).getByText('Ayesha')).toBeInTheDocument();
    expect(within(winners).getByText('Bilal')).toBeInTheDocument();
    expect(screen.getByTestId('rules-summary')).toBeInTheDocument();
    expect(screen.getAllByText('Chitra')).toHaveLength(1); // only in the roster, not a winner
  });

  it('shows a not-found message for an unknown draw', async () => {
    await renderApp(<HistoryDetailScreen historyId={999} />);
    expect(await screen.findByText(/couldn't be found/i)).toBeInTheDocument();
  });

  it('copies the result when the browser has no share sheet', async () => {
    const app = createTestApp({ rng: sequenceRng([0]) });
    const id = await finishedDraw(app, 'Team lunch', ['Ayesha', 'Bilal']);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

    await renderApp(<HistoryDetailScreen historyId={id} />, { app });
    fireEvent.click(await screen.findByTestId('history-share'));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('Team lunch');
    expect(writeText.mock.calls[0][0]).toContain('Ayesha');
  });
});
