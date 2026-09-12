import type { IconName } from '@/components/ui/Icon';
export const palette = {
  peach: '#F4A261',
  peachLight: '#FFD8B1',
  coral: '#E76F51',
  mint: '#8FD3B6',
  mintDark: '#4FA98B',
  sky: '#8EC5E8',
  lavender: '#B8A9E8',
  lemon: '#F9DC7A',
  rose: '#F5A3B5',
  cream: '#FFF6EC',
  sand: '#FBE9D7',
  cocoa: '#4A3B32',
  cocoaLight: '#7A6A5F',
  night: '#1E1B2E',
  nightCard: '#2A2640',
  nightBorder: '#3B3654',
  white: '#FFFFFF',
} as const;

export interface ThemeColors {
  background: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  tabBar: string;
  overlay: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: palette.cream,
  card: palette.white,
  cardAlt: palette.sand,
  border: '#F0DFCC',
  text: palette.cocoa,
  textMuted: palette.cocoaLight,
  primary: palette.peach,
  primarySoft: palette.peachLight,
  onPrimary: '#3B2A1E',
  accent: palette.mintDark,
  success: palette.mintDark,
  warning: '#E0A800',
  danger: palette.coral,
  tabBar: palette.white,
  overlay: 'rgba(74,59,50,0.45)',
  shadow: '#C9A88A',
};

export const darkColors: ThemeColors = {
  background: palette.night,
  card: palette.nightCard,
  cardAlt: '#332E4D',
  border: palette.nightBorder,
  text: '#F4EFFA',
  textMuted: '#B7B0CC',
  primary: palette.peach,
  primarySoft: '#5A4634',
  onPrimary: '#2A1D12',
  accent: palette.mint,
  success: palette.mint,
  warning: palette.lemon,
  danger: '#F28B76',
  tabBar: palette.nightCard,
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, fontFamily: 'Nunito_800ExtraBold', letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const, fontFamily: 'Nunito_800ExtraBold' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, fontFamily: 'Nunito_700Bold' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const, fontFamily: 'Nunito_500Medium' },
  bodyBold: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, fontFamily: 'Nunito_700Bold' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, fontFamily: 'Nunito_600SemiBold' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const, fontFamily: 'Nunito_800ExtraBold', letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const categoryColors: Record<string, string> = {
  exercise: '#E76F51',
  sleep: '#B8A9E8',
  study: '#8EC5E8',
  hydration: '#6BC5D6',
  mindfulness: '#8FD3B6',
  productivity: '#F4A261',
  journaling: '#F5A3B5',
  routine: '#F9DC7A',
  custom: '#C9B8A8',
};

export const goalColorOptions = [
  '#F4A261',
  '#E76F51',
  '#8FD3B6',
  '#8EC5E8',
  '#B8A9E8',
  '#F9DC7A',
  '#F5A3B5',
  '#6BC5D6',
];

export const goalIconOptions: IconName[] = [
  'hydration', 'study', 'exercise', 'sleep', 'mindfulness', 'walk', 'journaling', 'sun', 'moon', 'heart', 'coffee', 'music', 'palette', 'eat', 'brain', 'feather', 'custom', 'garden', 'stretch', 'breath', 'puzzle', 'users',
];

export const shadows = {
  card: { shadowColor: '#C9A88A', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  soft: { shadowColor: '#C9A88A', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  pop: { shadowColor: '#7A5236', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
} as const;

export const fonts = {
  regular: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;
