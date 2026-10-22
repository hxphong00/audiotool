import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  formatPlaybackSpeedLabel,
  IOS_COLORS,
  IOS_TYPOGRAPHY,
} from '../theme/iosTheme';
import { triggerLightHaptic, triggerSelectionHaptic } from '../utils/haptics';

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
    triggerSelectionHaptic();
    const ratio = Math.min(1, Math.max(0, locationX / barWidth));
    onSeekToPosition(ratio * duration);
  }

  return (
    <BlurView
      intensity={75}
      tint="systemThickMaterialDark"
      style={styles.container}
    >
      {/* Interactive Scrubber Bar (Apple Music / Podcasts style) */}
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
          <Text style={styles.timeHintText}>
            Chạm từ để phát • Giữ từ để dịch
          </Text>
          <Text style={styles.timeText}>
            -{formatTimeMMSS(Math.max(0, duration - position))}
          </Text>
        </View>
      </Pressable>

      {/* Main Transport Row */}
      <View style={styles.controlsRow}>
        {/* Speed toggle */}
        <TouchableOpacity
          style={styles.pillBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerSelectionHaptic();
            onToggleRate();
          }}
        >
          <Text style={styles.rateBtnText}>
            {formatPlaybackSpeedLabel(rate)}
          </Text>
        </TouchableOpacity>

        {/* Smart Rewind: 1 tap = start of current sentence, 2 taps = previous sentence */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerLightHaptic();
            onSeekToStartOfSegment();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-skip-back"
            size={22}
            color={IOS_COLORS.label}
          />
        </TouchableOpacity>

        {/* Main Play / Pause */}
        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={() => {
            triggerLightHaptic();
            onPlayPause();
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#FFFFFF"
            style={!isPlaying ? { marginLeft: 3 } : undefined}
          />
        </TouchableOpacity>

        {/* Next sentence */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerLightHaptic();
            onSeekForward();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-skip-forward"
            size={22}
            color={IOS_COLORS.label}
          />
        </TouchableOpacity>

        {/* Auto-Loop / Replay Toggle */}
        <TouchableOpacity
          style={[styles.pillBtn, isLooping && styles.loopBtnActive]}
          onPress={() => {
            triggerSelectionHaptic();
            onToggleLoop();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="repeat"
            size={15}
            color={
              isLooping ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel
            }
          />
          <Text
            style={[
              styles.loopBtnText,
              isLooping && styles.loopBtnTextActive,
            ]}
          >
            {isLooping ? 'Lặp' : '1×'}
          </Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: IOS_COLORS.elevatedCardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  progressContainer: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  trackBackground: {
    height: 5,
    backgroundColor: IOS_COLORS.systemFill,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.label,
    borderRadius: 2.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeHintText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 58,
  },
  rateBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.label,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  loopBtnActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  loopBtnText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  loopBtnTextActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '700',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: IOS_COLORS.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
});
