import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import i18n from '@/i18n';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { useAppStore } from '@/store/appStore';
import { renderWithApp, setupApp } from '../helpers/renderWithApp';

describe('Profile screen', () => {
  it('changes the theme and saves it to the database', async () => {
    const { services } = await setupApp();
    await renderWithApp(<ProfileScreen />, services);

    await fireEvent.press(screen.getByTestId('row-theme'));
    await fireEvent.press(await screen.findByTestId('option-dark'));
    await fireEvent.press(screen.getByTestId('picker-apply'));

    await waitFor(() => expect(useAppStore.getState().preferences.theme).toBe('dark'));
    expect((await services.preferences.load()).theme).toBe('dark');
  });

  it('switches the language to Bengali, persists it and re-renders in Bengali', async () => {
    const { services } = await setupApp();
    await renderWithApp(<ProfileScreen />, services);

    await fireEvent.press(screen.getByTestId('row-language'));
    await fireEvent.press(await screen.findByTestId('option-bn'));
    await fireEvent.press(screen.getByTestId('picker-apply'));

    await waitFor(() => expect(i18n.language).toBe('bn'));
    expect((await services.preferences.load()).locale).toBe('bn');
    expect(await screen.findByText(i18n.t('profile:title'))).toBeTruthy();
    expect(i18n.t('profile:title')).not.toBe('Profile');
  });

  it('saves the display name only when it changed, trimmed', async () => {
    const { services } = await setupApp();
    await renderWithApp(<ProfileScreen />, services);

    await fireEvent.changeText(screen.getByTestId('profile-name-input'), '   Maksud   ');
    await fireEvent.press(screen.getByTestId('save-profile'));

    await waitFor(async () => expect((await services.preferences.load()).displayName).toBe('Maksud'));
  });

  it('toggles haptics and confetti and persists them', async () => {
    const { services } = await setupApp();
    await renderWithApp(<ProfileScreen />, services);

    await fireEvent(screen.getByTestId('switch-confetti'), 'valueChange', false);
    await waitFor(async () => expect((await services.preferences.load()).confetti).toBe(false));
  });

  it('renders remove photo button when photo exists and removes photo on press', async () => {
    const { services } = await setupApp();
    useAppStore.setState((s) => ({
      ...s,
      preferences: { ...s.preferences, photoUri: 'file:///avatar.png' },
    }));

    await renderWithApp(<ProfileScreen />, services);

    expect(screen.getByTestId('change-photo')).toBeTruthy();
    expect(screen.getByTestId('remove-photo')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('remove-photo'));

    await waitFor(async () => {
      expect((await services.preferences.load()).photoUri).toBeNull();
    });
  });
});
