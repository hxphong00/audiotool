import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createDialogue,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/apiService';
import { saveDialogueOffline } from '../services/storageService';
import { DialogueData } from '../types';

interface ImportScreenProps {
  onDialogueCreated: (dialogue: DialogueData) => void;
  onClose: () => void;
}

const PRESET_TEMPLATES = [
  {
    label: '🚗 Đi làm buổi sáng',
    title: 'Morning Commute & Rush Hour',
    script:
      "Alex: Hey Sarah, are you caught in the morning rush hour too?\nSarah: Yes, absolutely! The highway traffic is moving at a snail's pace.\nAlex: Are you taking the subway tomorrow instead?\nSarah: Definitely! It only takes twenty minutes downtown.",
  },
  {
    label: '☕ Quán Cà phê',
    title: 'Ordering Coffee Before Work',
    script:
      "Sarah: Good morning! Could I get a medium iced latte with oat milk, please?\nAlex: Sure thing! Would you like any breakfast pastry to go with that?\nSarah: An almond croissant sounds wonderful, thank you!\nAlex: Coming right up! Your total is eight dollars and fifty cents.",
  },
  {
    label: '✈️ Sân bay Quốc tế',
    title: 'Airport Check-in & Boarding Gate',
    script:
      "David: Excuse me, is boarding for flight BA204 to London still on schedule?\nEmily: We have a slight fifteen-minute delay due to incoming aircraft traffic.\nDavid: No problem at all. Could you confirm which gate we are departing from?\nEmily: Gate B12, right past the duty-free lounge on your left.",
  },
];

export const ImportScreen: React.FC<ImportScreenProps> = ({
  onDialogueCreated,
  onClose,
}) => {
  const [ipInput, setIpInput] = useState(getApiBaseUrl());
  const [titleInput, setTitleInput] = useState('Daily Commute Conversation');
  const [scriptInput, setScriptInput] = useState(PRESET_TEMPLATES[0].script);
  const [loading, setLoading] = useState(false);
  const [checkingPing, setCheckingPing] = useState(false);

  async function handleSaveIpOnly() {
    const saved = await setApiBaseUrl(ipInput);
    setIpInput(saved);
    setCheckingPing(true);
    try {
      const res = await fetch(`${saved}/api/health`);
      if (res.ok) {
        Alert.alert(
          'Kết nối thành công ✓',
          `Đã lưu và kết nối tốt tới máy chủ Backend tại:\n${saved}`
        );
      } else {
        Alert.alert('Đã lưu IP', `Đã lưu ${saved}, nhưng máy chủ trả về mã ${res.status}.`);
      }
    } catch {
      Alert.alert(
        'Đã lưu IP',
        `Đã lưu địa chỉ ${saved}. Hãy đảm bảo Backend đang chạy trên Mac cùng mạng Wi-Fi.`
      );
    } finally {
      setCheckingPing(false);
    }
  }

  async function handleCreateNewDialogue() {
    if (!scriptInput.trim()) {
      Alert.alert('Thiếu kịch bản', 'Vui lòng nhập kịch bản hội thoại tiếng Anh.');
      return;
    }

    setLoading(true);
    try {
      const updatedBase = await setApiBaseUrl(ipInput);
      setIpInput(updatedBase);

      const created = await createDialogue(
        scriptInput,
        titleInput.trim() || 'English Conversation'
      );

      // Automatically cache newly created lesson offline onto iPhone storage
      let finalData = created;
      try {
        finalData = await saveDialogueOffline(created);
      } catch {
        // Ignore offline cache failure if running on web
      }

      onDialogueCreated(finalData);
    } catch (e: any) {
      Alert.alert(
        'Không thể tạo bài nghe',
        e?.message || 'Vui lòng kiểm tra kết nối Wi-Fi và địa chỉ IP máy Mac.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Tạo Bài Nghe & Cài Đặt</Text>
          <Text style={styles.subtitle}>
            Tự động phân vai giọng đọc AI, dịch song ngữ & tải Offline
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Đóng ✕</Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: Server LAN IP Configuration */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>1. KẾT NỐI MÁY CHỦ MAC (WI-FI LAN)</Text>
        <View style={styles.ipRow}>
          <TextInput
            style={[styles.input, styles.ipInput]}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="http://192.168.1.220:8000"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.saveIpBtn}
            onPress={handleSaveIpOnly}
            disabled={checkingPing}
          >
            {checkingPing ? (
              <ActivityIndicator size="small" color="#1DB954" />
            ) : (
              <Text style={styles.saveIpBtnText}>Lưu & Kiểm tra</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 2: Quick Templates */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>2. CHỌN NHANH KỊCH BẢN MẪU</Text>
        <View style={styles.presetsRow}>
          {PRESET_TEMPLATES.map((tpl) => (
            <TouchableOpacity
              key={tpl.label}
              style={styles.presetChip}
              onPress={() => {
                setTitleInput(tpl.title);
                setScriptInput(tpl.script);
              }}
            >
              <Text style={styles.presetChipText}>{tpl.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Tiêu đề bài hội thoại:</Text>
        <TextInput
          style={styles.input}
          value={titleInput}
          onChangeText={setTitleInput}
          placeholder="Ví dụ: Daily Commute & Traffic"
          placeholderTextColor="#666"
        />

        <Text style={styles.fieldLabel}>
          Kịch bản hội thoại (Định dạng: Tên nhân vật: Câu thoại):
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={scriptInput}
          onChangeText={setScriptInput}
          multiline
          placeholder={'Alex: Hello Sarah!\nSarah: Hi Alex, how are you?'}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.disabledBtn]}
          onPress={handleCreateNewDialogue}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#000" />
              <Text style={styles.createBtnText}>
                Đang tạo giọng đọc AI & Dịch tiếng Việt...
              </Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>
              🎙 Tạo Bài Nghe & Tải Offline Ngay
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 40,
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
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  closeBtnText: {
    color: '#1DB954',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1DB954',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ipInput: {
    flex: 1,
  },
  saveIpBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#1DB954',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 115,
    alignItems: 'center',
  },
  saveIpBtnText: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#363636',
  },
  presetChipText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  createBtn: {
    backgroundColor: '#1DB954',
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
