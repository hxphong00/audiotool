import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookmarkedSentence,
  SavedVocabItem,
  SpacedRepetitionRecord,
} from '../types';
import {
  formatSM2StatusLabel,
  getAllSM2Records,
  getBookmarkedSentences,
  getSavedVocabulary,
  isSM2Due,
  recordDialogueReviewSM2,
  removeSentenceBookmark,
  removeWordFromVocabulary,
} from '../services/learningService';

interface StudyDeckScreenProps {
  onSelectBookmarkedSentence: (
    conversationId: string,
    segmentId: number,
    startSec: number
  ) => void;
  onSelectReviewDialogue: (conversationId: string) => void;
  onClose: () => void;
}

type SubTab = 'vocab' | 'sentences' | 'sm2';

export const StudyDeckScreen: React.FC<StudyDeckScreenProps> = ({
  onSelectBookmarkedSentence,
  onSelectReviewDialogue,
  onClose,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('vocab');
  const [loading, setLoading] = useState(true);

  // Data states
  const [vocabList, setVocabList] = useState<SavedVocabItem[]>([]);
  const [sentenceList, setSentenceList] = useState<BookmarkedSentence[]>([]);
  const [sm2Records, setSm2Records] = useState<
    Record<string, SpacedRepetitionRecord>
  >({});

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [words, sentences, sm2] = await Promise.all([
        getSavedVocabulary(),
        getBookmarkedSentences(),
        getAllSM2Records(),
      ]);
      setVocabList(words);
      setSentenceList(sentences);
      setSm2Records(sm2);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Actions
  async function handleDeleteWord(id: string) {
    const updated = await removeWordFromVocabulary(id);
    setVocabList(updated);
  }

  async function handleDeleteBookmark(id: string) {
    const updated = await removeSentenceBookmark(id);
    setSentenceList(updated);
  }

  async function handleSM2Rate(
    conversationId: string,
    quality: 3 | 4 | 5
  ) {
    const updated = await recordDialogueReviewSM2(conversationId, quality);
    setSm2Records((prev) => ({
      ...prev,
      [conversationId]: updated,
    }));
    Alert.alert(
      'Đã ghi nhận ôn tập ✓',
      `Bài đã được xếp lịch cho chu kỳ tiếp theo (${updated.interval_days} ngày tới).`
    );
  }

  // Count due for badge
  const dueCount = Object.values(sm2Records).filter((r) => isSM2Due(r)).length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerCategory}>GHI NHỚ & ÔN TẬP</Text>
          <Text style={styles.headerTitle}>Sổ tay Cá nhân</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ Đóng</Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'vocab' && styles.activeTabBtn]}
          onPress={() => setSubTab('vocab')}
        >
          <Text
            style={[
              styles.tabBtnText,
              subTab === 'vocab' && styles.activeTabBtnText,
            ]}
          >
            📖 Từ vựng ({vocabList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            subTab === 'sentences' && styles.activeTabBtn,
          ]}
          onPress={() => setSubTab('sentences')}
        >
          <Text
            style={[
              styles.tabBtnText,
              subTab === 'sentences' && styles.activeTabBtnText,
            ]}
          >
            ⭐ Câu khó ({sentenceList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'sm2' && styles.activeTabBtn]}
          onPress={() => setSubTab('sm2')}
        >
          <Text
            style={[
              styles.tabBtnText,
              subTab === 'sm2' && styles.activeTabBtnText,
            ]}
          >
            🔔 Ôn tập SM-2 {dueCount > 0 ? `(${dueCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Đang tải dữ liệu học tập...</Text>
        </View>
      ) : subTab === 'vocab' ? (
        // Tab 1: Saved Vocab Deck
        vocabList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Chưa có từ vựng nào</Text>
            <Text style={styles.emptySubtitle}>
              Khi nghe hội thoại, chạm vào bất kỳ từ nào rồi bấm "Lưu từ này" để
              xem lại tại đây.
            </Text>
          </View>
        ) : (
          <FlatList
            data={vocabList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.wordInfoWrap}>
                    <Text style={styles.wordText}>{item.word}</Text>
                    {Boolean(item.phonetic) && (
                      <Text style={styles.phoneticText}>{item.phonetic}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteWord(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.translationText}>
                  {item.translation_vi}
                </Text>

                {Boolean(item.context_en) && (
                  <View style={styles.contextWrap}>
                    <Text style={styles.contextEn}>“{item.context_en}”</Text>
                    {Boolean(item.context_vi) && (
                      <Text style={styles.contextVi}>➔ {item.context_vi}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          />
        )
      ) : subTab === 'sentences' ? (
        // Tab 2: Bookmarked Sentences
        sentenceList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyTitle}>Chưa có câu nào được lưu</Text>
            <Text style={styles.emptySubtitle}>
              Bấm biểu tượng ngôi sao ☆ cạnh tên nhân vật trên màn hình nghe để
              đánh dấu các câu nói khó / hay.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sentenceList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  onSelectBookmarkedSentence(
                    item.conversation_id,
                    item.segment_id,
                    item.start
                  )
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.sentenceSpeakerBadge}>
                    <Text style={styles.sentenceSpeakerText}>
                      🎙 {item.speaker} ({item.start.toFixed(1)}s)
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteBookmark(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>✕ Bỏ lưu</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sentenceEnText}>{item.text_en}</Text>
                <Text style={styles.sentenceViText}>{item.text_vi}</Text>

                <View style={styles.sentenceFooter}>
                  <Text style={styles.dialogueSourceText} numberOfLines={1}>
                    📚 {item.dialogue_title || 'Bài hội thoại'}
                  </Text>
                  <Text style={styles.playHintText}>Bấm để phát ▶</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        // Tab 3: Spaced Repetition (Anki SM-2)
        Object.keys(sm2Records).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Chưa có bài nào trong chu kỳ</Text>
            <Text style={styles.emptySubtitle}>
              Mỗi khi bạn nghe xong 1 bài hội thoại, hệ thống sẽ tự động xếp
              lịch ôn tập sau 1 ngày, 3 ngày và 7 ngày theo thuật toán SM-2.
            </Text>
          </View>
        ) : (
          <FlatList
            data={Object.values(sm2Records)}
            keyExtractor={(item) => item.conversation_id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const status = formatSM2StatusLabel(item);
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.sm2ConvTitle} numberOfLines={1}>
                      ID: {item.conversation_id}
                    </Text>
                    <View
                      style={[
                        styles.sm2Badge,
                        status.isDue ? styles.sm2BadgeDue : styles.sm2BadgeWait,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sm2BadgeText,
                          status.isDue
                            ? styles.sm2BadgeTextDue
                            : styles.sm2BadgeTextWait,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sm2DetailText}>
                    Chu kỳ: {item.interval_days} ngày • Đã ôn: {item.repetitions}{' '}
                    lần • Hệ số dễ (Ease): {item.ease_factor}
                  </Text>

                  {/* Rating Actions for SM-2 */}
                  <View style={styles.sm2ActionsRow}>
                    <TouchableOpacity
                      style={styles.sm2PlayBtn}
                      onPress={() =>
                        onSelectReviewDialogue(item.conversation_id)
                      }
                    >
                      <Text style={styles.sm2PlayBtnText}>Nghe lại ▶</Text>
                    </TouchableOpacity>

                    <View style={styles.rateButtonsGroup}>
                      <TouchableOpacity
                        style={[styles.rateBtn, styles.rateBtn3]}
                        onPress={() =>
                          handleSM2Rate(item.conversation_id, 3)
                        }
                      >
                        <Text style={styles.rateBtnText}>1d (Khó)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rateBtn, styles.rateBtn4]}
                        onPress={() =>
                          handleSM2Rate(item.conversation_id, 4)
                        }
                      >
                        <Text style={styles.rateBtnText}>3d (Khá)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rateBtn, styles.rateBtn5]}
                        onPress={() =>
                          handleSM2Rate(item.conversation_id, 5)
                        }
                      >
                        <Text style={styles.rateBtnText}>7d (Tốt)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1118',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#202634',
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1DB954',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#202634',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  closeBtnText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#141923',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#1C2331',
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: '#1DB954',
  },
  tabBtnText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabBtnText: {
    color: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9E9E9E',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8892B0',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#161C28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242C3E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1DB954',
  },
  phoneticText: {
    fontSize: 13,
    color: '#8892B0',
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  translationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contextWrap: {
    backgroundColor: '#0F131C',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  contextEn: {
    fontSize: 13,
    color: '#E0E0E0',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  contextVi: {
    fontSize: 12,
    color: '#8892B0',
  },
  sentenceSpeakerBadge: {
    backgroundColor: '#202634',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sentenceSpeakerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1DB954',
  },
  sentenceEnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
  },
  sentenceViText: {
    fontSize: 14,
    color: '#A0AEC0',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#202634',
    paddingTop: 8,
  },
  dialogueSourceText: {
    fontSize: 12,
    color: '#718096',
    flex: 1,
  },
  playHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1DB954',
    marginLeft: 8,
  },
  sm2ConvTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  sm2Badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sm2BadgeDue: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  sm2BadgeWait: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
  },
  sm2BadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sm2BadgeTextDue: {
    color: '#FF6B6B',
  },
  sm2BadgeTextWait: {
    color: '#1DB954',
  },
  sm2DetailText: {
    fontSize: 12,
    color: '#718096',
    marginVertical: 8,
  },
  sm2ActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  sm2PlayBtn: {
    backgroundColor: '#202634',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  sm2PlayBtnText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '700',
  },
  rateButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rateBtn3: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: '#FF6B6B',
  },
  rateBtn4: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  rateBtn5: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderColor: '#1DB954',
  },
  rateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E0E0E0',
  },
});
