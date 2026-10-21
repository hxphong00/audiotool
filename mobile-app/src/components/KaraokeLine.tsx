import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DialogueSegment } from '../types';

interface KaraokeLineProps {
  segment: DialogueSegment;
  currentTime: number;
  isActive: boolean;
  onWordPress: (word: string) => void;
  onLinePress: () => void;
}

export const KaraokeLine: React.FC<KaraokeLineProps> = ({
  segment,
  currentTime,
  isActive,
  onWordPress,
  onLinePress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onLinePress}
      style={[
        styles.container,
        isActive && styles.activeContainer,
      ]}
    >
      <View style={styles.speakerRow}>
        <View style={[styles.speakerBadge, isActive && styles.activeSpeakerBadge]}>
          <Text style={[styles.speakerText, isActive && styles.activeSpeakerText]}>
            {segment.speaker_name || segment.speaker}
          </Text>
        </View>
      </View>

      {/* English Words with Word-Level Sync */}
      <View style={styles.wordsRow}>
        {segment.words.map((w, index) => {
          const isWordActive =
            currentTime >= w.start && currentTime < w.end;

          return (
            <TouchableOpacity
              key={`${w.word}_${index}`}
              activeOpacity={0.6}
              onPress={() => onWordPress(w.word)}
              style={[
                styles.wordTouch,
                isWordActive && styles.activeWordTouch,
              ]}
            >
              <Text
                style={[
                  styles.wordText,
                  isActive ? styles.sentenceActiveWord : styles.inactiveWord,
                  isWordActive && styles.activeWordText,
                ]}
              >
                {w.word}{' '}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vietnamese Translation */}
      <Text style={[styles.translationText, isActive && styles.activeTranslationText]}>
        {segment.text_vi}
      </Text>
    </TouchableOpacity>
  );
};

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
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  wordTouch: {
    paddingVertical: 2,
    paddingHorizontal: 1,
    borderRadius: 4,
  },
  activeWordTouch: {
    backgroundColor: '#1DB954',
  },
  wordText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  sentenceActiveWord: {
    color: '#FFFFFF',
  },
  inactiveWord: {
    color: '#777777',
  },
  activeWordText: {
    color: '#000000',
    fontWeight: '800',
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
    fontStyle: 'italic',
  },
  activeTranslationText: {
    color: '#B3B3B3',
    fontWeight: '500',
  },
});
