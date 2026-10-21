import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TrackPlayer from 'react-native-track-player';

import { PlayerScreen } from './src/screens/PlayerScreen';
import { playbackService } from './src/services/trackPlayerService';

// Register the background playback service for iOS AVAudioSession & Lock Screen
TrackPlayer.registerPlaybackService(() => playbackService);

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
