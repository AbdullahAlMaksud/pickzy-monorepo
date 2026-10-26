import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Image, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { haptic } from '@/utils/haptics';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';

const NAV_BG = require('../../assets/images/Artboard-1 (1).png');

const TAB_ICONS: Record<string, { icon: IconName; labelKey: string }> = {
  index: { icon: 'house', labelKey: 'tabs.home' },
  history: { icon: 'history', labelKey: 'tabs.history' },
  profile: { icon: 'user', labelKey: 'tabs.profile' },
};

export function BottomNavigation({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      <Image
        source={NAV_BG}
        style={styles.bgImage}
        resizeMode="cover"
        pointerEvents="none"
        accessible={false}
      />
      {state.routes.map((route, index) => {
        const meta = TAB_ICONS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const label = t(meta.labelKey);
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptic.selection();
                navigateToTab(route.key);
              }
            }}
            style={styles.item}
          >
            <View style={[styles.indicator, focused && styles.indicatorActive]}>
              <Icon name={meta.icon} size="md" color={focused ? 'primary' : 'textMuted'} />
            </View>
            <AppText variant="micro" tone={focused ? 'primary' : 'muted'} weight={focused ? 'semibold' : 'medium'}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  bar: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.sm,
    paddingBottom: Math.max(rt.insets.bottom, theme.spacing.sm),
    minHeight: theme.sizes.tabBar,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: theme.isDark ? 0.35 : 0.95,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: theme.sizes.touch },
  indicator: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  indicatorActive: { backgroundColor: theme.colors.primarySoft },
}));
