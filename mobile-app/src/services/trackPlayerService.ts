import { EmitterSubscription, NativeModules } from 'react-native';
import { DialogueSegment } from '../types';

// Detect whether the native RNTrackPlayer module is compiled in this build
// (True in `npx expo run:ios` / Development Build on iPhone 13 iOS 18.1; False in Expo Go / Web)
const hasNativeTrackPlayer = Boolean(NativeModules?.TrackPlayerModule);

let TrackPlayerRef: typeof import('react-native-track-player').default | null = null;
let RNTPConstants: typeof import('react-native-track-player') | null = null;

if (hasNativeTrackPlayer) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rntp = require('react-native-track-player');
    TrackPlayerRef = rntp.default || rntp;
    RNTPConstants = rntp;
  } catch {
    TrackPlayerRef = null;
  }
}

let currentSegmentsList: DialogueSegment[] = [];
let currentDialogueTitle = 'English Conversation';
let lastUpdatedSpeaker = '';
let isPlayerInitialized = false;
let serviceSubscriptions: EmitterSubscription[] = [];

// Fallback state when running in preview/Expo Go without native RNTP compiled
let fallbackIsPlaying = false;
let fallbackPosition = 0;
let fallbackDuration = 0;
let fallbackRate = 1.0;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
const fallbackListeners = new Set<() => void>();

function notifyFallbackListeners() {
  fallbackListeners.forEach((cb) => cb());
}

function startFallbackTimer() {
  if (fallbackTimer) clearInterval(fallbackTimer);
  fallbackTimer = setInterval(() => {
    if (fallbackIsPlaying) {
      fallbackPosition += 0.05 * fallbackRate;
      if (fallbackDuration > 0 && fallbackPosition >= fallbackDuration) {
        fallbackPosition = 0;
        fallbackIsPlaying = false;
        if (fallbackTimer) clearInterval(fallbackTimer);
      }
      notifyFallbackListeners();
    }
  }, 50);
}

export function subscribeFallbackPlayer(listener: () => void): () => void {
  fallbackListeners.add(listener);
  return () => {
    fallbackListeners.delete(listener);
  };
}

export function getFallbackPlayerSnapshot() {
  return {
    isPlaying: fallbackIsPlaying,
    position: fallbackPosition,
    duration: fallbackDuration,
    rate: fallbackRate,
    isNativeAvailable: Boolean(TrackPlayerRef),
  };
}

export function setCurrentSegments(segments: DialogueSegment[], title?: string) {
  currentSegmentsList = segments || [];
  if (title) {
    currentDialogueTitle = title;
  }
  lastUpdatedSpeaker = '';
}

/**
 * Finds the active segment index at `pos`, or the segment immediately preceding `pos`
 * if `pos` is currently in the 400ms silence gap between two segments.
 */
export function findActiveOrPrecedingSegmentIndex(
  segments: DialogueSegment[],
  pos: number
): number {
  if (!segments || segments.length === 0) return -1;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    const effectiveEnd = nextSeg ? nextSeg.start : seg.end + 0.5;
    if (pos >= seg.start && pos < effectiveEnd) {
      return i;
    }
  }

  if (pos >= segments[segments.length - 1].end) {
    return segments.length - 1;
  }
  return 0;
}

/**
 * Smart sentence-level rewind for Lock Screen (-5s button) and AirPods (double/triple press):
 * - Press 1: Jump to the exact start of the current sentence (`currentSegment.start`).
 * - Press 2 (within the first 0.85s of the sentence): Jump back to the previous sentence!
 */
export async function smartRewindToSentenceStart(): Promise<void> {
  const pos = await getPlayerPosition();
  const idx = findActiveOrPrecedingSegmentIndex(currentSegmentsList, pos);
  if (idx === -1) {
    await seekPlayerTo(Math.max(0, pos - 5));
    return;
  }

  const currentSeg = currentSegmentsList[idx];
  const offsetIntoSentence = pos - currentSeg.start;

  if (offsetIntoSentence < 0.85 && idx > 0) {
    const prevSeg = currentSegmentsList[idx - 1];
    await seekPlayerTo(Math.max(0, prevSeg.start));
  } else {
    await seekPlayerTo(Math.max(0, currentSeg.start));
  }
}

export async function smartSkipToNextSentence(): Promise<void> {
  const pos = await getPlayerPosition();
  const idx = findActiveOrPrecedingSegmentIndex(currentSegmentsList, pos);
  if (idx !== -1 && idx + 1 < currentSegmentsList.length) {
    await seekPlayerTo(currentSegmentsList[idx + 1].start);
  } else {
    await seekPlayerTo(pos + 5);
  }
}

export async function setupTrackPlayer(): Promise<boolean> {
  if (!TrackPlayerRef || !RNTPConstants) {
    isPlayerInitialized = true;
    return true;
  }
  if (isPlayerInitialized) {
    return true;
  }

  const {
    AppKilledPlaybackBehavior,
    Capability,
    IOSCategory,
    IOSCategoryMode,
  } = RNTPConstants;

  try {
    await TrackPlayerRef.setupPlayer({
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.SpokenAudio,
      autoHandleInterruptions: true,
    });
  } catch {
    // Player may already be initialized on hot reload
  }

  try {
    await TrackPlayerRef.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpBackward,
        Capability.JumpForward,
        Capability.SkipToPrevious,
        Capability.SkipToNext,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpBackward,
        Capability.SkipToPrevious,
      ],
      backwardJumpInterval: 5,
      forwardJumpInterval: 5,
      progressUpdateEventInterval: 0.1,
    });
    isPlayerInitialized = true;
  } catch (e) {
    console.warn('TrackPlayer updateOptions warning:', e);
  }

  return isPlayerInitialized;
}

