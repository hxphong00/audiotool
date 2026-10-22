import { Platform } from 'react-native';

let HapticsModule: typeof import('expo-haptics') | null = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    HapticsModule = require('expo-haptics');
  } catch {
    HapticsModule = null;
  }
}

export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await HapticsModule?.selectionAsync?.();
  } catch {
    // Ignore on unsupported devices / simulators
  }
}

export async function triggerLightHaptic(): Promise<void> {
  try {
    if (HapticsModule?.ImpactFeedbackStyle) {
      await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignore
  }
}

export async function triggerMediumHaptic(): Promise<void> {
  try {
    if (HapticsModule?.ImpactFeedbackStyle) {
      await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // Ignore
  }
}

export async function triggerSuccessHaptic(): Promise<void> {
  try {
    if (HapticsModule?.NotificationFeedbackType) {
      await HapticsModule.notificationAsync(
        HapticsModule.NotificationFeedbackType.Success
      );
    }
  } catch {
    // Ignore
  }
}
