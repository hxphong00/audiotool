import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AudioControls } from '../components/AudioControls';
import { KaraokeLine } from '../components/KaraokeLine';
import { TranslationSheet } from '../components/TranslationSheet';
import { useKaraokeSync } from '../hooks/useKaraokeSync';
import {
  fetchDialogue,
  fetchDialogueList,
  loadSavedApiBaseUrl,
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
  setupTrackPlayer,
  smartRewindToSentenceStart,
  smartSkipToNextSentence,
} from '../services/trackPlayerService';
import {
  DialogueData,
  DialogueSegment,
  DialogueSummary,
  WordLookupResult,
} from '../types';
import { ImportScreen } from './ImportScreen';
import { LibraryScreen } from './LibraryScreen';

type ActiveTab = 'player' | 'library' | 'import';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');
  const [dialogue, setDialogue] = useState<DialogueData>(FALLBACK_DIALOGUE);
  const [libraryItems, setLibraryItems] = useState<DialogueSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Word Tap-to-Translate Bottom Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<WordLookupResult | null>(null);
  const wasPlayingBeforeLookupRef = useRef<boolean>(false);

  const flatListRef = useRef<FlatList<DialogueSegment>>(null);
  const lastScrolledIndex = useRef<number>(-1);

  const { isPlaying, position, duration, activeSegmentIndex } = useKaraokeSync(
    dialogue.segments,
    dialogue.total_duration
  );

  // Initialize player & load initial dialogue (Offline-first + Server sync)
  useEffect(() => {
    let mounted = true;

    async function init() {
      await loadSavedApiBaseUrl();
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
    });
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
      // Offline mode fallback: check local offline storage
      const offlineList = await getOfflineSummariesList();
      if (offlineList.length > 0) {
        const localData = await getOfflineDialogue(offlineList[0].conversation_id);
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
      activeTab === 'player' &&
      activeSegmentIndex !== -1 &&
      activeSegmentIndex !== lastScrolledIndex.current &&
      dialogue.segments.length > activeSegmentIndex
    ) {
      lastScrolledIndex.current = activeSegmentIndex;
      flatListRef.current?.scrollToIndex({
        index: activeSegmentIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [activeSegmentIndex, activeTab, dialogue.segments.length]);

  // Transport controls
  async function handlePlayPause() {
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

  const handleJumpToLine = useCallback(
    async (seg: DialogueSegment) => {
      await seekPlayerTo(seg.start);
      if (!isPlaying) {
        await playAudio();
      }
    },
    [isPlaying]
  );

  // Word Tap-to-Translate with context & smart resume
  const handleWordPress = useCallback(
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

  // Refresh merged Library list (Server + Offline storage)
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
        // Offline mode: show locally downloaded lessons
        const offlineOnly = await getOfflineSummariesList();
        setLibraryItems(offlineOnly);
      }
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  async function handleOpenLibraryTab() {
    setActiveTab('library');
    await refreshLibraryList();
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
    try {
      const updated = await saveDialogueOffline(dialogue);
      setDialogue(updated);
      Alert.alert(
        'Đã lưu Offline ✓',
        `Bài "${dialogue.title}" đã được lưu vào bộ nhớ iPhone để nghe không cần mạng.`
      );
    } catch (e: any) {
      Alert.alert('Lỗi lưu Offline', e?.message || 'Không thể tải file âm thanh.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation & Status Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.categoryRow}>
            <Text style={styles.headerCategory}>LUYỆN NGHE ĐI XE</Text>
            {dialogue.is_offline ? (
              <View style={styles.offlineTag}>
                <Text style={styles.offlineTagText}>✓ OFFLINE</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.downloadQuickTag}
                onPress={handleQuickSaveCurrentOffline}
              >
                <Text style={styles.downloadQuickTagText}>⬇ Lưu máy</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {dialogue.title}
          </Text>
        </View>

        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              activeTab === 'library' && styles.activeNavBtn,
            ]}
            onPress={handleOpenLibraryTab}
          >
            <Text
              style={[
                styles.navBtnText,
                activeTab === 'library' && styles.activeNavBtnText,
              ]}
            >
              📚 Thư viện
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navBtn,
              activeTab === 'import' && styles.activeNavBtn,
            ]}
            onPress={() => setActiveTab('import')}
          >
            <Text
              style={[
                styles.navBtnText,
                activeTab === 'import' && styles.activeNavBtnText,
              ]}
            >
              ➕ Tạo mới
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content View: Player / Library / Import */}
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
          onDialogueCreated={async (newDialogue) => {
            setDialogue(newDialogue);
            lastScrolledIndex.current = -1;
            await setupTrack(newDialogue);
            setActiveTab('player');
            await playAudio();
          }}
          onClose={() => setActiveTab('player')}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={dialogue.segments}
          keyExtractor={(item) => `segment_${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.4,
              });
            }, 100);
          }}
          renderItem={({ item, index }) => (
            <KaraokeLine
              segment={item}
              currentTime={position}
              isActive={index === activeSegmentIndex}
              onWordPress={handleWordPress}
              onLinePress={handleJumpToLine}
            />
          )}
        />
      )}

      {/* Persistent Bottom Audio Controls */}
      <AudioControls
        isPlaying={isPlaying}
        position={position}
        duration={duration}
        rate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeekToStartOfSegment={smartRewindToSentenceStart}
        onSeekForward={smartSkipToNextSentence}
        onToggleRate={handleToggleRate}
        onSeekToPosition={seekPlayerTo}
      />

      {/* Native iOS Swipeable Bottom Sheet for Word Translation + IPA */}
      <TranslationSheet
        visible={sheetVisible}
        loading={lookupLoading}
        lookupData={lookupData}
        onClose={handleCloseTranslationSheet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1DB954',
    letterSpacing: 1.1,
  },
  offlineTag: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offlineTagText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '800',
  },
  downloadQuickTag: {
    backgroundColor: '#252525',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  downloadQuickTagText: {
    color: '#CCCCCC',
    fontSize: 10,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#242424',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeNavBtn: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  activeNavBtnText: {
    color: '#000000',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 28,
  },
});
