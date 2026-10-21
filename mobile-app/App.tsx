import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PlayerScreen } from './src/screens/PlayerScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <PlayerScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
