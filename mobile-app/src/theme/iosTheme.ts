export type ActiveTabKey = 'player' | 'library' | 'import' | 'study';

/**
 * Apple Human Interface Guidelines (HIG) Dark Mode System Palette
 * Standardized across all iPhone screens for 100% visual consistency.
 */
export const IOS_COLORS = {
  // Backgrounds (OLED True Black & Grouped Elevated Surfaces)
  systemBackground: '#000000',
  systemGroupedBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  elevatedCardBackground: 'rgba(28, 28, 30, 0.88)',
  glassSurface: 'rgba(28, 28, 30, 0.72)',

  // Labels & Typography Hierarchy
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',

  // Separators & Fills
  separator: 'rgba(84, 84, 88, 0.65)',
  opaqueSeparator: '#38383A',
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',

  // iOS Vibrant System Tints (Dark Mode)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
} as const;

/**
 * Apple San Francisco (SF Pro) Dynamic Type Scale
 */
export const IOS_TYPOGRAPHY = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.06,
  },
} as const;

export interface IOSBottomTabConfig {
  key: ActiveTabKey;
  label: string;
  activeIcon: string;
  inactiveIcon: string;
}

export const IOS_BOTTOM_TABS: IOSBottomTabConfig[] = [
  {
    key: 'player',
    label: 'Đang phát',
    activeIcon: 'headset',
    inactiveIcon: 'headset-outline',
  },
  {
    key: 'library',
    label: 'Thư viện',
    activeIcon: 'library',
    inactiveIcon: 'library-outline',
  },
  {
    key: 'import',
    label: 'Tạo bài',
    activeIcon: 'add-circle',
    inactiveIcon: 'add-circle-outline',
  },
  {
    key: 'study',
    label: 'Sổ tay',
    activeIcon: 'book',
    inactiveIcon: 'book-outline',
  },
];

export interface SpeakerBadgeTheme {
  initial: string;
  tintColor: string;
  backgroundColor: string;
  borderColor: string;
}

const SPEAKER_PALETTES: Array<Omit<SpeakerBadgeTheme, 'initial'>> = [
  {
    tintColor: IOS_COLORS.systemBlue,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    borderColor: 'rgba(10, 132, 255, 0.38)',
  },
  {
    tintColor: IOS_COLORS.systemPurple,
    backgroundColor: 'rgba(191, 90, 242, 0.16)',
    borderColor: 'rgba(191, 90, 242, 0.38)',
  },
  {
    tintColor: IOS_COLORS.systemOrange,
    backgroundColor: 'rgba(255, 159, 10, 0.16)',
    borderColor: 'rgba(255, 159, 10, 0.38)',
  },
  {
    tintColor: IOS_COLORS.systemTeal,
    backgroundColor: 'rgba(100, 210, 255, 0.16)',
    borderColor: 'rgba(100, 210, 255, 0.38)',
  },
];

const FEMALE_NAMES = new Set([
  'sarah',
  'emily',
  'emma',
  'ava',
  'lisa',
  'anna',
  'mary',
  'rachel',
  'sophia',
  'olivia',
]);

const MALE_NAMES = new Set([
  'alex',
  'david',
  'john',
  'michael',
  'brian',
  'tom',
  'james',
  'daniel',
  'chris',
  'ben',
]);

export function getSpeakerBadgeTheme(speakerName: string): SpeakerBadgeTheme {
  const clean = (speakerName || 'Speaker').trim();
  const initial = (clean[0] || 'S').toUpperCase();
  const lower = clean.toLowerCase();

  if (MALE_NAMES.has(lower)) {
    return { initial, ...SPEAKER_PALETTES[0] };
  }
  if (FEMALE_NAMES.has(lower)) {
    return { initial, ...SPEAKER_PALETTES[1] };
  }

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash * 31 + lower.charCodeAt(i)) >>> 0;
  }
  const palette = SPEAKER_PALETTES[hash % SPEAKER_PALETTES.length];
  return { initial, ...palette };
}

export function formatPlaybackSpeedLabel(rate: number): string {
  if (Number.isInteger(rate)) {
    return `${rate.toFixed(1)}×`;
  }
  return `${rate}×`;
}
