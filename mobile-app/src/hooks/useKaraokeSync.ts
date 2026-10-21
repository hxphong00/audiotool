import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { DialogueSegment } from '../types';
import {
  findActiveOrPrecedingSegmentIndex,
  getFallbackPlayerSnapshot,
  subscribeFallbackPlayer,
  updateLockScreenSpeaker,
} from '../services/trackPlayerService';

const hasNativeTrackPlayer = Boolean(NativeModules?.TrackPlayerModule);

let usePlaybackStateHook: (() => { state?: string }) | null = null;
let useProgressHook: ((interval?: number) => { position: number; duration: number; buffered: number }) | null = null;
let PlayingStateValue = 'playing';

if (hasNativeTrackPlayer) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rntp = require('react-native-track-player');
    usePlaybackStateHook = rntp.usePlaybackState;
    useProgressHook = rntp.useProgress;
    if (rntp.State?.Playing) {
      PlayingStateValue = rntp.State.Playing;
    }
  } catch {
    usePlaybackStateHook = null;
    useProgressHook = null;
  }
}

export interface KaraokeSyncState {
  isPlaying: boolean;
  position: number;
  duration: number;
  activeSegmentIndex: number;
  activeSegment: DialogueSegment | null;
}

/**
 * Synchronizes real-time audio playback position with dialogue segments & words:
 * - Polls at 50ms interval (20Hz) + smooth interpolation so short words highlight cleanly.
 * - Bridges the 400ms silence gap between consecutive segments so the active card
 *   never flickers off between sentences.
 * - Pushes the active speaker's name to the iOS Lock Screen / Control Center.
 */
export function useKaraokeSync(
  segments: DialogueSegment[],
  totalDuration: number
): KaraokeSyncState {
  const nativePlaybackState = usePlaybackStateHook ? usePlaybackStateHook() : { state: 'paused' };
  const nativeProgress = useProgressHook
    ? useProgressHook(50)
    : { position: 0, duration: totalDuration, buffered: 0 };

  const [fallbackState, setFallbackState] = useState(getFallbackPlayerSnapshot());

  useEffect(() => {
    if (hasNativeTrackPlayer) return;
    return subscribeFallbackPlayer(() => {
      setFallbackState({ ...getFallbackPlayerSnapshot() });
    });
  }, []);

  const isPlaying = hasNativeTrackPlayer
    ? nativePlaybackState.state === PlayingStateValue
    : fallbackState.isPlaying;

  const position = hasNativeTrackPlayer
    ? nativeProgress.position
    : fallbackState.position;

  const duration =
    (hasNativeTrackPlayer && nativeProgress.duration > 0
      ? nativeProgress.duration
      : totalDuration) || fallbackState.duration;

  const activeSegmentIndex =
    position > 0 || isPlaying
      ? findActiveOrPrecedingSegmentIndex(segments, position)
      : segments.length > 0
      ? 0
      : -1;

  const activeSegment =
    activeSegmentIndex >= 0 && activeSegmentIndex < segments.length
      ? segments[activeSegmentIndex]
      : null;

  useEffect(() => {
    if (activeSegment && isPlaying) {
      const speakerLabel = activeSegment.speaker_name || activeSegment.speaker;
      updateLockScreenSpeaker(speakerLabel);
    }
  }, [activeSegment?.id, isPlaying]);

  return {
    isPlaying,
    position,
    duration,
    activeSegmentIndex,
    activeSegment,
  };
}
