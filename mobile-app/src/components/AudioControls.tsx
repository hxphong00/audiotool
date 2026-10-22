import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AudioControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  rate: number;
  isLooping: boolean;
  onPlayPause: () => void;
  onSeekToStartOfSegment: () => void;
  onSeekForward: () => void;
  onToggleRate: () => void;
  onToggleLoop: () => void;
  onSeekToPosition?: (seconds: number) => void;
}

export function formatTimeMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  position,
  duration,
  rate,
  isLooping,
  onPlayPause,
  onSeekToStartOfSegment,
  onSeekForward,
  onToggleRate,
  onToggleLoop,
  onSeekToPosition,
}) => {
  const [barWidth, setBarWidth] = useState(0);
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  function handleBarLayout(e: LayoutChangeEvent) {
    setBarWidth(e.nativeEvent.layout.width);
  }

  function handleBarPress(locationX: number) {
    if (!onSeekToPosition || barWidth <= 0 || duration <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / barWidth));
    onSeekToPosition(ratio * duration);
  }

  return (
    <View style={styles.container}>
      {/* Interactive Progress Bar */}
      <Pressable
        style={styles.progressContainer}
        onLayout={handleBarLayout}
        onPress={(e) => handleBarPress(e.nativeEvent.locationX)}
      >
        <View style={styles.trackBackground}>
          <View
            style={[
              styles.trackFill,
              { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTimeMMSS(position)}</Text>
          <Text style={styles.timeHintText}>Chạm câu hoặc thanh để tua</Text>
          <Text style={styles.timeText}>{formatTimeMMSS(duration)}</Text>
        </View>
      </Pressable>

      {/* Main Transport Row */}
      <View style={styles.controlsRow}>
        {/* Speed toggle */}
        <TouchableOpacity style={styles.rateBtn} onPress={onToggleRate}>
          <Text style={styles.rateBtnText}>{rate}x</Text>
        </TouchableOpacity>

        {/* Smart Rewind: 1 tap = start of current sentence, 2 taps = previous sentence */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onSeekToStartOfSegment}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>⏮</Text>
          <Text style={styles.iconSubText}>Đầu câu</Text>
        </TouchableOpacity>

        {/* Main Play / Pause */}
        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={onPlayPause}
          activeOpacity={0.8}
        >
          <Text style={styles.playPauseText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Next sentence */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onSeekForward}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>⏭</Text>
          <Text style={styles.iconSubText}>Câu tiếp</Text>
        </TouchableOpacity>

        {/* Auto-Loop / Replay Toggle */}
        <TouchableOpacity
          style={[styles.loopBtn, isLooping && styles.loopBtnActive]}
          onPress={onToggleLoop}
          activeOpacity={0.7}
        >
          <Text style={[styles.loopBtnText, isLooping && styles.loopBtnTextActive]}>
            🔁 {isLooping ? 'Lặp' : '1 lần'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 27, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  progressContainer: {
    marginBottom: 10,
    paddingVertical: 4,
  },
  trackBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeHintText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 10,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rateBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 48,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  loopBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 64,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  loopBtnActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    borderColor: 'rgba(29, 185, 84, 0.5)',
  },
  loopBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  loopBtnTextActive: {
    color: '#1DB954',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconSubText: {
    display: 'none',
  },
  playPauseBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 6,
  },
  playPauseText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '900',
  },
});
