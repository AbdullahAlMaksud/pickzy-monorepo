import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SpinScreen } from '@/features/wheel/screens/SpinScreen';
import { createDrawRepository } from '@/database/repositories/drawRepository';
import { renderWithApp, setupApp } from '../helpers/renderWithApp';
import { sequenceRng } from '../helpers/testDatabase';

async function startDraw(rng: () => number, winners: number) {
  const { services, testDb } = await setupApp({ rng });
  const repo = createDrawRepository(testDb.db);
  const projectId = await services.projects.createProject({
    name: 'Team Lunch',
    description: '',
    participantNames: ['Rahim', 'Nusrat', 'Tanzim'],
  });
  const { drawId } = await services.draws.startOrResume(projectId);
  await services.draws.updateRules(drawId, {
    requestedWinnerCount: winners,
    allowRepeatWinners: false,
    removeSelectedWinners: false,
  });
  const winnerNames = async () => (await repo.listWinners(drawId)).map((w) => w.displayName);
  const status = async () => (await repo.getSession(drawId))!.status;
  return { services, drawId, winnerNames, status };
}

describe('Spin screen', () => {
  it('draws two different winners in a row and saves each one before it is shown', async () => {
    const { services, drawId, winnerNames } = await startDraw(sequenceRng([0, 0]), 2);
    await renderWithApp(<SpinScreen drawId={drawId} />, services);

    await fireEvent.press(await screen.findByTestId('spin-button'));
    expect(await screen.findByTestId('winner-modal')).toBeTruthy();
    expect(screen.getByTestId('winner-name')).toHaveTextContent('Rahim');
    // Persisted already, before the person acknowledged it.
    expect(await winnerNames()).toEqual(['Rahim']);

    await fireEvent.press(screen.getByTestId('winner-next'));
    await fireEvent.press(await screen.findByTestId('spin-button'));
    await waitFor(() => expect(screen.getByTestId('winner-name')).toHaveTextContent('Nusrat'));
    expect(await winnerNames()).toEqual(['Rahim', 'Nusrat']);
  });

  it('finishes the draw from the winner modal and marks it completed', async () => {
    const { services, drawId, status } = await startDraw(sequenceRng([0]), 1);
    await renderWithApp(<SpinScreen drawId={drawId} />, services);

    await fireEvent.press(await screen.findByTestId('spin-button'));
    await screen.findByTestId('winner-modal');
    await fireEvent.press(screen.getByTestId('winner-finish'));

    await waitFor(async () => expect(await status()).toBe('completed'));
  });
});

describe('Spin screen: picking more places', () => {
  it('offers the next place after the last planned winner and takes earlier winners off the wheel', async () => {
    const { services, drawId, winnerNames } = await startDraw(sequenceRng([0, 0, 0]), 1);
    await renderWithApp(<SpinScreen drawId={drawId} />, services);

    await fireEvent.press(await screen.findByTestId('spin-button'));
    expect(await screen.findByTestId('winner-name')).toHaveTextContent('Rahim');
    // Last planned winner, but two people remain: both "next place" and "finish" are offered.
    expect(screen.getByText('Spin for 2nd place')).toBeTruthy();
    expect(screen.getByTestId('winner-finish')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('winner-next'));
    await fireEvent.press(await screen.findByTestId('spin-button'));
    await waitFor(() => expect(screen.getByTestId('winner-name')).toHaveTextContent('Nusrat'));
    expect(await winnerNames()).toEqual(['Rahim', 'Nusrat']);
    expect(screen.getByText('Spin for 3rd place')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('winner-next'));
    await fireEvent.press(await screen.findByTestId('spin-button'));
    await waitFor(() => expect(screen.getByTestId('winner-name')).toHaveTextContent('Tanzim'));
    // Nobody is left: only Finish is offered.
    expect(screen.queryByTestId('winner-next')).toBeNull();
    expect(screen.getByTestId('winner-finish')).toBeTruthy();
  });

  it('shows a "spin for next place" button on the screen after the modal was closed', async () => {
    const { services, drawId, winnerNames } = await startDraw(sequenceRng([0, 0]), 1);
    await renderWithApp(<SpinScreen drawId={drawId} />, services);

    await fireEvent.press(await screen.findByTestId('spin-button'));
    await screen.findByTestId('winner-modal');
    await fireEvent.press(screen.getByTestId('winner-close'));

    await fireEvent.press(await screen.findByTestId('spin-more'));
    await waitFor(() => expect(screen.getByTestId('winner-name')).toHaveTextContent('Nusrat'), { timeout: 3000 });
    expect(await winnerNames()).toEqual(['Rahim', 'Nusrat']);
  });
});
