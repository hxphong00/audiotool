import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActiveTabKey,
  IOS_BOTTOM_TABS,
  IOS_COLORS,
  IOS_TYPOGRAPHY,
} from '../theme/iosTheme';
import { triggerSelectionHaptic } from '../utils/haptics';

interface IOSBottomTabBarProps {
  activeTab: ActiveTabKey;
  dueReviewCount?: number;
  onSelectTab: (tab: ActiveTabKey) => void;
}

export const IOSBottomTabBar: React.FC<IOSBottomTabBarProps> = ({
  activeTab,
  dueReviewCount = 0,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);

  function handlePress(tab: ActiveTabKey) {
    if (tab !== activeTab) {
      triggerSelectionHaptic();
    }
    onSelectTab(tab);
  }

  return (
    <BlurView
      intensity={85}
      tint="systemChromeMaterialDark"
      style={[styles.blurWrapper, { paddingBottom: bottomPadding }]}
    >
      <View style={styles.tabRow}>
        {IOS_BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const iconName = (isActive ? tab.activeIcon : tab.inactiveIcon) as keyof typeof Ionicons.glyphMap;
          const showBadge = tab.key === 'study' && dueReviewCount > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => handlePress(tab.key)}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={23}
                  color={
                    isActive
                      ? IOS_COLORS.systemBlue
                      : IOS_COLORS.secondaryLabel
                  }
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {dueReviewCount > 99 ? '99+' : dueReviewCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurWrapper: {
    backgroundColor: IOS_COLORS.glassSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    paddingTop: 6,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    position: 'relative',
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemRed,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: IOS_COLORS.label,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tabLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  tabLabelActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
});
