import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { WordLookupResult } from '../types';
import { IOS_COLORS, IOS_TYPOGRAPHY } from '../theme/iosTheme';
import { triggerLightHaptic, triggerSuccessHaptic } from '../utils/haptics';

interface TranslationSheetProps {
  visible: boolean;
  loading: boolean;
  lookupData: WordLookupResult | null;
  isWordSaved?: boolean;
  onSaveWord?: (data: WordLookupResult) => void;
  onClose: () => void;
}

export const TranslationSheet: React.FC<TranslationSheetProps> = ({
  visible,
  loading,
  lookupData,
  isWordSaved = false,
  onSaveWord,
  onClose,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['54%', '76%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1 && visible) {
        onClose();
      }
    },
    [visible, onClose]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!visible) {
    return null;
  }

  const sheetBody = (
    <>
      {/* iOS Look Up Header: Word + IPA + Part of Speech */}
      <View style={styles.header}>
        <View style={styles.wordHeaderLeft}>
          <Text style={styles.wordText}>{lookupData?.word || '...'}</Text>
          <View style={styles.metaBadgesRow}>
            {Boolean(lookupData?.phonetic) && (
              <View style={styles.ipaBadge}>
                <Text style={styles.ipaText}>{lookupData?.phonetic}</Text>
              </View>
            )}
            {Boolean(lookupData?.part_of_speech) && (
              <View style={styles.posBadge}>
                <Text style={styles.posText}>
                  {lookupData?.part_of_speech}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            triggerLightHaptic();
            onClose();
          }}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={28}
            color={IOS_COLORS.tertiaryLabel}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Body: Meaning & Context */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
          <Text style={styles.loadingText}>
            Đang tra từ điển & ngữ cảnh...
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>NGHĨA TIẾNG VIỆT</Text>
          <Text style={styles.translationText}>
            {lookupData?.translation_vi || 'Không tìm thấy bản dịch'}
          </Text>

          {Boolean(lookupData?.definition_vi || lookupData?.definition_en) && (
            <View style={styles.definitionBox}>
              {Boolean(lookupData?.definition_vi) && (
                <View style={styles.defRow}>
                  <Ionicons
                    name="bulb-outline"
                    size={16}
                    color={IOS_COLORS.systemYellow}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.definitionViText}>
                    {lookupData?.definition_vi}
                  </Text>
                </View>
              )}
              {Boolean(lookupData?.definition_en) && (
                <Text style={styles.definitionEnText}>
                  {lookupData?.definition_en}
                </Text>
              )}
            </View>
          )}

          {Boolean(lookupData?.context_en) && (
            <View style={styles.contextBox}>
              <View style={styles.contextHeaderRow}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={14}
                  color={IOS_COLORS.systemBlue}
                />
                <Text style={styles.contextLabel}>NGỮ CẢNH TRONG BÀI</Text>
              </View>
              <Text style={styles.contextEnText}>
                “{lookupData?.context_en}”
              </Text>
              {Boolean(lookupData?.context_vi) && (
                <Text style={styles.contextViText}>
                  {lookupData?.context_vi}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.actionRow}>
        {Boolean(onSaveWord) && (
          <TouchableOpacity
            style={[
              styles.saveWordBtn,
              isWordSaved && styles.saveWordBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              if (lookupData) {
                triggerSuccessHaptic();
                onSaveWord?.(lookupData);
              }
            }}
          >
            <Ionicons
              name={isWordSaved ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={
                isWordSaved ? IOS_COLORS.systemYellow : IOS_COLORS.label
              }
            />
            <Text
              style={[
                styles.saveWordBtnText,
                isWordSaved && styles.saveWordBtnTextActive,
              ]}
            >
              {isWordSaved ? 'Đã lưu sổ tay' : 'Lưu vào sổ tay'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.85}
          onPress={() => {
            triggerLightHaptic();
            onClose();
          }}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Tiếp tục nghe</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <Pressable style={styles.webBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetBackground, styles.webSheetCard]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.webHandleWrap}>
            <View style={styles.handleIndicator} />
          </View>
          {sheetBody}
        </Pressable>
      </Pressable>
    );
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.sheetContainer}>
        {sheetBody}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  handleIndicator: {
    backgroundColor: IOS_COLORS.tertiaryLabel,
    width: 38,
    height: 5,
  },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordHeaderLeft: {
    flex: 1,
  },
  wordText: {
    ...IOS_TYPOGRAPHY.title1,
    color: IOS_COLORS.label,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ipaBadge: {
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ipaText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  posBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  posText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginVertical: 12,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    marginVertical: 2,
  },
  label: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  translationText: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.systemBlue,
  },
  definitionBox: {
    marginTop: 10,
  },
  defRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  definitionViText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    flex: 1,
  },
  definitionEnText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
    marginTop: 4,
  },
  contextBox: {
    marginTop: 12,
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
    padding: 12,
    borderRadius: 12,
  },
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  contextLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
  contextEnText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    fontWeight: '500',
  },
  contextViText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  saveWordBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
    paddingVertical: 13,
    borderRadius: 14,
  },
  saveWordBtnActive: {
    backgroundColor: 'rgba(255, 214, 10, 0.16)',
  },
  saveWordBtnText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  saveWordBtnTextActive: {
    color: IOS_COLORS.systemYellow,
  },
  actionBtn: {
    flex: 1.15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  webSheetCard: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  webHandleWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
});
