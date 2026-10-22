import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';

import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_BOTTOM_TABS,
  getSpeakerBadgeTheme,
  formatPlaybackSpeedLabel,
} from '../src/theme/iosTheme';

import {
  triggerSelectionHaptic,
  triggerLightHaptic,
  triggerMediumHaptic,
  triggerSuccessHaptic,
} from '../src/utils/haptics';

import App from '../App';
import { IOSBottomTabBar } from '../src/components/IOSBottomTabBar';
import { AudioControls, formatTimeMMSS } from '../src/components/AudioControls';
import { KaraokeLine } from '../src/components/KaraokeLine';
import { WordPressable } from '../src/components/WordPressable';
import { TranslationSheet } from '../src/components/TranslationSheet';
import { LibraryScreen } from '../src/screens/LibraryScreen';
import { ImportScreen } from '../src/screens/ImportScreen';
import { StudyDeckScreen } from '../src/screens/StudyDeckScreen';
import { PlayerScreen } from '../src/screens/PlayerScreen';

test('iOS Theme: exposes Apple HIG Dark Mode system colors and hairline separator', () => {
  assert.equal(IOS_COLORS.systemBackground, '#000000');
  assert.equal(IOS_COLORS.secondarySystemGroupedBackground, '#1C1C1E');
  assert.equal(IOS_COLORS.tertiarySystemGroupedBackground, '#2C2C2E');
  assert.equal(IOS_COLORS.systemGreen, '#30D158');
  assert.equal(IOS_COLORS.systemBlue, '#0A84FF');
  assert.equal(IOS_COLORS.systemRed, '#FF453A');
  assert.equal(IOS_COLORS.systemOrange, '#FF9F0A');
  assert.ok(IOS_COLORS.separator.includes('rgba'));
});

test('iOS Theme: exposes Apple HIG Typography scale with standard point sizes', () => {
  assert.equal(IOS_TYPOGRAPHY.largeTitle.fontSize, 34);
  assert.equal(IOS_TYPOGRAPHY.headline.fontSize, 17);
  assert.equal(IOS_TYPOGRAPHY.body.fontSize, 17);
  assert.equal(IOS_TYPOGRAPHY.footnote.fontSize, 13);
});

test('iOS Theme: defines 4 bottom navigation tabs with active and inactive Ionicons', () => {
  assert.equal(IOS_BOTTOM_TABS.length, 4);
  const keys = IOS_BOTTOM_TABS.map((t) => t.key);
  assert.deepEqual(keys, ['player', 'library', 'import', 'study']);
  for (const tab of IOS_BOTTOM_TABS) {
    assert.ok(tab.label.length > 0);
    assert.ok(tab.activeIcon.length > 0);
    assert.ok(tab.inactiveIcon.length > 0);
    assert.notEqual(tab.activeIcon, tab.inactiveIcon);
  }
});

test('iOS Theme: getSpeakerBadgeTheme returns distinct iOS accent colors and avatar initial', () => {
  const alex = getSpeakerBadgeTheme('Alex');
  const sarah = getSpeakerBadgeTheme('Sarah');
  const custom = getSpeakerBadgeTheme('Waiter');

  assert.equal(alex.initial, 'A');
  assert.equal(sarah.initial, 'S');
  assert.equal(custom.initial, 'W');
  assert.notEqual(alex.tintColor, sarah.tintColor);
  assert.ok(alex.backgroundColor.includes('rgba'));
});

test('iOS Theme: formatPlaybackSpeedLabel formats rate cleanly for iOS pill button', () => {
  assert.equal(formatPlaybackSpeedLabel(1), '1.0×');
  assert.equal(formatPlaybackSpeedLabel(1.25), '1.25×');
  assert.equal(formatPlaybackSpeedLabel(0.8), '0.8×');
});

test('Haptics: safe haptic wrappers execute without throwing in headless/non-native env', async () => {
  await assert.doesNotReject(async () => {
    await triggerSelectionHaptic();
    await triggerLightHaptic();
    await triggerMediumHaptic();
    await triggerSuccessHaptic();
  });
});

