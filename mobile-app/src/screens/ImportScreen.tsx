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
import { Ionicons } from '@expo/vector-icons';
import {
  createDialogue,
  getApiBaseUrl,
  getShadowingPauseSec,
  setApiBaseUrl,
  setShadowingPauseSec,
} from '../services/apiService';
import { saveDialogueOffline } from '../services/storageService';
import { DialogueData } from '../types';
import { IOS_COLORS, IOS_TYPOGRAPHY } from '../theme/iosTheme';
import {
  triggerLightHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';

interface ImportScreenProps {
  shadowingPauseSec: number;
  onShadowingPauseChange: (sec: number) => void;
  onDialogueCreated: (dialogue: DialogueData) => void;
  onClose: () => void;
}

const PRESET_TEMPLATES = [
  {
    label: 'Đi làm sáng',
    icon: 'car-sport-outline' as const,
    title: 'Morning Commute & Rush Hour',
    script:
      "Alex: Hey Sarah, are you caught in the morning rush hour too?\nSarah: Yes, absolutely! The highway traffic is moving at a snail's pace.\nAlex: Are you taking the subway tomorrow instead?\nSarah: Definitely! It only takes twenty minutes downtown.",
  },
  {
    label: 'Quán Cà phê',
    icon: 'cafe-outline' as const,
    title: 'Ordering Coffee Before Work',
    script:
      "Sarah: Good morning! Could I get a medium iced latte with oat milk, please?\nAlex: Sure thing! Would you like any breakfast pastry to go with that?\nSarah: An almond croissant sounds wonderful, thank you!\nAlex: Coming right up! Your total is eight dollars and fifty cents.",
  },
  {
    label: 'Sân bay',
    icon: 'airplane-outline' as const,
    title: 'Airport Check-in & Boarding Gate',
    script:
      "David: Excuse me, is boarding for flight BA204 to London still on schedule?\nEmily: We have a slight fifteen-minute delay due to incoming aircraft traffic.\nDavid: No problem at all. Could you confirm which gate we are departing from?\nEmily: Gate B12, right past the duty-free lounge on your left.",
  },
];

const SHADOWING_OPTIONS = [
  { label: 'Tắt (0.4s)', value: 0 },
  { label: 'Nghỉ 2.0s', value: 2.0 },
  { label: 'Nghỉ 3.0s', value: 3.0 },
];

export const ImportScreen: React.FC<ImportScreenProps> = ({
  shadowingPauseSec,
  onShadowingPauseChange,
  onDialogueCreated,
}) => {
  const [ipInput, setIpInput] = useState(getApiBaseUrl());
  const [selectedPauseSec, setSelectedPauseSec] = useState<number>(
    shadowingPauseSec ?? getShadowingPauseSec()
  );
  const [titleInput, setTitleInput] = useState('Daily Commute Conversation');
  const [scriptInput, setScriptInput] = useState(PRESET_TEMPLATES[0].script);
  const [loading, setLoading] = useState(false);
  const [checkingPing, setCheckingPing] = useState(false);

  async function handleSaveIpOnly() {
    triggerLightHaptic();
    const saved = await setApiBaseUrl(ipInput);
    setIpInput(saved);
    setCheckingPing(true);
    try {
      const res = await fetch(`${saved}/api/health`);
      if (res.ok) {
        triggerSuccessHaptic();
        Alert.alert(
          'Kết nối thành công',
          `Đã lưu và kết nối tốt tới máy chủ Backend tại:\n${saved}`
        );
      } else {
        Alert.alert(
          'Đã lưu IP',
          `Đã lưu ${saved}, nhưng máy chủ trả về mã ${res.status}.`
        );
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
      Alert.alert(
        'Thiếu kịch bản',
        'Vui lòng nhập kịch bản hội thoại tiếng Anh.'
      );
      return;
    }

    triggerLightHaptic();
    setLoading(true);
    try {
      const updatedBase = await setApiBaseUrl(ipInput);
      setIpInput(updatedBase);

      const created = await createDialogue(
        scriptInput,
        titleInput.trim() || 'English Conversation',
        selectedPauseSec > 0 ? selectedPauseSec : 0.4
      );

      let finalData = created;
      try {
        finalData = await saveDialogueOffline(created);
      } catch {
        // Ignore offline cache failure if running on web
      }

      triggerSuccessHaptic();
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
        <Text style={styles.title}>Tạo bài & Cài đặt</Text>
        <Text style={styles.subtitle}>
          Tổng hợp giọng đọc AI đa nhân vật & lưu Offline vào iPhone
        </Text>
      </View>

      {/* iOS Inset Grouped Section 1: Script Composer */}
      <Text style={styles.sectionHeader}>SOẠN KỊCH BẢN HỘI THOẠI</Text>
      <View style={styles.insetGroupCard}>
        <Text style={styles.fieldLabel}>Mẫu kịch bản nhanh</Text>
        <View style={styles.presetsRow}>
          {PRESET_TEMPLATES.map((tpl) => {
            const isMatching = titleInput === tpl.title;
            return (
              <TouchableOpacity
                key={tpl.label}
                style={[
                  styles.presetChip,
                  isMatching && styles.presetChipActive,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setTitleInput(tpl.title);
                  setScriptInput(tpl.script);
                }}
              >
                <Ionicons
                  name={tpl.icon}
                  size={14}
                  color={
                    isMatching
                      ? IOS_COLORS.systemBlue
                      : IOS_COLORS.secondaryLabel
                  }
                />
                <Text
                  style={[
                    styles.presetChipText,
                    isMatching && styles.presetChipTextActive,
                  ]}
                >
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.hairlineDivider} />

        <Text style={styles.fieldLabel}>Tiêu đề bài học</Text>
        <TextInput
          style={styles.input}
          value={titleInput}
          onChangeText={setTitleInput}
          placeholder="Ví dụ: Daily Commute & Traffic"
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
        />

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
          Nội dung hội thoại (Tên nhân vật: Câu thoại)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={scriptInput}
          onChangeText={setScriptInput}
          multiline
          placeholder={'Alex: Hello Sarah!\nSarah: Hi Alex, how are you?'}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
        />

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.disabledBtn]}
          onPress={handleCreateNewDialogue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.createBtnText}>
                Đang tạo giọng AI & dịch song ngữ...
              </Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.createBtnText}>
                Tạo bài nghe & Tải về iPhone
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* iOS Inset Grouped Section 2: Shadowing Mode */}
      <Text style={styles.sectionHeader}>CHẾ ĐỘ TỰ NHẨM (SHADOWING)</Text>
      <View style={styles.insetGroupCard}>
        <View style={styles.settingTitleRow}>
          <Ionicons
            name="mic-outline"
            size={18}
            color={IOS_COLORS.systemGreen}
          />
          <Text style={styles.settingTitle}>
            Khoảng nghỉ lặp lại sau mỗi câu
          </Text>
        </View>
        <Text style={styles.settingDesc}>
          Tự động chèn khoảng lặng sau mỗi câu thoại để bạn nhẩm nhắc lại thành tiếng khi đang đi đường.
        </Text>
        <View style={styles.segmentedControl}>
          {SHADOWING_OPTIONS.map((opt) => {
            const isSelected = selectedPauseSec === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.segmentItem,
                  isSelected && styles.segmentItemActive,
                ]}
                onPress={async () => {
                  triggerSelectionHaptic();
                  setSelectedPauseSec(opt.value);
                  await setShadowingPauseSec(opt.value);
                  onShadowingPauseChange(opt.value);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* iOS Inset Grouped Section 3: Server LAN IP Configuration */}
      <Text style={styles.sectionHeader}>KẾT NỐI MÁY CHỦ (WI-FI LAN)</Text>
      <View style={styles.insetGroupCard}>
        <View style={styles.ipRow}>
          <TextInput
            style={[styles.input, styles.ipInput]}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="http://192.168.1.220:8000"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.saveIpBtn}
            onPress={handleSaveIpOnly}
            disabled={checkingPing}
          >
            {checkingPing ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
            ) : (
              <>
                <Ionicons
                  name="wifi"
                  size={15}
                  color={IOS_COLORS.systemBlue}
                />
                <Text style={styles.saveIpBtnText}>Kiểm tra</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  headerRow: {
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
  sectionHeader: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 20,
  },
  insetGroupCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginVertical: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  presetChipActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
  },
  presetChipText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  settingTitle: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  settingDesc: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 10,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  segmentText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldLabel: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: IOS_COLORS.label,
    ...IOS_TYPOGRAPHY.subheadline,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  createBtn: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    ...IOS_TYPOGRAPHY.headline,
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    minWidth: 104,
  },
  saveIpBtnText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
});
