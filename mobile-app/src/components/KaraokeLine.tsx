import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DialogueSegment } from '../types';
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
  return (
    <Pressable
      onPress={() => onLinePress(segment)}
      style={[styles.container, isActive && styles.activeContainer]}
    >
      <View style={styles.speakerRow}>
        <View style={[styles.speakerBadge, isActive && styles.activeSpeakerBadge]}>
          <Text style={[styles.speakerText, isActive && styles.activeSpeakerText]}>
            {segment.speaker_name || segment.speaker}
          </Text>
        </View>
        <View style={styles.speakerRightRow}>
          <Text style={styles.timestampText}>
            {segment.start.toFixed(1)}s
          </Text>
          {Boolean(onToggleBookmark) && (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleBookmark?.(segment);
              }}
              style={styles.starBtn}
            >
              <Text style={[styles.starIcon, isBookmarked && styles.starIconActive]}>
                {isBookmarked ? '⭐' : '☆'}
              </Text>
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
          <Text style={styles.shadowingBannerText}>
            🗣 TỰ NHẨM (SHADOWING): Hãy đọc to lại câu trên!
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
    marginVertical: 4,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(29, 185, 84, 0.35)',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBtn: {
    padding: 4,
    marginLeft: 4,
  },
  starIcon: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.25)',
  },
  starIconActive: {
    color: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSpeakerBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    borderColor: 'rgba(29, 185, 84, 0.4)',
  },
  speakerText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  activeSpeakerText: {
    color: '#1DB954',
  },
  timestampText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic',
  },
  activeTranslationText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  shadowingBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shadowingBannerText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