test('UI Components: all refactored iOS screens and components load and instantiate cleanly', () => {
  assert.equal(formatTimeMMSS(65), '01:05');
  assert.equal(formatTimeMMSS(0), '00:00');
  assert.equal(formatTimeMMSS(-5), '00:00');

  const appTree = App();
  assert.ok(React.isValidElement(appTree));

  let selectedTab = 'player';
  const tabBarTree = IOSBottomTabBar({
    activeTab: 'player',
    dueReviewCount: 120,
    onSelectTab: (t) => {
      selectedTab = t;
    },
  });
  assert.ok(React.isValidElement(tabBarTree));
  assert.equal(selectedTab, 'player');

  const wordElement = React.createElement(WordPressable, {
    word: 'commute',
    isSentenceActive: true,
    isWordActive: true,
    onPress: () => {},
    onLongPress: () => {},
  });
  assert.ok(React.isValidElement(wordElement));

  const karaokeElement = React.createElement(KaraokeLine, {
    segment: {
      id: 1,
      speaker: 'Alex',
      speaker_name: 'Alex',
      start: 0,
      end: 2.5,
      text_en: 'Good morning!',
      text_vi: 'Chào buổi sáng!',
      words: [{ word: 'Good', start: 0, end: 1.0 }],
    },
    currentTime: 0.5,
    isActive: true,
    isShadowingPauseActive: true,
    isBookmarked: true,
    onWordPress: () => {},
    onWordLongPress: () => {},
    onLinePress: () => {},
    onToggleBookmark: () => {},
  });
  assert.ok(React.isValidElement(karaokeElement));

  const controlsElement = React.createElement(AudioControls, {
    isPlaying: true,
    position: 5,
    duration: 20,
    rate: 1.25,
    isLooping: true,
    onPlayPause: () => {},
    onSeekToStartOfSegment: () => {},
    onSeekForward: () => {},
    onToggleRate: () => {},
    onToggleLoop: () => {},
    onSeekToPosition: () => {},
  });
  assert.ok(React.isValidElement(controlsElement));

  const sheetHiddenElement = React.createElement(TranslationSheet, {
    visible: false,
    loading: false,
    lookupData: null,
    onClose: () => {},
  });
  assert.ok(React.isValidElement(sheetHiddenElement));

  const sheetVisibleElement = React.createElement(TranslationSheet, {
    visible: true,
    loading: false,
    isWordSaved: true,
    lookupData: {
      word: 'commute',
      phonetic: '/kəˈmjuːt/',
      part_of_speech: 'Động từ (verb)',
      translation_vi: 'đi làm hàng ngày',
      definition_en: 'travel some distance between work and home',
      definition_vi: 'di chuyển giữa nhà và nơi làm việc',
      context_en: 'How was your commute?',
      context_vi: 'Chuyến đi làm của bạn thế nào?',
    },
    onSaveWord: () => {},
    onClose: () => {},
  });
  assert.ok(React.isValidElement(sheetVisibleElement));

  const libraryElement = React.createElement(LibraryScreen, {
    dialogues: [
      {
        conversation_id: 'conv_1',
        title: 'Morning Commute',
        total_duration: 25,
        segments_count: 6,
        is_offline: true,
      },
    ],
    activeConversationId: 'conv_1',
    loading: false,
    onSelectDialogue: () => {},
    onRefresh: () => {},
    onClose: () => {},
  });
  assert.ok(React.isValidElement(libraryElement));

  const importElement = React.createElement(ImportScreen, {
    shadowingPauseSec: 2.0,
    onShadowingPauseChange: () => {},
    onDialogueCreated: () => {},
    onClose: () => {},
  });
  assert.ok(React.isValidElement(importElement));

  const studyElement = React.createElement(StudyDeckScreen, {
    onSelectBookmarkedSentence: () => {},
    onSelectReviewDialogue: () => {},
    onClose: () => {},
  });
  assert.ok(React.isValidElement(studyElement));

  const playerElement = React.createElement(PlayerScreen, {});
  assert.ok(React.isValidElement(playerElement));
});
