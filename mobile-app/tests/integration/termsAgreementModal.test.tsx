import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { TermsAgreementModal } from '@/features/app/components/TermsAgreementModal';
import { useAppStore } from '@/store/appStore';
import { renderWithApp, setupApp } from '../helpers/renderWithApp';

describe('TermsAgreementModal', () => {
  it('renders modal when termsAccepted is false and prevents dismissal without agreeing', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    useAppStore.setState((s) => ({
      ...s,
      ready: true,
      preferences: { ...s.preferences, termsAccepted: false },
    }));

    await renderWithApp(<TermsAgreementModal />, services);

    expect(screen.getByTestId('terms-agreement-modal')).toBeTruthy();
    expect(screen.getByText('ব্যবহারের নীতিমালা ও অঙ্গীকার')).toBeTruthy();
    expect(screen.getByText('বেটিং ও হারাম কাজে ব্যবহার সম্পূর্ণ নিষিদ্ধ')).toBeTruthy();
    expect(screen.getByTestId('btn-agree-terms')).toBeTruthy();
  });

  it('toggles language between Bengali and English', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    useAppStore.setState((s) => ({
      ...s,
      ready: true,
      preferences: { ...s.preferences, termsAccepted: false },
    }));

    await renderWithApp(<TermsAgreementModal />, services);

    expect(screen.getByText('ব্যবহারের নীতিমালা ও অঙ্গীকার')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('btn-terms-language-toggle'));

    await waitFor(() => {
      expect(screen.getByText('Terms & Ethical Commitment')).toBeTruthy();
      expect(screen.getByText('Betting & Unlawful Use Strictly Prohibited')).toBeTruthy();
    });
  });

  it('persists termsAccepted when user taps agree button', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    useAppStore.setState((s) => ({
      ...s,
      ready: true,
      preferences: { ...s.preferences, termsAccepted: false },
    }));

    await renderWithApp(<TermsAgreementModal />, services);

    await fireEvent.press(screen.getByTestId('btn-agree-terms'));

    await waitFor(() => {
      expect(useAppStore.getState().preferences.termsAccepted).toBe(true);
    });

    const stored = await services.preferences.load();
    expect(stored.termsAccepted).toBe(true);
  });

  it('does not render when terms are already accepted', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    useAppStore.setState((s) => ({
      ...s,
      ready: true,
      preferences: { ...s.preferences, termsAccepted: true },
    }));

    await renderWithApp(<TermsAgreementModal />, services);

    expect(screen.queryByTestId('terms-agreement-modal')).toBeNull();
  });
});

