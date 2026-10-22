import React, { useState } from 'react';
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
import { formatTimeMMSS } from '../components/AudioControls';
import { fetchDialogue } from '../services/apiService';
import {
  removeOfflineDialogue,
  saveDialogueOffline,
} from '../services/storageService';
import { DialogueSummary } from '../types';
import { IOS_COLORS, IOS_TYPOGRAPHY } from '../theme/iosTheme';
import {
  triggerLightHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';

interface LibraryScreenProps {
  dialogues: DialogueSummary[];
  activeConversationId: string;
  loading: boolean;
  onSelectDialogue: (conversationId: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

function formatDateShort(iso?: string): string {
  if (!iso) return 'Hôm nay';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Hôm nay';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return 'Hôm nay';
  }
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  dialogues,
  activeConversationId,
  loading,
  onSelectDialogue,
  onRefresh,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownloadToggle(item: DialogueSummary) {
    triggerLightHaptic();
    if (item.is_offline) {
      Alert.alert(
        'Xóa bản tải Offline?',
        `Bạn có muốn xóa bản lưu trong máy của "${item.title}" không? (Bài trên máy chủ vẫn giữ nguyên)`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa bản Offline',
            style: 'destructive',
            onPress: async () => {
              await removeOfflineDialogue(item.conversation_id);
              onRefresh();
            },
          },
        ]
      );
      return;
    }

    setDownloadingId(item.conversation_id);
    try {
      const fullData = await fetchDialogue(item.conversation_id);
      await saveDialogueOffline(fullData);
      triggerSuccessHaptic();
      onRefresh();
      Alert.alert(
        'Đã tải về iPhone',
        `Bài "${item.title}" đã được lưu vào bộ nhớ máy để nghe khi không có mạng 4G/5G.`
      );
    } catch (e: any) {
      Alert.alert(
        'Lỗi tải về máy',
        e?.message || 'Không thể tải file âm thanh về máy.'
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Thư viện</Text>
          <Text style={styles.subtitle}>
            Các bài hội thoại đã tạo & tải về iPhone
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerSelectionHaptic();
            onRefresh();
          }}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={IOS_COLORS.systemBlue}
          />
          <Text style={styles.refreshBtnText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          <Text style={styles.loadingText}>
            Đang đồng bộ danh sách bài học...
          </Text>
        </View>
      ) : (
        <FlatList
          data={dialogues}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons
                name="library-outline"
                size={48}
                color={IOS_COLORS.tertiaryLabel}
              />
              <Text style={styles.emptyTitle}>Chưa có bài hội thoại</Text>
              <Text style={styles.emptyText}>
                Chuyển sang tab "Tạo bài" ở thanh điều hướng phía dưới để tạo bài nghe đầu tiên.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCurrent = item.conversation_id === activeConversationId;
            const isDownloading = downloadingId === item.conversation_id;

            return (
              <TouchableOpacity
                style={[styles.card, isCurrent && styles.activeCard]}
                activeOpacity={0.75}
                onPress={() => {
                  triggerSelectionHaptic();
                  onSelectDialogue(item.conversation_id);
                }}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.artworkIcon}>
                    <Ionicons
                      name={isCurrent ? 'volume-high' : 'headset'}
                      size={22}
                      color={
                        isCurrent
                          ? '#FFFFFF'
                          : IOS_COLORS.systemBlue
                      }
                    />
                  </View>

                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {isCurrent && (
                      <View style={styles.playingBadgeRow}>
                        <Ionicons
                          name="radio-outline"
                          size={12}
                          color={IOS_COLORS.systemBlue}
                        />
                        <Text style={styles.playingBadge}>Đang phát</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.offlineBtn,
                      item.is_offline && styles.offlineSavedBtn,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDownloadToggle(item);
                    }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator
                        size="small"
                        color={IOS_COLORS.systemBlue}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            item.is_offline
                              ? 'arrow-down-circle'
                              : 'cloud-download-outline'
                          }
                          size={16}
                          color={
                            item.is_offline
                              ? IOS_COLORS.systemGreen
                              : IOS_COLORS.secondaryLabel
                          }
                        />
                        <Text
                          style={[
                            styles.offlineBtnText,
                            item.is_offline && styles.offlineSavedBtnText,
                          ]}
                        >
                          {item.is_offline ? 'Đã tải' : 'Tải về'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardMetaRow}>
                  <View style={styles.metaItemsWrap}>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={IOS_COLORS.secondaryLabel}
                      />
                      <Text style={styles.metaText}>
                        {formatTimeMMSS(item.total_duration)}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={12}
                        color={IOS_COLORS.secondaryLabel}
                      />
                      <Text style={styles.metaText}>
                        {item.segments_count || 0} câu
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={IOS_COLORS.secondaryLabel}
                      />
                      <Text style={styles.metaText}>
                        {formatDateShort(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.playPromptRow}>
                    <Text style={styles.playPrompt}>Nghe</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={IOS_COLORS.systemBlue}
                    />
                  </View>
                </View>
              </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  title: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.label,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  refreshBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 12,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  activeCard: {
    borderColor: IOS_COLORS.systemBlue,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artworkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  playingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  playingBadge: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  offlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  offlineSavedBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  offlineBtnText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  offlineSavedBtnText: {
    color: IOS_COLORS.systemGreen,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginVertical: 10,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItemsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  playPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  playPrompt: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});
