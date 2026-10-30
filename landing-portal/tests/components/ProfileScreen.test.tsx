import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProfileScreen } from '@/features/profile/components/ProfileScreen';
import i18n from '@/i18n';
import { renderApp } from '../helpers/renderApp';

const screenUnderTest = (
  <ThemeProvider attribute="class" themes={['light', 'dark', 'colorful']} defaultTheme="light" enableSystem={false}>
    <ProfileScreen />
  </ThemeProvider>
);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

describe('ProfileScreen', () => {
  it('saves the display name to the database, trimmed', async () => {
    const { app } = await renderApp(screenUnderTest);
    const save = screen.getByTestId('save-profile');
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByTestId('display-name'), { target: { value: '  Maksud  ' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(async () => expect((await app.services.preferences.load()).displayName).toBe('Maksud'));
    await waitFor(() => expect(save).toBeDisabled());
  });

  it('remembers the confetti switch', async () => {
    const { app } = await renderApp(screenUnderTest);
    const toggle = screen.getByTestId('confetti-switch');
    expect(toggle).toBeChecked();

    await userEvent.click(toggle);
    await waitFor(async () => expect((await app.services.preferences.load()).confetti).toBe(false));
    expect(toggle).not.toBeChecked();
  });

  it('applies the chosen theme to the page', async () => {
    await renderApp(screenUnderTest);
    await userEvent.click(await screen.findByRole('radio', { name: /dark/i }));
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    await userEvent.click(screen.getByRole('radio', { name: /colorful/i }));
    await waitFor(() => expect(document.documentElement).toHaveClass('colorful'));
  });

  it('switches the language and saves it', async () => {
    const { app } = await renderApp(screenUnderTest);
    await userEvent.click(screen.getByTestId('language-select'));
    await userEvent.click(await screen.findByRole('option', { name: 'বাংলা' }));

    await waitFor(async () => expect((await app.services.preferences.load()).locale).toBe('bn'));
    expect(i18n.language).toBe('bn');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('প্রোফাইল');
  });
});