export async function loadTrackIntoPlayer(params: {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
  rate?: number;
}): Promise<void> {
  currentDialogueTitle = params.title;
  if (!TrackPlayerRef) {
    fallbackIsPlaying = false;
    fallbackPosition = 0;
    fallbackDuration = params.duration || 15;
    if (params.rate) fallbackRate = params.rate;
    notifyFallbackListeners();
    return;
  }

  try {
    await TrackPlayerRef.reset();
    await TrackPlayerRef.add({
      id: params.id,
      url: params.url,
      title: params.title,
      artist: params.artist,
      duration: params.duration,
    });
    if (params.rate && params.rate !== 1.0) {
      await TrackPlayerRef.setRate(params.rate);
    }
  } catch (e) {
    console.warn('Track load error:', e);
  }
}

export async function playAudio(): Promise<void> {
  if (!TrackPlayerRef) {
    fallbackIsPlaying = true;
    startFallbackTimer();
    notifyFallbackListeners();
    return;
  }
  await TrackPlayerRef.play();
}

export async function pauseAudio(): Promise<void> {
  if (!TrackPlayerRef) {
    fallbackIsPlaying = false;
    notifyFallbackListeners();
    return;
  }
  await TrackPlayerRef.pause();
}

export async function seekPlayerTo(seconds: number): Promise<void> {
  const clamped = Math.max(0, seconds);
  if (!TrackPlayerRef) {
    fallbackPosition = fallbackDuration > 0 ? Math.min(fallbackDuration, clamped) : clamped;
    notifyFallbackListeners();
    return;
  }
  await TrackPlayerRef.seekTo(clamped);
}

export async function setPlayerRate(rate: number): Promise<void> {
  fallbackRate = rate;
  if (!TrackPlayerRef) {
    notifyFallbackListeners();
    return;
  }
  await TrackPlayerRef.setRate(rate);
}

export async function getPlayerPosition(): Promise<number> {
  if (!TrackPlayerRef) {
    return fallbackPosition;
  }
  try {
    const progress = await TrackPlayerRef.getProgress();
    return progress.position;
  } catch {
    return 0;
  }
}

/**
 * Updates Lock Screen / Control Center / CarPlay metadata with the current speaker's name.
 */
export async function updateLockScreenSpeaker(speakerName: string): Promise<void> {
  if (!TrackPlayerRef || !speakerName || speakerName === lastUpdatedSpeaker) {
    return;
  }
  lastUpdatedSpeaker = speakerName;
  try {
    await TrackPlayerRef.updateNowPlayingMetadata({
      title: currentDialogueTitle,
      artist: `🎙 ${speakerName} — English Commute`,
    });
  } catch {
    // Ignore metadata update error if no track active
  }
}

export function registerTrackPlayerService(): void {
  if (!TrackPlayerRef) return;
  try {
    TrackPlayerRef.registerPlaybackService(() => playbackService);
  } catch (e) {
    console.warn('Register playback service warning:', e);
  }
}

export async function playbackService() {
  if (!TrackPlayerRef || !RNTPConstants) return;
  const { Event } = RNTPConstants;

  // Clean up any existing listeners from hot reloads to prevent duplicate triggers
  serviceSubscriptions.forEach((sub) => {
    try {
      sub.remove();
    } catch {
      // Ignore
    }
  });
  serviceSubscriptions = [];

  serviceSubscriptions.push(
    TrackPlayerRef.addEventListener(Event.RemotePlay, () => {
      TrackPlayerRef?.play();
    }),
    TrackPlayerRef.addEventListener(Event.RemotePause, () => {
      TrackPlayerRef?.pause();
    }),
    TrackPlayerRef.addEventListener(Event.RemoteSeek, (event) => {
      TrackPlayerRef?.seekTo(event.position);
    }),
    // Lock Screen "-5s" button -> Smart Sentence Rewind
    TrackPlayerRef.addEventListener(Event.RemoteJumpBackward, async () => {
      try {
        await smartRewindToSentenceStart();
      } catch (err) {
        console.warn('RemoteJumpBackward error:', err);
      }
    }),
    // AirPods / CarPlay Previous Track squeeze -> Smart Sentence Rewind
    TrackPlayerRef.addEventListener(Event.RemotePrevious, async () => {
      try {
        await smartRewindToSentenceStart();
      } catch (err) {
        console.warn('RemotePrevious error:', err);
      }
    }),
    // Lock Screen "+5s" / AirPods Next -> Jump to Next Sentence
    TrackPlayerRef.addEventListener(Event.RemoteJumpForward, async () => {
      try {
        await smartSkipToNextSentence();
      } catch (err) {
        console.warn('RemoteJumpForward error:', err);
      }
    }),
    TrackPlayerRef.addEventListener(Event.RemoteNext, async () => {
      try {
        await smartSkipToNextSentence();
      } catch (err) {
        console.warn('RemoteNext error:', err);
      }
    })
  );
}
