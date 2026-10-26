import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { SafeScreen, ScreenHeader } from '@/components/layout';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLogo,
  AppSwitch,
  AppText,
  Avatar,
  Icon,
} from '@/components/ui';
import { showToast } from '@/store/toastStore';
import { SettingRow } from '@/features/wheel/components/SettingRow';
import { SettingsGroup } from '@/features/wheel/components/SettingsGroup';
import { FONT_OPTIONS } from '@/theme/typography';
import { FontSelector } from '../components/FontSelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeSelector } from '../components/ThemeSelector';
import { usePreferences } from '../hooks/usePreferences';
import { deleteStoredPhoto, photoExists, pickAndStoreProfilePhoto } from '../services/photoService';
import { MAX_DISPLAY_NAME, normalizeDisplayName } from '../services/preferencesService';

type Picker = null | 'theme' | 'font' | 'language';

export function ProfileScreen() {
  const { t } = useTranslation(['profile', 'common']);
  const { preferences, setTheme, setFont, setLocale, setFlag, saveMany } = usePreferences();
  const [name, setName] = useState(preferences.displayName);
  const [picker, setPicker] = useState<Picker>(null);
  const [savingName, setSavingName] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const missingNotified = useRef(false);

  // A stored photo can disappear (cleared storage, restored backup): fall back to the default avatar.
  const photoOk = photoExists(preferences.photoUri);
  const photoUri = photoOk ? preferences.photoUri : null;
  useEffect(() => {
    if (preferences.photoUri && !photoOk && !missingNotified.current) {
      missingNotified.current = true;
      showToast(t('profile:photoMissing'), 'info');
    }
  }, [preferences.photoUri, photoOk, t]);

  const dirty = normalizeDisplayName(name) !== preferences.displayName;

  const saveProfile = async () => {
    setSavingName(true);
    try {
      const clean = normalizeDisplayName(name);
      await saveMany({ displayName: clean });
      setName(clean);
      showToast(t('profile:saved'), 'success');
    } catch {
      showToast(t('common:errors.saveFailed'), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const changePhoto = async () => {
    setBusyPhoto(true);
    try {
      const result = await pickAndStoreProfilePhoto(preferences.photoUri);
      if (result.status === 'picked') {
        await saveMany({ photoUri: result.uri });
        showToast(t('profile:photoUpdated'), 'success');
      } else if (result.status === 'denied') showToast(t('profile:photoPermission'), 'error');
      else if (result.status === 'error') showToast(t('profile:photoError'), 'error');
    } catch {
      showToast(t('profile:photoError'), 'error');
    } finally {
      setBusyPhoto(false);
    }
  };

  const removePhoto = async () => {
    try {
      await saveMany({ photoUri: null });
      deleteStoredPhoto(preferences.photoUri);
      showToast(t('profile:photoRemoved'), 'info');
    } catch {
      showToast(t('common:errors.saveFailed'), 'error');
    }
  };

  const fontLabel = FONT_OPTIONS.find((f) => f.key === preferences.font)?.label ?? '';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeScreen edges={['top']} header={<ScreenHeader title={t('profile:title')} hideBack />} testID="profile-screen">
      <View style={styles.hero}>
        <Avatar name={preferences.displayName} photoUri={photoUri} size={104} testID="profile-avatar" />
        <View style={styles.photoActions}>
          <AppButton label={t('profile:changePhoto')} variant="secondary" compact fullWidth={false} icon="camera" loading={busyPhoto} onPress={changePhoto} testID="change-photo" />
          {photoUri ? <AppButton label={t('profile:removePhoto')} variant="ghost" compact fullWidth={false} onPress={removePhoto} testID="remove-photo" /> : null}
        </View>
      </View>

      <AppCard>
        <AppInput
          label={t('profile:name')}
          value={name}
          onChangeText={setName}
          placeholder={t('profile:namePlaceholder')}
          maxLength={MAX_DISPLAY_NAME}
          returnKeyType="done"
          onSubmitEditing={dirty ? saveProfile : undefined}
          testID="profile-name-input"
        />
        <View style={styles.saveRow}>
          <AppButton label={t('profile:save')} disabled={!dirty} loading={savingName} onPress={saveProfile} testID="save-profile" />
        </View>
      </AppCard>

      <SettingsGroup title={t('profile:sectionAppearance')}>
        <SettingRow
          icon="palette"
          title={t('profile:theme')}
          right={<AppText variant="caption" tone="muted">{t(`profile:themes.${preferences.theme}.name`)}</AppText>}
          showChevron
          onPress={() => setPicker('theme')}
          testID="row-theme"
        />
        <SettingRow
          icon="type"
          title={t('profile:font')}
          right={<AppText variant="caption" tone="muted">{fontLabel}</AppText>}
          showChevron
          onPress={() => setPicker('font')}
          testID="row-font"
        />
        <SettingRow
          icon="languages"
          title={t('profile:language')}
          right={<AppText variant="caption" tone="muted">{t(`profile:languages.${preferences.locale}`)}</AppText>}
          showChevron
          onPress={() => setPicker('language')}
          testID="row-language"
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile:sectionPreferences')}>
        <SettingRow
          icon="vibrate"
          title={t('profile:haptics')}
          description={t('profile:hapticsHint')}
          right={<AppSwitch label={t('profile:haptics')} value={preferences.haptics} onValueChange={(v) => void setFlag('haptics', v)} testID="switch-haptics" />}
        />
        <SettingRow
          icon="party-popper"
          title={t('profile:confetti')}
          description={t('profile:confettiHint')}
          right={<AppSwitch label={t('profile:confetti')} value={preferences.confetti} onValueChange={(v) => void setFlag('confetti', v)} testID="switch-confetti" />}
        />
      </SettingsGroup>

      <AppCard tone="soft">
        <View style={styles.offline}>
          <Icon name="wifi-off" size="md" color="primary" />
          <View style={styles.offlineText}>
            <AppText variant="label" weight="semibold">
              {t('profile:offline.title')}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {t('profile:offline.message')}
            </AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.aboutRow}>
        <AppLogo size={20} />
        <AppText variant="caption" tone="muted" align="center">
          {t('common:appName')} · {t('profile:about.version', { version })}
        </AppText>
      </View>

      <ThemeSelector
        visible={picker === 'theme'}
        value={preferences.theme}
        onClose={() => setPicker(null)}
        onApply={async (v) => {
          await setTheme(v).catch(() => showToast(t('common:errors.saveFailed'), 'error'));
          setPicker(null);
        }}
      />
      <FontSelector
        visible={picker === 'font'}
        value={preferences.font}
        onClose={() => setPicker(null)}
        onApply={async (v) => {
          await setFont(v).catch(() => showToast(t('common:errors.saveFailed'), 'error'));
          setPicker(null);
        }}
      />
      <LanguageSelector
        visible={picker === 'language'}
        value={preferences.locale}
        onClose={() => setPicker(null)}
        onApply={async (v) => {
          await setLocale(v).catch(() => showToast(t('common:errors.saveFailed'), 'error'));
          setPicker(null);
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: { alignItems: 'center', gap: theme.spacing.md },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  saveRow: { marginTop: theme.spacing.md },
  offline: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  offlineText: { flex: 1, gap: 2 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs },
}));
