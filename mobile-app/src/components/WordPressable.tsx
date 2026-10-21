import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface WordPressableProps {
  word: string;
  isSentenceActive: boolean;
  isWordActive: boolean;
  onPress: (word: string) => void;
}

export const WordPressable: React.FC<WordPressableProps> = React.memo(
  ({ word, isSentenceActive, isWordActive, onPress }) => {
    return (
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onPress(word);
        }}
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
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRadius: 6,
    marginVertical: 1,
  },
  activeWordTouch: {
    backgroundColor: '#1DB954',
  },
  pressedWordTouch: {
    backgroundColor: 'rgba(29, 185, 84, 0.35)',
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
    color: '#6E6E6E',
  },
  activeWordText: {
    color: '#000000',
    fontWeight: '800',
  },
});
