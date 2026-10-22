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
import { Ionicons } from '@expo/vector-icons';
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
import { IOS_COLORS, IOS_TYPOGRAPHY } from '../theme/iosTheme';
import {
  triggerLightHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';

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
}) => {
  const [subTab, setSubTab] = useState<SubTab>('vocab');
  const [loading, setLoading] = useState(true);

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

  async function handleDeleteWord(id: string) {
    triggerLightHaptic();
    const updated = await removeWordFromVocabulary(id);
    setVocabList(updated);
  }

  async function handleDeleteBookmark(id: string) {
    triggerLightHaptic();
    const updated = await removeSentenceBookmark(id);
    setSentenceList(updated);
  }

  async function handleSM2Rate(
    conversationId: string,
    quality: 3 | 4 | 5
  ) {
    triggerSuccessHaptic();
    const updated = await recordDialogueReviewSM2(conversationId, quality);
    setSm2Records((prev) => ({
      ...prev,
      [conversationId]: updated,
    }));
    Alert.alert(
      'Đã ghi nhận ôn tập',
      `Bài đã được xếp lịch cho chu kỳ tiếp theo (${updated.interval_days} ngày tới).`
    );
  }

  const dueCount = Object.values(sm2Records).filter((r) => isSM2Due(r)).length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sổ tay & Ôn tập</Text>
        <Text style={styles.headerSubtitle}>
          Từ vựng đã tra, câu đánh dấu & lịch lặp lại ngắt quãng SM-2
        </Text>
      </View>

      {/* Native iOS Segmented Control */}
      <View style={styles.segmentedBar}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            subTab === 'vocab' && styles.activeSegmentBtn,
          ]}
          onPress={() => {
            triggerSelectionHaptic();
            setSubTab('vocab');
          }}
        >
          <Text
            style={[
              styles.segmentBtnText,
              subTab === 'vocab' && styles.activeSegmentBtnText,
            ]}
          >
            Từ vựng ({vocabList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            subTab === 'sentences' && styles.activeSegmentBtn,
          ]}
          onPress={() => {
            triggerSelectionHaptic();
            setSubTab('sentences');
          }}
        >
          <Text
            style={[
              styles.segmentBtnText,
              subTab === 'sentences' && styles.activeSegmentBtnText,
            ]}
          >
            Câu lưu ({sentenceList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            subTab === 'sm2' && styles.activeSegmentBtn,
          ]}
          onPress={() => {
            triggerSelectionHaptic();
            setSubTab('sm2');
          }}
        >
          <Text
            style={[
              styles.segmentBtnText,
              subTab === 'sm2' && styles.activeSegmentBtnText,
            ]}
          >
            Lịch SM-2{dueCount > 0 ? ` (${dueCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          <Text style={styles.loadingText}>Đang tải dữ liệu học tập...</Text>
        </View>
      ) : subTab === 'vocab' ? (
        vocabList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={48}
              color={IOS_COLORS.tertiaryLabel}
            />
            <Text style={styles.emptyTitle}>Chưa có từ vựng nào</Text>
            <Text style={styles.emptySubtitle}>
              Khi nghe hội thoại, nhấn giữ vào bất kỳ từ nào rồi bấm "Lưu vào sổ tay" để ôn lại tại đây.
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
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={IOS_COLORS.systemRed}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.translationText}>
                  {item.translation_vi}
                </Text>

                {Boolean(item.context_en) && (
                  <View style={styles.contextWrap}>
                    <Text style={styles.contextEn}>“{item.context_en}”</Text>
                    {Boolean(item.context_vi) && (
                      <Text style={styles.contextVi}>{item.context_vi}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          />
        )
      ) : subTab === 'sentences' ? (
        sentenceList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="bookmark-outline"
              size={48}
              color={IOS_COLORS.tertiaryLabel}
            />
            <Text style={styles.emptyTitle}>Chưa có câu nào được lưu</Text>
            <Text style={styles.emptySubtitle}>
              Bấm biểu tượng đánh dấu cạnh tên nhân vật trên màn hình nghe để lưu lại các câu nói hay.
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
                activeOpacity={0.75}
                onPress={() => {
                  triggerSelectionHaptic();
                  onSelectBookmarkedSentence(
                    item.conversation_id,
                    item.segment_id,
                    item.start
                  );
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.sentenceSpeakerBadge}>
                    <Ionicons
                      name="mic-outline"
                      size={12}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.sentenceSpeakerText}>
                      {item.speaker} • {item.start.toFixed(1)}s
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteBookmark(item.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={IOS_COLORS.systemRed}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.sentenceEnText}>{item.text_en}</Text>
                <Text style={styles.sentenceViText}>{item.text_vi}</Text>

                <View style={styles.sentenceFooter}>
                  <Text style={styles.dialogueSourceText} numberOfLines={1}>
                    {item.dialogue_title || 'Bài hội thoại'}
                  </Text>
                  <View style={styles.playHintRow}>
                    <Text style={styles.playHintText}>Phát câu này</Text>
                    <Ionicons
                      name="play-circle"
                      size={16}
                      color={IOS_COLORS.systemBlue}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      ) : Object.keys(sm2Records).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-outline"
            size={48}
            color={IOS_COLORS.tertiaryLabel}
          />
          <Text style={styles.emptyTitle}>Chưa có bài nào trong chu kỳ</Text>
          <Text style={styles.emptySubtitle}>
            Mỗi khi bạn mở 1 bài hội thoại, hệ thống sẽ tự động xếp lịch ôn tập sau 1, 3 và 7 ngày theo thuật toán Anki SM-2.
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
                    Bài học: {item.conversation_id}
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
                  lần • Hệ số Ease: {item.ease_factor}
                </Text>

                <View style={styles.sm2ActionsRow}>
                  <TouchableOpacity
                    style={styles.sm2PlayBtn}
                    onPress={() => {
                      triggerSelectionHaptic();
                      onSelectReviewDialogue(item.conversation_id);
                    }}
                  >
                    <Ionicons
                      name="play"
                      size={13}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.sm2PlayBtnText}>Nghe lại</Text>
                  </TouchableOpacity>

                  <View style={styles.rateButtonsGroup}>
                    <TouchableOpacity
                      style={[styles.rateBtn, styles.rateBtn3]}
                      onPress={() => handleSM2Rate(item.conversation_id, 3)}
                    >
                      <Text style={[styles.rateBtnText, { color: IOS_COLORS.systemRed }]}>
                        1d (Khó)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rateBtn, styles.rateBtn4]}
                      onPress={() => handleSM2Rate(item.conversation_id, 4)}
                    >
                      <Text style={[styles.rateBtnText, { color: IOS_COLORS.systemOrange }]}>
                        3d (Khá)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rateBtn, styles.rateBtn5]}
                      onPress={() => handleSM2Rate(item.conversation_id, 5)}
                    >
                      <Text style={[styles.rateBtnText, { color: IOS_COLORS.systemGreen }]}>
                        7d (Tốt)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  segmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 3,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSegmentBtn: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  segmentBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  activeSegmentBtnText: {
    color: IOS_COLORS.label,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wordInfoWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  wordText: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
  phoneticText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  deleteBtn: {
    padding: 4,
  },
  translationText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  contextWrap: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    padding: 10,
    borderRadius: 10,
  },
  contextEn: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.label,
    marginBottom: 3,
  },
  contextVi: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  sentenceSpeakerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sentenceSpeakerText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '700',
    color: IOS_COLORS.systemBlue,
  },
  sentenceEnText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  sentenceViText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
  },
  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    paddingTop: 8,
  },
  dialogueSourceText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    flex: 1,
  },
  playHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playHintText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  sm2ConvTitle: {
    ...IOS_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: IOS_COLORS.label,
    flex: 1,
  },
  sm2Badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sm2BadgeDue: {
    backgroundColor: 'rgba(255, 69, 58, 0.16)',
  },
  sm2BadgeWait: {
    backgroundColor: 'rgba(48, 209, 88, 0.16)',
  },
  sm2BadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '600',
  },
  sm2BadgeTextDue: {
    color: IOS_COLORS.systemRed,
  },
  sm2BadgeTextWait: {
    color: IOS_COLORS.systemGreen,
  },
  sm2DetailText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  sm2PlayBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
  rateButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rateBtn3: {
    backgroundColor: 'rgba(255, 69, 58, 0.14)',
  },
  rateBtn4: {
    backgroundColor: 'rgba(255, 159, 10, 0.14)',
  },
  rateBtn5: {
    backgroundColor: 'rgba(48, 209, 88, 0.14)',
  },
  rateBtnText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
});
