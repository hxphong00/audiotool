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
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#282828',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  progressContainer: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  trackBackground: {
    height: 6,
    backgroundColor: '#3E3E3E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  timeHintText: {
    color: '#555555',
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rateBtn: {
    backgroundColor: '#242424',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 52,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loopBtn: {
    backgroundColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 68,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  loopBtnActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.18)',
    borderColor: '#1DB954',
  },
  loopBtnText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '700',
  },
  loopBtnTextActive: {
    color: '#1DB954',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  iconText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconSubText: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
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
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playPauseText: {
    fontSize: 25,
    color: '#000000',
  },
});
