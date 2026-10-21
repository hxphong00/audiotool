import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
} from 'react-native-track-player';
import { DialogueSegment } from '../types';

let currentSegmentsList: DialogueSegment[] = [];

export function setCurrentSegments(segments: DialogueSegment[]) {
  currentSegmentsList = segments;
}

export async function setupTrackPlayer(): Promise<boolean> {
  let isSetup = false;
  try {
    const activeTrack = await TrackPlayer.getActiveTrack();
    isSetup = activeTrack !== undefined;
  } catch {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.JumpBackward,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.JumpBackward,
        ],
        backwardJumpInterval: 5,
      });
      isSetup = true;
    } catch (e) {
      console.warn('TrackPlayer setup error:', e);
    }
  }
  return isSetup;
}

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  
  // Custom smart jump backward: jump to start of current sentence instead of arbitrary 10s!
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    try {
      const progress = await TrackPlayer.getProgress();
      const pos = progress.position;
      const currentSeg = currentSegmentsList.find(
        (s) => pos >= s.start && pos <= s.end + 0.5
      );
      if (currentSeg) {
        await TrackPlayer.seekTo(Math.max(0, currentSeg.start));
      } else {
        await TrackPlayer.seekTo(Math.max(0, pos - 5));
      }
    } catch (err) {
      console.warn('Jump backward error:', err);
    }
  });
}
