import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide/static';
import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import type { ColorTokens } from '@/theme/themes';

export type IconName = LucideIconName;

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** A theme color key, or a raw color string. */
  color?: keyof ColorTokens | (string & {});
  style?: StyleProp<TextStyle>;
}

const SIZE = { xs: 14, sm: 18, md: 22, lg: 26, xl: 32 } as const;

/** Single icon convention for the whole app (Lucide). */
function IconBase({ name, size = 'md', color = 'text', style }: IconProps) {
  const { theme } = useUnistyles();
  const resolved = (theme.colors as unknown as Record<string, string>)[color] ?? color;
  return <Lucide name={name} size={SIZE[size]} color={resolved} style={style} />;
}

export const Icon = memo(IconBase);
