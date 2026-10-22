import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';

import { AudioControls } from '../components/AudioControls';
import { IOSBottomTabBar } from '../components/IOSBottomTabBar';
import { KaraokeLine } from '../components/KaraokeLine';
import { TranslationSheet } from '../components/TranslationSheet';
import { useKaraokeSync } from '../hooks/useKaraokeSync';
import {
  fetchDialogue,
  fetchDialogueList,
  loadSavedApiBaseUrl,
  loadSavedShadowingPause,
  lookupWord,
  resolvePlayableAudioUrl,
} from '../services/apiService';
import {
  getLastActiveDialogueId,
  getOfflineDialogue,
  getOfflineIndex,
  getOfflineSummariesList,
  saveDialogueOffline,
  setLastActiveDialogueId,
} from '../services/storageService';
import {
  loadTrackIntoPlayer,
  pauseAudio,
  playAudio,
  seekPlayerTo,
  setCurrentSegments,
  setPlayerRate,
  setPlayerRepeatMode,
  setupTrackPlayer,
  smartRewindToSentenceStart,
  smartSkipToNextSentence,
  findWordTimestamp,
  shouldAutoScroll,
} from '../services/trackPlayerService';
import {
  DialogueData,
  DialogueSegment,
  DialogueSummary,
  WordLookupResult,
} from '../types';
import {
  ensureInitialSM2Schedule,
  getAllSM2Records,
  getBookmarkedSentences,
  getSavedVocabulary,
  isSM2Due,
  makeSentenceBookmarkId,
  saveWordToVocabulary,
  toggleSentenceBookmark,
} from '../services/learningService';
import {
  ActiveTabKey,
  IOS_COLORS,
  IOS_TYPOGRAPHY,
} from '../theme/iosTheme';
import {
  triggerLightHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';
import { ImportScreen } from './ImportScreen';
import { LibraryScreen } from './LibraryScreen';
import { StudyDeckScreen } from './StudyDeckScreen';

const FALLBACK_DIALOGUE: DialogueData = {
  conversation_id: 'conv_1ce89d5b61',
  title: 'Morning Commute & Highway Traffic',
  total_duration: 19.99,
  audio_url: 'http://192.168.1.220:8000/static/conv_1ce89d5b61.mp3',
  audio_stream_url: 'http://192.168.1.220:8000/api/audio/conv_1ce89d5b61/stream',
  offline_filename: 'conv_1ce89d5b61.mp3',
  speakers: {
    Alex: { name: 'Alex', voice: 'en-US-AndrewNeural', gender: 'male' },
    Sarah: { name: 'Sarah', voice: 'en-US-AvaNeural', gender: 'female' },
  },
  segments: [
    {
      id: 1,
      speaker: 'Alex',
      speaker_name: 'Alex',
      start: 0.0,
      end: 3.1,
      text_en: 'Good morning Sarah, how is the traffic looking today?',
      text_vi: 'Chào buổi sáng Sarah, giao thông hôm nay thế nào?',
      words: [
        { word: 'Good', start: 0.0, end: 0.25 },
        { word: 'morning', start: 0.26, end: 0.65 },
        { word: 'Sarah,', start: 0.68, end: 1.15 },
        { word: 'how', start: 1.25, end: 1.45 },
        { word: 'is', start: 1.46, end: 1.6 },
        { word: 'the', start: 1.62, end: 1.75 },
        { word: 'traffic', start: 1.78, end: 2.2 },
        { word: 'looking', start: 2.22, end: 2.55 },
        { word: 'today?', start: 2.58, end: 3.1 },
      ],
    },
    {
      id: 2,
      speaker: 'Sarah',
      speaker_name: 'Sarah',
      start: 3.5,
      end: 7.4,
      text_en: 'Good morning Alex! The highway is completely backed up.',
      text_vi: 'Chào buổi sáng Alex! Đường cao tốc đang bị ùn tắc hoàn toàn.',
      words: [
        { word: 'Good', start: 3.5, end: 3.8 },
        { word: 'morning', start: 3.82, end: 4.25 },
        { word: 'Alex!', start: 4.28, end: 4.85 },
        { word: 'The', start: 4.95, end: 5.15 },
        { word: 'highway', start: 5.18, end: 5.75 },
        { word: 'is', start: 5.78, end: 5.95 },
        { word: 'completely', start: 5.98, end: 6.6 },
        { word: 'backed', start: 6.65, end: 7.0 },
        { word: 'up.', start: 7.02, end: 7.4 },
      ],
    },
    {
      id: 3,
      speaker: 'Alex',
      speaker_name: 'Alex',
      start: 7.8,
      end: 11.0,
      text_en: 'Are you taking the subway tomorrow instead?',
      text_vi: 'Ngày mai bạn có đi tàu điện ngầm thay thế không?',
      words: [
        { word: 'Are', start: 7.8, end: 8.05 },
        { word: 'you', start: 8.08, end: 8.3 },
        { word: 'taking', start: 8.35, end: 8.75 },
        { word: 'the', start: 8.78, end: 8.95 },
        { word: 'subway', start: 8.98, end: 9.55 },
        { word: 'tomorrow', start: 9.58, end: 10.2 },
        { word: 'instead?', start: 10.25, end: 11.0 },
      ],
    },
    {
      id: 4,
      speaker: 'Sarah',
      speaker_name: 'Sarah',
      start: 11.4,
      end: 15.0,
      text_en: 'Yes, definitely! It takes only twenty minutes.',
      text_vi: 'Có, chắc chắn rồi! Nó chỉ mất hai mươi phút thôi.',
      words: [
        { word: 'Yes,', start: 11.4, end: 11.8 },
        { word: 'definitely!', start: 11.85, end: 12.65 },
        { word: 'It', start: 12.75, end: 12.95 },
        { word: 'takes', start: 13.0, end: 13.4 },
        { word: 'only', start: 13.45, end: 13.85 },
        { word: 'twenty', start: 13.9, end: 14.35 },
        { word: 'minutes.', start: 14.4, end: 15.0 },
      ],
    },
  ],
};

export const PlayerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTabKey>('player');
  const [dialogue, setDialogue] = useState<DialogueData>(FALLBACK_DIALOGUE);
  const [libraryItems, setLibraryItems] = useState<DialogueSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  // Shadowing Pause Mode from Settings (0 = Off by default)
  const [shadowingPauseSec, setShadowingPauseSecState] = useState<number>(0);
  const [isDynamicShadowingWait, setIsDynamicShadowingWait] = useState(false);
  const lastShadowedSegIdRef = useRef<number | null>(null);
  const shadowingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Word Tap-to-Translate Bottom Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<WordLookupResult | null>(null);
  const wasPlayingBeforeLookupRef = useRef<boolean>(false);

  // #13, #14, #15: Learning states (Bookmarks, Vocab Deck, SM-2 Due Count)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedVocabIds, setSavedVocabIds] = useState<Set<string>>(new Set());
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);

  const refreshLearningStates = useCallback(async () => {
    try {
      const [bookmarks, vocabs, sm2] = await Promise.all([
        getBookmarkedSentences(),
        getSavedVocabulary(),
        getAllSM2Records(),
      ]);
      setBookmarkedIds(new Set(bookmarks.map((b) => b.id)));
      setSavedVocabIds(new Set(vocabs.map((v) => v.id.toLowerCase().trim())));
      const due = Object.values(sm2).filter((r) => isSM2Due(r)).length;
      setDueReviewCount(due);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshLearningStates();
  }, [refreshLearningStates]);

  async function handleToggleBookmarkSentence(seg: DialogueSegment) {
    const { list } = await toggleSentenceBookmark(
      dialogue.conversation_id,
      dialogue.title,
      seg
    );
    setBookmarkedIds(new Set(list.map((b) => b.id)));
  }

  async function handleSaveWordFromSheet(data: WordLookupResult) {
    const updated = await saveWordToVocabulary({
      word: data.word,
      phonetic: data.phonetic || '',
      part_of_speech: data.part_of_speech || '',
      translation_vi: data.translation_vi,
      context_en: data.context_en || '',
      context_vi: data.context_vi || '',
      conversation_id: dialogue.conversation_id,
      dialogue_title: dialogue.title,
    });
    setSavedVocabIds(new Set(updated.map((v) => v.id.toLowerCase().trim())));
    Alert.alert(
      'Đã lưu vào sổ tay',
      `Từ "${data.word}" đã được thêm vào mục Sổ tay.`
    );
  }

  const flatListRef = useRef<FlatList<DialogueSegment>>(null);
  const lastScrolledIndex = useRef<number>(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [pronouncingWord, setPronouncingWord] = useState<string | null>(null);
  const scrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pronounceToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isPlaying, position, duration, activeSegmentIndex } = useKaraokeSync(
    dialogue.segments,
    dialogue.total_duration
  );

  // Keep screen awake while commuting (expo-keep-awake)
  useEffect(() => {
    const KEEP_AWAKE_TAG = 'commute-karaoke-awake';
    if (keepScreenAwake) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [keepScreenAwake]);

  // Initialize player & load initial dialogue (Offline-first + Server sync)
  useEffect(() => {
    let mounted = true;

    async function init() {
      await loadSavedApiBaseUrl();
      const savedPause = await loadSavedShadowingPause();
      if (mounted) {
        setShadowingPauseSecState(savedPause);
      }
      await setupTrackPlayer();
      if (!mounted) return;
      await loadInitialDialogue();
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  async function setupTrack(data: DialogueData, rateOverride?: number) {
    const activeRate = rateOverride ?? playbackRate;
    setCurrentSegments(data.segments, data.title);
    await setLastActiveDialogueId(data.conversation_id);

    const playableUrl = resolvePlayableAudioUrl(data);
    await loadTrackIntoPlayer({
      id: data.conversation_id,
      url: playableUrl,
      title: data.title,
      artist: 'English Dialogue Commute',
      duration: data.total_duration,
      rate: activeRate,
      autoLoop: isLooping,
    });

    await ensureInitialSM2Schedule(data.conversation_id);
    refreshLearningStates();
  }

  async function loadInitialDialogue() {
    const lastId = await getLastActiveDialogueId();
    if (lastId) {
      const cached = await getOfflineDialogue(lastId);
      if (cached) {
        setDialogue(cached);
        await setupTrack(cached);
        return;
      }
    }

    try {
      const list = await fetchDialogueList();
      if (list.dialogues && list.dialogues.length > 0) {
        const targetId = list.dialogues[0].conversation_id;
        const offlineCopy = await getOfflineDialogue(targetId);
        const fullData = offlineCopy || (await fetchDialogue(targetId));
        setDialogue(fullData);
        await setupTrack(fullData);
        return;
      }
    } catch {
      const offlineList = await getOfflineSummariesList();
      if (offlineList.length > 0) {
        const localData = await getOfflineDialogue(
          offlineList[0].conversation_id
        );
        if (localData) {
          setDialogue(localData);
          await setupTrack(localData);
          return;
        }
      }
    }

    await setupTrack(FALLBACK_DIALOGUE);
  }

  // Smooth auto-scroll active sentence to 40% from top of screen
  useEffect(() => {
    if (
      shouldAutoScroll(
        isUserScrolling,
        activeTab,
        dialogue.segments.length > activeSegmentIndex
      ) &&
      activeSegmentIndex !== -1 &&
      activeSegmentIndex !== lastScrolledIndex.current
    ) {
      lastScrolledIndex.current = activeSegmentIndex;
      flatListRef.current?.scrollToIndex({
        index: activeSegmentIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [activeSegmentIndex, activeTab, dialogue.segments.length, isUserScrolling]);

  const handleScrollBeginDrag = useCallback(() => {
    if (scrollResumeTimerRef.current) {
      clearTimeout(scrollResumeTimerRef.current);
    }
    setIsUserScrolling(true);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (scrollResumeTimerRef.current) {
      clearTimeout(scrollResumeTimerRef.current);
    }
    scrollResumeTimerRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4500);
  }, []);

  const handleResumeAutoScroll = useCallback(() => {
    triggerSelectionHaptic();
    if (scrollResumeTimerRef.current) {
      clearTimeout(scrollResumeTimerRef.current);
    }
    setIsUserScrolling(false);
    if (
      activeSegmentIndex !== -1 &&
      dialogue.segments.length > activeSegmentIndex
    ) {
      lastScrolledIndex.current = activeSegmentIndex;
      flatListRef.current?.scrollToIndex({
        index: activeSegmentIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [activeSegmentIndex, dialogue.segments.length]);

  // Dynamic Player Shadowing Pause Mode
  useEffect(() => {
    const bakedSilence = dialogue.silence_sec ?? 0.4;
    if (
      shadowingPauseSec <= 0 ||
      bakedSilence >= 1.5 ||
      !isPlaying ||
      isDynamicShadowingWait ||
      activeSegmentIndex === -1
    ) {
      return;
    }

    const seg = dialogue.segments[activeSegmentIndex];
    if (!seg) return;

    if (
      position >= seg.end - 0.05 &&
      position <= seg.end + 0.3 &&
      lastShadowedSegIdRef.current !== seg.id
    ) {
      lastShadowedSegIdRef.current = seg.id;
      setIsDynamicShadowingWait(true);
      pauseAudio().catch(() => {});

      if (shadowingTimeoutRef.current) {
        clearTimeout(shadowingTimeoutRef.current);
      }
      shadowingTimeoutRef.current = setTimeout(() => {
        setIsDynamicShadowingWait(false);
        playAudio().catch(() => {});
      }, shadowingPauseSec * 1000);
    }
  }, [
    position,
    isPlaying,
    activeSegmentIndex,
    shadowingPauseSec,
    dialogue.silence_sec,
    dialogue.segments,
    isDynamicShadowingWait,
  ]);

  useEffect(() => {
    return () => {
      if (shadowingTimeoutRef.current) {
        clearTimeout(shadowingTimeoutRef.current);
      }
    };
  }, []);

  async function handlePlayPause() {
    if (shadowingTimeoutRef.current) {
      clearTimeout(shadowingTimeoutRef.current);
      shadowingTimeoutRef.current = null;
      setIsDynamicShadowingWait(false);
    }
    if (isPlaying) {
      await pauseAudio();
    } else {
      await playAudio();
    }
  }

  async function handleToggleRate() {
    const rates = [1.0, 1.25, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    await setPlayerRate(nextRate);
  }

  async function handleToggleLoop() {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    await setPlayerRepeatMode(nextLoop);
  }

  const handleJumpToLine = useCallback(
    async (seg: DialogueSegment) => {
      await seekPlayerTo(seg.start);
      if (!isPlaying) {
        await playAudio();
      }
    },
    [isPlaying]
  );

  const handleWordPress = useCallback(
    async (
      word: string,
      segment: DialogueSegment,
      wordIndex?: number,
      wordMeta?: { start: number; end: number }
    ) => {
      const ts =
        wordMeta && typeof wordMeta.start === 'number'
          ? wordMeta
          : findWordTimestamp(segment, word, wordIndex);

      await seekPlayerTo(ts.start);
      await playAudio();

      const cleanWord = word.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '');
      setPronouncingWord(cleanWord || word);

      if (pronounceToastTimerRef.current) {
        clearTimeout(pronounceToastTimerRef.current);
      }
      pronounceToastTimerRef.current = setTimeout(() => {
        setPronouncingWord(null);
      }, 2000);
    },
    []
  );

  const handleWordLongPress = useCallback(
    async (word: string, segment: DialogueSegment) => {
      wasPlayingBeforeLookupRef.current = isPlaying;
      if (isPlaying) {
        await pauseAudio();
      }

      const cleanWord = word.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '');
      setLookupData({
        word: cleanWord || word,
        phonetic: '',
        part_of_speech: '',
        translation_vi: '',
        context_en: segment.text_en,
        context_vi: segment.text_vi,
      });
      setLookupLoading(true);
      setSheetVisible(true);

      try {
        const details = await lookupWord(word, segment.text_en);
        setLookupData({
          ...details,
          context_en: details.context_en || segment.text_en,
          context_vi: details.context_vi || segment.text_vi,
        });
      } catch {
        setLookupData({
          word: cleanWord || word,
          phonetic: `/${(cleanWord || word).toLowerCase()}/`,
          part_of_speech: 'Từ vựng',
          translation_vi: 'Không thể kết nối máy chủ tra từ',
          context_en: segment.text_en,
          context_vi: segment.text_vi,
        });
      } finally {
        setLookupLoading(false);
      }
    },
    [isPlaying]
  );

  const handleCloseTranslationSheet = useCallback(async () => {
    setSheetVisible(false);
    if (wasPlayingBeforeLookupRef.current) {
      wasPlayingBeforeLookupRef.current = false;
      await playAudio();
    }
  }, []);

  const refreshLibraryList = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const offlineIndex = await getOfflineIndex();
      try {
        const remote = await fetchDialogueList();
        const remoteList = remote.dialogues || [];
        const mergedMap = new Map<string, DialogueSummary>();

        remoteList.forEach((item) => {
          mergedMap.set(item.conversation_id, {
            ...item,
            is_offline: Boolean(offlineIndex[item.conversation_id]),
          });
        });

        Object.values(offlineIndex).forEach((offItem) => {
          if (!mergedMap.has(offItem.conversation_id)) {
            mergedMap.set(offItem.conversation_id, {
              ...offItem,
              is_offline: true,
            });
          }
        });

        setLibraryItems(Array.from(mergedMap.values()));
      } catch {
        const offlineOnly = await getOfflineSummariesList();
        setLibraryItems(offlineOnly);
      }
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  async function handleSelectTab(nextTab: ActiveTabKey) {
    setActiveTab(nextTab);
    if (nextTab === 'library') {
      await refreshLibraryList();
    } else if (nextTab === 'study') {
      await refreshLearningStates();
    }
  }

  async function handleSelectLibraryDialogue(convId: string) {
    setLibraryLoading(true);
    try {
      const offlineData = await getOfflineDialogue(convId);
      const fullData = offlineData || (await fetchDialogue(convId));
      setDialogue(fullData);
      lastScrolledIndex.current = -1;
      await setupTrack(fullData);
      setActiveTab('player');
      await playAudio();
    } catch (e: any) {
      Alert.alert(
        'Không thể mở bài nghe',
        e?.message || 'Vui lòng kiểm tra kết nối mạng hoặc tải bài về máy.'
      );
    } finally {
      setLibraryLoading(false);
    }
  }

  async function handleQuickSaveCurrentOffline() {
    triggerLightHaptic();
    try {
      const updated = await saveDialogueOffline(dialogue);
      setDialogue(updated);
      triggerSuccessHaptic();
      Alert.alert(
        'Đã lưu Offline',
        `Bài "${dialogue.title}" đã được lưu vào bộ nhớ iPhone để nghe không cần mạng.`
      );
    } catch (e: any) {
      Alert.alert(
        'Lỗi lưu Offline',
        e?.message || 'Không thể tải file âm thanh.'
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* iOS Top Header (Shown on Now Playing Screen) */}
      {activeTab === 'player' && (
        <View style={styles.header}>
          <View style={styles.categoryRow}>
            <View style={styles.liveIndicator}>
              <Ionicons
                name="headset"
                size={12}
                color={IOS_COLORS.systemBlue}
              />
              <Text style={styles.headerCategory}>COMMUTE PLAYER</Text>
            </View>

            <View style={styles.statusPillsRight}>
              {dialogue.is_offline ? (
                <View style={styles.offlineTag}>
                  <Ionicons
                    name="arrow-down-circle"
                    size={13}
                    color={IOS_COLORS.systemGreen}
                  />
                  <Text style={styles.offlineTagText}>Đã tải</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.downloadQuickTag}
                  onPress={handleQuickSaveCurrentOffline}
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={13}
                    color={IOS_COLORS.secondaryLabel}
                  />
                  <Text style={styles.downloadQuickTagText}>Lưu máy</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.awakeTag,
                  keepScreenAwake && styles.awakeTagActive,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setKeepScreenAwake((prev) => !prev);
                }}
              >
                <Ionicons
                  name={keepScreenAwake ? 'sunny' : 'moon'}
                  size={12}
                  color={
                    keepScreenAwake
                      ? IOS_COLORS.systemYellow
                      : IOS_COLORS.secondaryLabel
                  }
                />
                <Text
                  style={[
                    styles.awakeTagText,
                    keepScreenAwake && styles.awakeTagTextActive,
                  ]}
                >
                  {keepScreenAwake ? 'Giữ sáng' : 'Tự tắt'}
                </Text>
              </TouchableOpacity>

              {shadowingPauseSec > 0 && (
                <TouchableOpacity
                  style={styles.shadowingTag}
                  onPress={() => handleSelectTab('import')}
                >
                  <Ionicons
                    name="mic"
                    size={12}
                    color={IOS_COLORS.systemGreen}
                  />
                  <Text style={styles.shadowingTagText}>
                    {shadowingPauseSec}s
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {dialogue.title}
          </Text>
        </View>
      )}

      {/* Main Content View */}
      <View style={styles.mainContent}>
        {activeTab === 'library' ? (
          <LibraryScreen
            dialogues={libraryItems}
            activeConversationId={dialogue.conversation_id}
            loading={libraryLoading}
            onSelectDialogue={handleSelectLibraryDialogue}
            onRefresh={refreshLibraryList}
            onClose={() => setActiveTab('player')}
          />
        ) : activeTab === 'import' ? (
          <ImportScreen
            shadowingPauseSec={shadowingPauseSec}
            onShadowingPauseChange={setShadowingPauseSecState}
            onDialogueCreated={async (newDialogue) => {
              setDialogue(newDialogue);
              lastScrolledIndex.current = -1;
              lastShadowedSegIdRef.current = null;
              await setupTrack(newDialogue);
              setActiveTab('player');
              await playAudio();
            }}
            onClose={() => setActiveTab('player')}
          />
        ) : activeTab === 'study' ? (
          <StudyDeckScreen
            onSelectBookmarkedSentence={async (convId, _segId, startSec) => {
              try {
                const cached = await getOfflineDialogue(convId);
                const fullData = cached || (await fetchDialogue(convId));
                setDialogue(fullData);
                await setupTrack(fullData);
                setActiveTab('player');
                await seekPlayerTo(startSec);
                await playAudio();
              } catch (err: any) {
                Alert.alert(
                  'Không thể mở câu',
                  err?.message || 'Không tìm thấy bài hội thoại'
                );
              }
            }}
            onSelectReviewDialogue={async (convId) => {
              try {
                const cached = await getOfflineDialogue(convId);
                const fullData = cached || (await fetchDialogue(convId));
                setDialogue(fullData);
                await setupTrack(fullData);
                setActiveTab('player');
                await playAudio();
              } catch (err: any) {
                Alert.alert(
                  'Không thể mở bài ôn',
                  err?.message || 'Không tìm thấy bài hội thoại'
                );
              }
            }}
            onClose={() => setActiveTab('player')}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={dialogue.segments}
            keyExtractor={(item) => `segment_${item.id}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleScrollEndDrag}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.4,
                });
              }, 100);
            }}
            renderItem={({ item, index }) => {
              const isActiveSeg = index === activeSegmentIndex;
              const bakedSilence = dialogue.silence_sec ?? 0.4;
              const isBakedSilenceGap =
                isActiveSeg &&
                (shadowingPauseSec > 0 || bakedSilence >= 1.5) &&
                position > item.end + 0.05;
              const isShadowingPauseActive =
                isActiveSeg && (isDynamicShadowingWait || isBakedSilenceGap);
              const sentenceBookmarkId = makeSentenceBookmarkId(
                dialogue.conversation_id,
                item.id
              );

              return (
                <KaraokeLine
                  segment={item}
                  currentTime={position}
                  isActive={isActiveSeg}
                  isShadowingPauseActive={isShadowingPauseActive}
                  isBookmarked={bookmarkedIds.has(sentenceBookmarkId)}
                  onToggleBookmark={handleToggleBookmarkSentence}
                  onWordPress={handleWordPress}
                  onWordLongPress={handleWordLongPress}
                  onLinePress={handleJumpToLine}
                />
              );
            }}
          />
        )}

        {/* Floating Re-sync Pill when user is manually scrolling during playback */}
        {isUserScrolling && activeTab === 'player' && isPlaying && (
          <TouchableOpacity
            style={styles.floatingResyncBtn}
            onPress={handleResumeAutoScroll}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-down" size={14} color="#FFFFFF" />
            <Text style={styles.floatingResyncBtnText}>Về câu đang phát</Text>
          </TouchableOpacity>
        )}

        {/* Floating Toast when a word is tapped to speak */}
        {Boolean(pronouncingWord) && (
          <View style={styles.wordPronounceToast}>
            <Ionicons
              name="volume-high"
              size={16}
              color={IOS_COLORS.systemBlue}
            />
            <Text style={styles.wordPronounceToastText}>
              Đang phát: “{pronouncingWord}”
            </Text>
          </View>
        )}
      </View>

      {/* Audio Deck (Shown on Player Tab) */}
      {activeTab === 'player' && (
        <AudioControls
          isPlaying={isPlaying}
          position={position}
          duration={duration}
          rate={playbackRate}
          isLooping={isLooping}
          onPlayPause={handlePlayPause}
          onSeekToStartOfSegment={smartRewindToSentenceStart}
          onSeekForward={smartSkipToNextSentence}
          onToggleRate={handleToggleRate}
          onToggleLoop={handleToggleLoop}
          onSeekToPosition={seekPlayerTo}
        />
      )}

      {/* Standard iOS Bottom Tab Bar */}
      <IOSBottomTabBar
        activeTab={activeTab}
        dueReviewCount={dueReviewCount}
        onSelectTab={handleSelectTab}
      />

      {/* Native iOS Swipeable Bottom Sheet for Word Translation + IPA */}
      <TranslationSheet
        visible={sheetVisible}
        loading={lookupLoading}
        lookupData={lookupData}
        isWordSaved={Boolean(
          lookupData?.word &&
            savedVocabIds.has(lookupData.word.toLowerCase().trim())
        )}
        onSaveWord={handleSaveWordFromSheet}
        onClose={handleCloseTranslationSheet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerCategory: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '700',
    color: IOS_COLORS.systemBlue,
    letterSpacing: 0.8,
  },
  statusPillsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineTagText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemGreen,
    fontWeight: '600',
  },
  downloadQuickTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  downloadQuickTagText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  awakeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  awakeTagActive: {
    backgroundColor: 'rgba(255, 214, 10, 0.14)',
  },
  awakeTagText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  awakeTagTextActive: {
    color: IOS_COLORS.systemYellow,
  },
  shadowingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shadowingTagText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemGreen,
    fontWeight: '700',
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  floatingResyncBtn: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  floatingResyncBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  wordPronounceToast: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 100,
  },
  wordPronounceToastText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
});
