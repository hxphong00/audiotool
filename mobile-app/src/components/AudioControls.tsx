import React from 'react';
import {
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
  onPlayPause: () => void;
  onSeekToStartOfSegment: () => void;
  onSeekForward: () => void;
  onToggleRate: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  position,
  duration,
  rate,
  onPlayPause,
  onSeekToStartOfSegment,
  onSeekForward,
  onToggleRate,
}) => {
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.trackBackground}>
          <View style={[styles.trackFill, { width: `${Math.min(100, Math.max(0, progressPercent))}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Buttons Row */}
      <View style={styles.controlsRow}>
        {/* Speed toggle */}
        <TouchableOpacity style={styles.rateBtn} onPress={onToggleRate}>
          <Text style={styles.rateBtnText}>{rate}x</Text>
        </TouchableOpacity>

        {/* Rewind to start of current sentence */}
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

        {/* Forward 5s */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onSeekForward}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>+5s</Text>
          <Text style={styles.iconSubText}>Tua tới</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  progressContainer: {
    marginBottom: 10,
  },
  trackBackground: {
    height: 4,
    backgroundColor: '#3E3E3E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  rateBtn: {
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconSubText: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 26,
    color: '#000000',
  },
});
