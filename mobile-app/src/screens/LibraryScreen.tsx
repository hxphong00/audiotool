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
import { formatTimeMMSS } from '../components/AudioControls';
import { fetchDialogue } from '../services/apiService';
import {
  removeOfflineDialogue,
  saveDialogueOffline,
} from '../services/storageService';
import { DialogueSummary } from '../types';

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
  onClose,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownloadToggle(item: DialogueSummary) {
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
          <Text style={styles.title}>Thư Viện Bài Học</Text>
          <Text style={styles.subtitle}>
            Nghe lại mọi lúc • Hỗ trợ lưu Offline trên iPhone
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>↻ Làm mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>Đóng ✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Đang đồng bộ danh sách bài học...</Text>
        </View>
      ) : (
        <FlatList
          data={dialogues}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                Chưa có bài hội thoại nào. Hãy chuyển sang mục "➕ Tạo bài mới" để tạo bài nghe đầu tiên!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCurrent = item.conversation_id === activeConversationId;
            const isDownloading = downloadingId === item.conversation_id;

            return (
              <TouchableOpacity
                style={[styles.card, isCurrent && styles.activeCard]}
                activeOpacity={0.8}
                onPress={() => onSelectDialogue(item.conversation_id)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.playingBadge}>● Đang mở</Text>
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
                      <ActivityIndicator size="small" color="#1DB954" />
                    ) : (
                      <Text
                        style={[
                          styles.offlineBtnText,
                          item.is_offline && styles.offlineSavedBtnText,
                        ]}
                      >
                        {item.is_offline ? '✓ Đã lưu máy' : '⬇ Tải về máy'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.cardMetaRow}>
                  <Text style={styles.metaText}>
                    ⏱ {formatTimeMMSS(item.total_duration)} • 💬{' '}
                    {item.segments_count || 0} câu • 📅{' '}
                    {formatDateShort(item.created_at)}
                  </Text>
                  <Text style={styles.playPrompt}>Nghe ngay ▶</Text>
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
    backgroundColor: '#121212',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  refreshBtnText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#1DB954',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#AAAAAA',
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  activeCard: {
    borderColor: '#1DB954',
    backgroundColor: '#222623',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playingBadge: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  offlineBtn: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    minWidth: 96,
    alignItems: 'center',
  },
  offlineSavedBtn: {
    backgroundColor: 'rgba(29, 185, 84, 0.16)',
    borderColor: '#1DB954',
  },
  offlineBtnText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '700',
  },
  offlineSavedBtnText: {
    color: '#1DB954',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#999999',
  },
  playPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1DB954',
  },
});
