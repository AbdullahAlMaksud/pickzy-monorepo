import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { SafeScreen, ScreenHeader } from '@/components/layout';
import {
  AppButton,
  AppCard,
  AppSwitch,
  AppText,
  Avatar,
  Icon,
} from '@/components/ui';
import { showToast } from '@/store/toastStore';
import { SettingRow } from '@/features/wheel/components/SettingRow';
import { SettingsGroup } from '@/features/wheel/components/SettingsGroup';
import { FONT_OPTIONS } from '@/theme/typography';
import { AppInfoSection } from '../components/AppInfoSection';
import { EditProfileNameModal } from '../components/EditProfileNameModal';
import { FontSelector } from '../components/FontSelector';
import { FontSizeSelector } from '../components/FontSizeSelector';
import { LanguageSection } from '../components/LanguageSection';
import { ThemeSelector } from '../components/ThemeSelector';
import { usePreferences } from '../hooks/usePreferences';
import { deleteStoredPhoto, photoExists, pickAndStoreProfilePhoto } from '../services/photoService';
import { normalizeDisplayName } from '../services/preferencesService';

type Picker = null | 'theme' | 'font' | 'fontSize';

export function ProfileScreen() {
  const { t } = useTranslation(['profile', 'common']);
  const { theme } = useUnistyles();
  const { preferences, setTheme, setFont, setFontSize, setLocale, setFlag, saveMany } = usePreferences();
  const [picker, setPicker] = useState<Picker>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const missingNotified = useRef(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setStyle(theme.isDark ? 'light' : 'dark');
    }, [theme.isDark])
  );

  // A stored photo can disappear (cleared storage, restored backup): fall back to the default avatar.
  const photoOk = photoExists(preferences.photoUri);
  const photoUri = photoOk ? preferences.photoUri : null;
  useEffect(() => {
    if (preferences.photoUri && !photoOk && !missingNotified.current) {
      missingNotified.current = true;
      showToast(t('profile:photoMissing'), 'info');
    }
  }, [preferences.photoUri, photoOk, t]);

  const saveName = async (newName: string) => {
    setSavingName(true);
    try {
      const clean = normalizeDisplayName(newName);
      await saveMany({ displayName: clean });
      setIsEditingName(false);
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
    <SafeScreen
      edges={['top']}
      header={<ScreenHeader title={t('profile:title')} hideBack />}
      testID="profile-screen"
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.heroCard}>
        <Pressable
          onPress={() => setIsEditingName(true)}
          accessibilityRole="button"
          accessibilityLabel={t('profile:editName')}
          style={styles.editButton}
          testID="edit-name-button"
        >
          <Icon name="pencil" size="sm" color="primary" />
        </Pressable>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <Avatar
              name={preferences.displayName}
              photoUri={photoUri}
              size={98}
              testID="profile-avatar"
            />
          </View>

          <Pressable
            onPress={changePhoto}
            disabled={busyPhoto}
            accessibilityRole="button"
            accessibilityLabel={t('profile:changePhoto')}
            style={styles.cameraBadge}
            testID="change-photo"
          >
            <Icon name="camera" size="xs" color="onPrimary" />
          </Pressable>
        </View>

        <View style={styles.nameBlock}>
          <Pressable onPress={() => setIsEditingName(true)} hitSlop={6}>
            <AppText variant="title" weight="bold" align="center" style={styles.displayName}>
              {preferences.displayName || t('profile:defaultName')}
            </AppText>
          </Pressable>
          <AppText variant="caption" tone="secondary" align="center">
            {t('profile:subtitle')}
          </AppText>
        </View>

        {photoUri ? (
          <AppButton
            label={t('profile:removePhoto')}
            variant="ghost"
            compact
            fullWidth={false}
            onPress={removePhoto}
            testID="remove-photo"
          />
        ) : null}
      </View>

      <LanguageSection
        currentLocale={preferences.locale}
        onSelectLocale={setLocale}
      />

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
          icon="a-large-small"
          title={t('profile:fontSize')}
          right={<AppText variant="caption" tone="muted">{t(`profile:fontSizes.${preferences.fontSize}.name`)}</AppText>}
          showChevron
          onPress={() => setPicker('fontSize')}
          testID="row-fontSize"
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



      <AppInfoSection version={version} />


      <AppCard tone="soft">
        <View style={styles.offline}>
          <Icon name="globe-2" size="xl" color="primary" />
          <View style={styles.offlineText}>
            <AppText variant="label" weight="semibold">
              {t('profile:offline.title')}
            </AppText>
            <AppText align='center' variant="caption" tone="secondary">
              {t('profile:offline.message')}
            </AppText>
          </View>
        </View>
      </AppCard>

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
      <FontSizeSelector
        visible={picker === 'fontSize'}
        value={preferences.fontSize}
        onClose={() => setPicker(null)}
        onApply={async (v) => {
          await setFontSize(v).catch(() => showToast(t('common:errors.saveFailed'), 'error'));
          setPicker(null);
        }}
      />
      <EditProfileNameModal
        visible={isEditingName}
        currentName={preferences.displayName}
        onClose={() => setIsEditingName(false)}
        onSave={saveName}
        saving={savingName}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  heroCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    position: 'relative',
    paddingVertical: theme.spacing.md,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
    zIndex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    borderWidth: 2.5,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    color: theme.colors.text,
  },
  offline: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    justifyContent: "center",
    alignItems: 'center',
    // alignItems: 'flex-start'
  },
  offlineText: { flex: 1, gap: 2, textAlign: "center", alignItems: 'center' },
}));
