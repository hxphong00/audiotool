import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DialogueSegment } from '../types';
import { WordPressable } from './WordPressable';

interface KaraokeLineProps {
  segment: DialogueSegment;
  currentTime: number;
  isActive: boolean;
  onWordPress: (word: string, segment: DialogueSegment) => void;
  onLinePress: (segment: DialogueSegment) => void;
}

const KaraokeLineComponent: React.FC<KaraokeLineProps> = ({
  segment,
  currentTime,
  isActive,
  onWordPress,
  onLinePress,
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
        <Text style={styles.timestampText}>
          {segment.start.toFixed(1)}s
        </Text>
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
              onPress={(tappedWord) => onWordPress(tappedWord, segment)}
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
    if (prev.segment !== next.segment) return false;
    if (!next.isActive) return true;
    return Math.abs(prev.currentTime - next.currentTime) < 0.02;
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#242424',
  },
  activeContainer: {
    backgroundColor: '#222222',
    borderColor: '#1DB954',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  activeSpeakerBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
  },
  speakerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  activeSpeakerText: {
    color: '#1DB954',
  },
  timestampText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5A5A5A',
    fontStyle: 'italic',
  },
  activeTranslationText: {
    color: '#D0D0D0',
    fontWeight: '500',
  },
});
