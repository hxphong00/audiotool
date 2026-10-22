import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { IOS_COLORS } from '../theme/iosTheme';
import { triggerLightHaptic, triggerMediumHaptic } from '../utils/haptics';

interface WordPressableProps {
  word: string;
  isSentenceActive: boolean;
  isWordActive: boolean;
  onPress: (word: string) => void;
  onLongPress?: (word: string) => void;
}

export const WordPressable: React.FC<WordPressableProps> = React.memo(
  ({ word, isSentenceActive, isWordActive, onPress, onLongPress }) => {
    return (
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          triggerLightHaptic();
          onPress(word);
        }}
        onLongPress={(e) => {
          e.stopPropagation();
          triggerMediumHaptic();
          onLongPress?.(word);
        }}
        delayLongPress={350}
        style={({ pressed }) => [
          styles.wordTouch,
          isWordActive && styles.activeWordTouch,
          pressed && styles.pressedWordTouch,
        ]}
      >
        <Text
          style={[
            styles.wordText,
            isSentenceActive ? styles.sentenceActiveWord : styles.inactiveWord,
            isWordActive && styles.activeWordText,
          ]}
        >
          {word}{' '}
        </Text>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  wordTouch: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginVertical: 2,
    marginRight: 2,
  },
  activeWordTouch: {
    backgroundColor: IOS_COLORS.systemBlue,
    shadowColor: IOS_COLORS.systemBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  pressedWordTouch: {
    backgroundColor: IOS_COLORS.systemFill,
    transform: [{ scale: 0.96 }],
  },
  wordText: {
    fontSize: 22,
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  sentenceActiveWord: {
    color: IOS_COLORS.label,
    fontWeight: '700',
  },
  inactiveWord: {
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '600',
  },
  activeWordText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
