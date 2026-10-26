import { fireEvent, screen } from '@testing-library/react-native';
import { WinnerModal } from '@/features/wheel/components/WinnerModal';
import { renderWithApp, setupApp } from '../helpers/renderWithApp';

const baseProps = {
  visible: true,
  winnerId: 7,
  winnerName: 'Nusrat',
  projectName: 'Team Lunch',
  order: 1,
  isLast: false,
  canContinue: true,
  removedFromWheel: true,
  busy: false,
  colorIndex: 0,
  onNext: jest.fn(),
  onFinish: jest.fn(),
  onClose: jest.fn(),
};

describe('WinnerModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('announces the winner with heading, name, project and position', async () => {
    const { services } = await setupApp();
    await renderWithApp(<WinnerModal {...baseProps} />, services);
    expect(screen.getByText('We Have a Winner!')).toBeTruthy();
    expect(screen.getByText('Nusrat')).toBeTruthy();
    expect(screen.getByText('Project: Team Lunch')).toBeTruthy();
    expect(screen.getByText('1st place')).toBeTruthy();
    expect(screen.getByText('Result saved')).toBeTruthy();
  });

  it('offers the next place while winners remain, and says the winner leaves the wheel', async () => {
    const { services } = await setupApp();
    await renderWithApp(<WinnerModal {...baseProps} />, services);
    await fireEvent.press(screen.getByText('Spin for 2nd place'));
    expect(baseProps.onNext).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Nusrat is off the wheel for the next spin.')).toBeTruthy();
    expect(screen.queryByText('Finish Draw')).toBeNull();
  });

  it('offers both the next place and "Finish Draw" after the last planned winner', async () => {
    const { services } = await setupApp();
    await renderWithApp(<WinnerModal {...baseProps} order={3} isLast />, services);
    expect(screen.getByText('Spin for 4th place')).toBeTruthy();
    await fireEvent.press(screen.getByText('Finish Draw'));
    expect(baseProps.onFinish).toHaveBeenCalledTimes(1);
  });

  it('offers only "Finish Draw" when nobody is left to pick', async () => {
    const { services } = await setupApp();
    await renderWithApp(<WinnerModal {...baseProps} order={3} isLast canContinue={false} />, services);
    expect(screen.queryByTestId('winner-next')).toBeNull();
    expect(screen.getByTestId('winner-finish')).toBeTruthy();
  });

  it('is fully translated in Bengali', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    await renderWithApp(<WinnerModal {...baseProps} />, services);
    expect(screen.queryByText('We Have a Winner!')).toBeNull();
    expect(screen.getByText('Nusrat')).toBeTruthy();
    expect(screen.getByTestId('winner-heading')).toBeTruthy();
    expect(screen.getByText('১ম স্থান')).toBeTruthy();
    expect(screen.getByText('২য় স্থানের জন্য ঘোরান')).toBeTruthy();
  });
});
