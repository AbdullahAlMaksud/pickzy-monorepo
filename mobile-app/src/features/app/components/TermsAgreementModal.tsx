import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { usePreferences } from '@/features/profile/hooks/usePreferences';
import { useAppStore } from '@/store/appStore';
import { haptic } from '@/utils/haptics';

export function TermsAgreementModal() {
  const { t, i18n } = useTranslation('common');
  const { setTermsAccepted, setLocale } = usePreferences();
  const ready = useAppStore((s) => s.ready);
  const termsAccepted = useAppStore((s) => s.preferences.termsAccepted);
  const [submitting, setSubmitting] = useState(false);

  // If the app bootstrap is not ready or user already accepted terms, do not render.
  if (!ready || termsAccepted) return null;

  const currentLocale = i18n.language?.startsWith('bn') ? 'bn' : 'en';

  const toggleLanguage = async () => {
    const nextLocale = currentLocale === 'bn' ? 'en' : 'bn';
    haptic.selection();
    await setLocale(nextLocale);
  };

  const handleAgree = async () => {
    setSubmitting(true);
    haptic.success();
    try {
      await setTermsAccepted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      visible={!termsAccepted}
      onClose={() => {}}
      dismissable={false}
      showClose={false}
      variant="center"
      testID="terms-agreement-modal"
    >
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <Icon name="shield-check" size="xs" color="primary" />
          <AppText variant="caption" weight="semibold" tone="primary">
            {t('termsModal.badge')}
          </AppText>
        </View>

        <Pressable
          onPress={toggleLanguage}
          accessibilityRole="button"
          accessibilityLabel={currentLocale === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
          style={styles.langButton}
          testID="btn-terms-language-toggle"
        >
          <Icon name="languages" size="xs" color="textSecondary" />
          <AppText variant="caption" weight="bold" tone="secondary">
            {currentLocale === 'bn' ? 'English' : 'বাংলা'}
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.iconCircle}>
          <Icon name="shield-check" size="lg" color="primary" />
        </View>

        <AppText variant="title" weight="bold" align="center" style={styles.title}>
          {t('termsModal.title')}
        </AppText>

        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Icon name="shield-alert" size="sm" color="error" />
            <AppText variant="label" weight="bold" tone="error" style={styles.noticeTitle}>
              {t('termsModal.prohibitionTitle')}
            </AppText>
          </View>

          <AppText variant="body" tone="text" style={styles.paragraph}>
            {t('termsModal.purpose')}
          </AppText>

          <AppText variant="body" weight="semibold" tone="error" style={styles.paragraph}>
            {t('termsModal.prohibition')}
          </AppText>

          <AppText variant="caption" tone="secondary" style={styles.paragraph}>
            {t('termsModal.request')}
          </AppText>
        </View>

        <View style={styles.pledgeCard}>
          <Icon name="badge-check" size="sm" color="primary" />
          <AppText variant="caption" weight="semibold" tone="primary" style={styles.pledgeText}>
            {t('termsModal.pledge')}
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.actionContainer}>
        <AppButton
          label={t('termsModal.agreeButton')}
          variant="primary"
          loading={submitting}
          onPress={handleAgree}
          testID="btn-agree-terms"
          fullWidth
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.xs,
  },
  noticeCard: {
    width: '100%',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  noticeTitle: {
    flex: 1,
  },
  paragraph: {
    lineHeight: 22,
  },
  pledgeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primarySoft,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pledgeText: {
    flex: 1,
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    paddingTop: theme.spacing.xs,
  },
}));
