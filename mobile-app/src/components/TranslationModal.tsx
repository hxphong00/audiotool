import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TranslationModalProps {
  visible: boolean;
  word: string;
  translation: string;
  onClose: () => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  visible,
  word,
  translation,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.wordText}>{word}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.content}>
            <Text style={styles.label}>Nghĩa tiếng Việt:</Text>
            <Text style={styles.translationText}>{translation || 'Đang tra cứu...'}</Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionBtnText}>Tiếp tục nghe ▶</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#333333',
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: '#555555',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1DB954', // Spotify Green
    letterSpacing: 0.5,
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
    marginVertical: 14,
  },
  content: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  translationText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  actionBtn: {
    marginTop: 22,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
