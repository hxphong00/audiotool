import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DialogueSegment } from '../types';
import {
  getSpeakerBadgeTheme,
  IOS_COLORS,
  IOS_TYPOGRAPHY,
} from '../theme/iosTheme';
import { triggerLightHaptic, triggerSelectionHaptic } from '../utils/haptics';
import { WordPressable } from './WordPressable';

interface KaraokeLineProps {
  segment: DialogueSegment;
  currentTime: number;
  isActive: boolean;
  isShadowingPauseActive?: boolean;
  isBookmarked?: boolean;
  onWordPress: (
    word: string,
    segment: DialogueSegment,
    wordIndex?: number,
    wordMeta?: { start: number; end: number }
  ) => void;
  onWordLongPress?: (
    word: string,
    segment: DialogueSegment,
    wordIndex?: number,
    wordMeta?: { start: number; end: number }
  ) => void;
  onLinePress: (segment: DialogueSegment) => void;
  onToggleBookmark?: (segment: DialogueSegment) => void;
}

const KaraokeLineComponent: React.FC<KaraokeLineProps> = ({
  segment,
  currentTime,
  isActive,
  isShadowingPauseActive = false,
  isBookmarked = false,
  onWordPress,
  onWordLongPress,
  onLinePress,
  onToggleBookmark,
}) => {
  const speakerLabel = segment.speaker_name || segment.speaker;
  const speakerTheme = getSpeakerBadgeTheme(speakerLabel);

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onLinePress(segment);
      }}
      style={[styles.container, isActive && styles.activeContainer]}
    >
      <View style={styles.speakerRow}>
        {/* iOS Avatar Circle + Speaker Name Pill */}
        <View style={styles.speakerLeftRow}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isActive
                  ? speakerTheme.tintColor
                  : speakerTheme.backgroundColor,
                borderColor: speakerTheme.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitial,
                { color: isActive ? '#FFFFFF' : speakerTheme.tintColor },
              ]}
            >
              {speakerTheme.initial}
            </Text>
          </View>

          <View
            style={[
              styles.speakerBadge,
              isActive && {
                backgroundColor: speakerTheme.backgroundColor,
                borderColor: speakerTheme.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.speakerText,
                isActive && { color: speakerTheme.tintColor },
              ]}
            >
              {speakerLabel}
            </Text>
          </View>
        </View>

        {/* Timestamp & Bookmark Icon */}
        <View style={styles.speakerRightRow}>
          <Text style={styles.timestampText}>
            {segment.start.toFixed(1)}s
          </Text>
          {Boolean(onToggleBookmark) && (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                e.stopPropagation?.();
                triggerLightHaptic();
                onToggleBookmark?.(segment);
              }}
              style={styles.bookmarkBtn}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={
                  isBookmarked
                    ? IOS_COLORS.systemYellow
                    : IOS_COLORS.tertiaryLabel
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* English Words with Real-Time WordBoundary Sync */}
      <View style={styles.wordsRow}>
        {segment.words.map((w, index) => {
          const isWordActive =
            isActive && currentTime >= w.start && currentTime <= w.end + 0.04;

          return (
            <WordPressable
              key={`${segment.id}_${index}_${w.word}`}
              word={w.word}
              isSentenceActive={isActive}
              isWordActive={isWordActive}
              onPress={(tappedWord) =>
                onWordPress(tappedWord, segment, index, {
                  start: w.start,
                  end: w.end,
                })
              }
              onLongPress={(tappedWord) =>
                onWordLongPress?.(tappedWord, segment, index, {
                  start: w.start,
                  end: w.end,
                })
              }
            />
          );
        })}
      </View>

      {/* Vietnamese Bilingual Subtitle */}
      <Text
        style={[
          styles.translationText,
          isActive && styles.activeTranslationText,
        ]}
      >
        {segment.text_vi}
      </Text>

      {/* Shadowing Practice Prompt when in pause window */}
      {isActive && isShadowingPauseActive && (
        <View style={styles.shadowingBanner}>
          <Ionicons
            name="mic"
            size={15}
            color={IOS_COLORS.systemGreen}
          />
          <Text style={styles.shadowingBannerText}>
            TỰ NHẨM (SHADOWING): Hãy đọc to lại câu trên!
          </Text>
        </View>
      )}
    </Pressable>
  );
};

/**
 * Memoized so inactive sentences NEVER re-render during high-frequency progress updates.
 */
export const KaraokeLine = React.memo(
  KaraokeLineComponent,
  (prev, next) => {
    if (prev.isActive !== next.isActive) return false;
    if (prev.isBookmarked !== next.isBookmarked) return false;
    if (prev.isShadowingPauseActive !== next.isShadowingPauseActive) return false;
    if (prev.segment !== next.segment) return false;
    if (!next.isActive) return true;
    return Math.abs(prev.currentTime - next.currentTime) < 0.02;
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderColor: 'rgba(10, 132, 255, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '700',
  },
  speakerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  speakerText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  speakerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  bookmarkBtn: {
    padding: 4,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  translationText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.tertiaryLabel,
  },
  activeTranslationText: {
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  shadowingBanner: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48, 209, 88, 0.45)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shadowingBannerText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemGreen,
    fontWeight: '700',
  },
});
