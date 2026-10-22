import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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
          onPress(word);
        }}
        onLongPress={(e) => {
          e.stopPropagation();
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
    paddingHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
    marginRight: 2,
  },
  activeWordTouch: {
    backgroundColor: '#1DB954',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  pressedWordTouch: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 0.96 }],
  },
  wordText: {
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  sentenceActiveWord: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveWord: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontWeight: '600',
  },
  activeWordText: {
    color: '#000000',
    fontWeight: '900',
  },
});
