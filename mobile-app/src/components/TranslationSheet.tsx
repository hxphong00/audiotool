import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
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
import { WordLookupResult } from '../types';

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
  const snapPoints = useMemo(() => ['52%', '72%'], []);

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
        opacity={0.65}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!visible) {
    return null;
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
        {/* Header: Word + IPA + Part of Speech */}
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
                  <Text style={styles.posText}>{lookupData?.part_of_speech}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Body: Meaning & Context */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#1DB954" />
            <Text style={styles.loadingText}>Đang tra từ điển & ngữ cảnh...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.label}>NGHĨA TIẾNG VIỆT:</Text>
            <Text style={styles.translationText}>
              {lookupData?.translation_vi || 'Không tìm thấy bản dịch'}
            </Text>

            {Boolean(lookupData?.definition_vi || lookupData?.definition_en) && (
              <View style={styles.definitionBox}>
                {Boolean(lookupData?.definition_vi) && (
                  <Text style={styles.definitionViText}>
                    💡 {lookupData?.definition_vi}
                  </Text>
                )}
                {Boolean(lookupData?.definition_en) && (
                  <Text style={styles.definitionEnText}>
                    ({lookupData?.definition_en})
                  </Text>
                )}
              </View>
            )}

            {Boolean(lookupData?.context_en) && (
              <View style={styles.contextBox}>
                <Text style={styles.contextLabel}>NGỮ CẢNH TRONG BÀI:</Text>
                <Text style={styles.contextEnText}>“{lookupData?.context_en}”</Text>
                {Boolean(lookupData?.context_vi) && (
                  <Text style={styles.contextViText}>
                    ➔ {lookupData?.context_vi}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.actionRow}>
          {Boolean(onSaveWord) && (
            <TouchableOpacity
              style={[styles.saveWordBtn, isWordSaved && styles.saveWordBtnActive]}
              onPress={() => lookupData && onSaveWord?.(lookupData)}
            >
              <Text
                style={[
                  styles.saveWordBtnText,
                  isWordSaved && styles.saveWordBtnTextActive,
                ]}
              >
                {isWordSaved ? '⭐ Đã lưu' : '☆ Lưu từ này'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionBtnText}>Tiếp tục nghe ▶</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  handleIndicator: {
    backgroundColor: '#666666',
    width: 44,
    height: 5,
  },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 24,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#1DB954',
    letterSpacing: 0.4,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ipaBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ipaText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
  },
  posBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  posText: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#888888',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 12,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  content: {
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  translationText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  definitionBox: {
    marginTop: 8,
  },
  definitionViText: {
    fontSize: 15,
    color: '#D8D8D8',
    lineHeight: 22,
  },
  definitionEnText: {
    fontSize: 13,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  contextBox: {
    marginTop: 12,
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  contextLabel: {
    fontSize: 11,
    color: '#1DB954',
    fontWeight: '700',
    marginBottom: 4,
  },
  contextEnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  contextViText: {
    fontSize: 13,
    color: '#B0B0B0',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  saveWordBtn: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444444',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveWordBtnActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
  },
  saveWordBtnText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '700',
  },
  saveWordBtnTextActive: {
    color: '#FFD700',
  },
  actionBtn: {
    flex: 1.2,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
