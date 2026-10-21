import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TrackPlayer, {
  State,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';

import { AudioControls } from '../components/AudioControls';
import { KaraokeLine } from '../components/KaraokeLine';
import { TranslationModal } from '../components/TranslationModal';
import {
  createDialogue,
  fetchDialogueList,
  getApiBaseUrl,
  lookupWord,
  setApiBaseUrl,
} from '../services/apiService';
import {
  setCurrentSegments,
  setupTrackPlayer,
} from '../services/trackPlayerService';
import { DialogueData, DialogueSegment } from '../types';

// Fallback seed data in case backend is not reached yet
const FALLBACK_DIALOGUE: DialogueData = {
  conversation_id: 'sample_01',
  title: 'Morning Commute & Travel Plans',
  total_duration: 15.0,
  audio_url: 'http://localhost:8000/static/sample.mp3',
  audio_stream_url: 'http://localhost:8000/api/audio/sample_01/stream',
  offline_filename: 'sample.mp3',
  speakers: {
    Alex: { name: 'Alex', voice: 'en-US-AndrewNeural' },
    Sarah: { name: 'Sarah', voice: 'en-US-AvaNeural' },
  },
  segments: [
    {
      id: 1,
      speaker: 'Alex',
      speaker_name: 'Alex',
      start: 0.0,
      end: 3.5,
      text_en: 'Good morning Sarah, how is the traffic looking today?',
      text_vi: 'Chào buổi sáng Sarah, giao thông hôm nay trông thế nào?',
      words: [
        { word: 'Good', start: 0.0, end: 0.3 },
        { word: 'morning', start: 0.35, end: 0.8 },
        { word: 'Sarah,', start: 0.85, end: 1.4 },
        { word: 'how', start: 1.5, end: 1.7 },
        { word: 'is', start: 1.75, end: 1.9 },
        { word: 'the', start: 1.95, end: 2.1 },
        { word: 'traffic', start: 2.15, end: 2.6 },
        { word: 'looking', start: 2.65, end: 3.0 },
        { word: 'today?', start: 3.05, end: 3.5 },
      ],
    },
    {
      id: 2,
      speaker: 'Sarah',
      speaker_name: 'Sarah',
      start: 3.9,
      end: 7.8,
      text_en: 'Good morning Alex! The highway is completely backed up.',
      text_vi: 'Chào buổi sáng Alex! Đường cao tốc đang kẹt cứng hoàn toàn.',
      words: [
        { word: 'Good', start: 3.9, end: 4.2 },
        { word: 'morning', start: 4.25, end: 4.7 },
        { word: 'Alex!', start: 4.75, end: 5.3 },
        { word: 'The', start: 5.4, end: 5.6 },
        { word: 'highway', start: 5.65, end: 6.2 },
        { word: 'is', start: 6.25, end: 6.4 },
        { word: 'completely', start: 6.45, end: 7.1 },
        { word: 'backed', start: 7.15, end: 7.45 },
        { word: 'up.', start: 7.5, end: 7.8 },
      ],
    },
    {
      id: 3,
      speaker: 'Alex',
      speaker_name: 'Alex',
      start: 8.2,
      end: 11.5,
      text_en: 'Are you taking the subway instead?',
      text_vi: 'Bạn có đi tàu điện ngầm thay thế không?',
      words: [
        { word: 'Are', start: 8.2, end: 8.4 },
        { word: 'you', start: 8.45, end: 8.65 },
        { word: 'taking', start: 8.7, end: 9.1 },
        { word: 'the', start: 9.15, end: 9.35 },
        { word: 'subway', start: 9.4, end: 9.9 },
        { word: 'instead?', start: 9.95, end: 11.5 },
      ],
    },
    {
      id: 4,
      speaker: 'Sarah',
      speaker_name: 'Sarah',
      start: 11.9,
      end: 15.0,
      text_en: 'Yes, definitely! It takes only twenty minutes.',
      text_vi: 'Đúng vậy, chắc chắn rồi! Nó chỉ mất hai mươi phút thôi.',
      words: [
        { word: 'Yes,', start: 11.9, end: 12.3 },
        { word: 'definitely!', start: 12.35, end: 13.1 },
        { word: 'It', start: 13.2, end: 13.4 },
        { word: 'takes', start: 13.45, end: 13.8 },
        { word: 'only', start: 13.85, end: 14.2 },
        { word: 'twenty', start: 14.25, end: 14.6 },
        { word: 'minutes.', start: 14.65, end: 15.0 },
      ],
    },
  ],
};

export const PlayerScreen: React.FC = () => {
  const [dialogue, setDialogue] = useState<DialogueData>(FALLBACK_DIALOGUE);
  const [loading, setLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Translation modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [translationText, setTranslationText] = useState('');

  // Settings & Import modal state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [savedDialogues, setSavedDialogues] = useState<any[]>([]);
  const [ipInput, setIpInput] = useState(getApiBaseUrl());
  const [scriptInput, setScriptInput] = useState(
    'Alex: Hello from my iPhone!\nSarah: Welcome to the English Audio player!'
  );

  const flatListRef = useRef<FlatList<DialogueSegment>>(null);
  const lastActiveIndex = useRef<number>(-1);

  const playbackState = usePlaybackState();
  const progress = useProgress(100);
  const isPlaying = playbackState.state === State.Playing;

  // Initialize TrackPlayer and load dialogue
  useEffect(() => {
    let mounted = true;

    async function init() {
      await setupTrackPlayer();
      if (!mounted) return;
      await loadInitialData();
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadInitialData() {
    try {
      const list = await fetchDialogueList();
      if (list.dialogues && list.dialogues.length > 0) {
        const latestId = list.dialogues[list.dialogues.length - 1].conversation_id;
        const res = await fetch(`${getApiBaseUrl()}/api/dialogue/${latestId}`);
        const fullData: DialogueData = await res.json();
        setDialogue(fullData);
        await setupTrack(fullData);
        return;
      }
    } catch {
      // Offline / fallback to sample
    }
    await setupTrack(FALLBACK_DIALOGUE);
  }

  async function setupTrack(data: DialogueData) {
    setCurrentSegments(data.segments);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: data.conversation_id,
        url: data.audio_stream_url || data.audio_url,
        title: data.title,
        artist: 'English Dialogue Commute',
        duration: data.total_duration,
      });
    } catch (e) {
      console.warn('Track setup error:', e);
    }
  }

  // Auto-scroll FlatList to current segment
  const currentSegmentIndex = dialogue.segments.findIndex(
    (s) => progress.position >= s.start && progress.position < s.end
  );

  useEffect(() => {
    if (
      currentSegmentIndex !== -1 &&
      currentSegmentIndex !== lastActiveIndex.current
    ) {
      lastActiveIndex.current = currentSegmentIndex;
      flatListRef.current?.scrollToIndex({
        index: currentSegmentIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [currentSegmentIndex]);

  // Audio Control Handlers
  async function handlePlayPause() {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }

  async function handleSeekToStartOfSegment() {
    const curIndex = dialogue.segments.findIndex(
      (s) => progress.position >= s.start && progress.position <= s.end + 0.5
    );
    if (curIndex !== -1) {
      const targetStart = dialogue.segments[curIndex].start;
      await TrackPlayer.seekTo(Math.max(0, targetStart));
    } else {
      await TrackPlayer.seekTo(Math.max(0, progress.position - 5));
    }
  }

  async function handleSeekForward() {
    await TrackPlayer.seekTo(Math.min(dialogue.total_duration, progress.position + 5));
  }

  async function handleToggleRate() {
    const rates = [1.0, 1.25, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    await TrackPlayer.setRate(nextRate);
  }

  async function handleJumpToLine(seg: DialogueSegment) {
    await TrackPlayer.seekTo(seg.start);
    if (!isPlaying) {
      await TrackPlayer.play();
    }
  }

  // Word Tap-to-Translate
  async function handleWordPress(word: string) {
    await TrackPlayer.pause();
    setSelectedWord(word);
    setTranslationText('Đang tra từ...');
    setModalVisible(true);

    try {
      const res = await lookupWord(word);
      setTranslationText(res.translation_vi || 'Không tìm thấy bản dịch');
    } catch {
      setTranslationText('Lỗi kết nối tra từ');
    }
  }

  async function handleCloseTranslationModal() {
    setModalVisible(false);
    await TrackPlayer.play();
  }

  // Create new dialogue via API
  async function handleCreateNewDialogue() {
    if (!scriptInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập kịch bản hội thoại');
      return;
    }
    setLoading(true);
    try {
      setApiBaseUrl(ipInput);
      const res = await createDialogue(scriptInput, 'Hội thoại mới');
      setDialogue(res);
      await setupTrack(res);
      setSettingsVisible(false);
      Alert.alert('Thành công', 'Đã tạo và nạp bài hội thoại mới!');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tạo kịch bản');
    } finally {
      setLoading(false);
    }
  }

  // Open Library
  async function handleOpenLibrary() {
    setLoading(true);
    try {
      setApiBaseUrl(ipInput);
      const list = await fetchDialogueList();
      setSavedDialogues(list.dialogues || []);
      setLibraryVisible(true);
    } catch (e: any) {
      Alert.alert('Thông báo', 'Không thể kết nối danh sách từ server: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }

  // Select dialogue to replay
  async function handleSelectSavedDialogue(convId: string) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/dialogue/${convId}`);
      const fullData: DialogueData = await res.json();
      setDialogue(fullData);
      await setupTrack(fullData);
      setLibraryVisible(false);
      await TrackPlayer.play();
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể mở bài nghe: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerCategory}>LUYỆN NGHE ĐI XE</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {dialogue.title}
          </Text>
        </View>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.libraryBtn}
            onPress={handleOpenLibrary}
          >
            <Text style={styles.libraryBtnText}>📚 Bài đã lưu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.settingsBtnText}>⚙ Cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Karaoke Sync Transcript List */}
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
            currentTime={progress.position}
            isActive={index === currentSegmentIndex}
            onWordPress={handleWordPress}
            onLinePress={() => handleJumpToLine(item)}
          />
        )}
      />

      {/* Floating Bottom Audio Controls */}
      <AudioControls
        isPlaying={isPlaying}
        position={progress.position}
        duration={dialogue.total_duration}
        rate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeekToStartOfSegment={handleSeekToStartOfSegment}
        onSeekForward={handleSeekForward}
        onToggleRate={handleToggleRate}
      />

      {/* Tap-to-Translate Modal */}
      <TranslationModal
        visible={modalVisible}
        word={selectedWord}
        translation={translationText}
        onClose={handleCloseTranslationModal}
      />

      {/* Settings & Import Modal */}
      <Modal visible={settingsVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cài đặt & Nhập Kịch bản</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalCloseText}>Đóng ✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Địa chỉ IP Backend Mac (LAN):</Text>
            <TextInput
              style={styles.input}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="http://192.168.1.15:8000"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Nhập kịch bản hội thoại:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={scriptInput}
              onChangeText={setScriptInput}
              multiline
              placeholder="Alex: Hello!\nSarah: Hi there!"
              placeholderTextColor="#666"
            />

            <TouchableOpacity
              style={[styles.createBtn, loading && styles.disabledBtn]}
              onPress={handleCreateNewDialogue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.createBtnText}>Tạo bài nghe & Đồng bộ</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Library Modal */}
      <Modal visible={libraryVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thư Viện Bài Học Đã Lưu</Text>
            <TouchableOpacity onPress={() => setLibraryVisible(false)}>
              <Text style={styles.modalCloseText}>Đóng ✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={savedDialogues}
            keyExtractor={(item) => item.conversation_id}
            contentContainerStyle={styles.libraryList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có bài học nào được lưu trên máy chủ.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dialogueCard}
                onPress={() => handleSelectSavedDialogue(item.conversation_id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>
                    ⏱ {Math.round(item.total_duration || 0)}s • {item.segments_count || 0} câu thoại
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1DB954',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#262626',
    borderRadius: 16,
  },
  settingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#181818',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  createBtn: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  libraryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1DB954',
    borderRadius: 16,
  },
  libraryBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  libraryList: {
    padding: 16,
  },
  dialogueCard: {
    backgroundColor: '#242424',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  playIcon: {
    fontSize: 18,
    color: '#1DB954',
  },
  cardMeta: {
    marginTop: 2,
  },
  cardMetaText: {
    fontSize: 13,
    color: '#999999',
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
