import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { haptic } from '@/utils/haptics';
import { AppText, Icon, type IconName } from '../ui';

const TAB_ICONS: Record<string, { icon: IconName; labelKey: string }> = {
  index: { icon: 'house', labelKey: 'tabs.home' },
  history: { icon: 'history', labelKey: 'tabs.history' },
  profile: { icon: 'user', labelKey: 'tabs.profile' },
};

export function BottomNavigation({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { t } = useTranslation('common');
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 28);

  const activeColor = theme.colors.onPrimary;
  const inactiveColor = theme.isDark ? theme.colors.textSecondary : 'rgba(255, 255, 255, 0.6)';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          {
            paddingBottom: bottomInset + 10,
            minHeight: 88 + (insets.bottom > 0 ? insets.bottom : 20),
          },
        ]}
        accessibilityRole="tablist"
      >
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
              <View
                style={[
                  styles.indicator,
                  focused ? styles.indicatorActive : styles.indicatorInactive,
                ]}
              >
                <Icon name={meta.icon} size="md" color={focused ? activeColor : inactiveColor} />
              </View>
              <AppText
                variant="micro"
                style={{
                  color: focused ? activeColor : inactiveColor,
                  fontWeight: focused ? '700' : '500',
                }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
  bar: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  indicator: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  indicatorActive: {
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  indicatorInactive: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
}));
