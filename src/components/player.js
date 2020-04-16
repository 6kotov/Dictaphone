import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Slider,
} from "react-native";
import Context from "../Context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const DISABLED_OPACITY = 0.5;
const ICON_SIZE = 40;

export default function Player() {
  const {
    // MaterialCommunityIcons,
    isPlaybackAllowed,
    // getSeekSliderPosition,
    onSeekSliderValueChange,
    onSeekSliderSlidingComplete,
    onBackward,
    startPlay,
    pausePlay,
    stopPlay,
    onForward,
    getDuration,
    soundDuration,
    soundPosition,
    OnMutePressed,
    onVolumeChange,
    playlist,
    playlistIndex,
    isMuted,
    isPlaying,
    loading,
  } = useContext(Context);

  function getSeekSliderPosition() {
    if (soundPosition !== null && soundDuration !== null) {
      return soundPosition / soundDuration;
    }
    return 0;
  }

  return (
    <View
      style={[
        styles.playBackContainer,
        { opacity: !isPlaybackAllowed ? DISABLED_OPACITY : 1.0 },
      ]}
    >
      <Slider
        style={styles.playbackSlider}
        value={getSeekSliderPosition()}
        onValueChange={() => onSeekSliderValueChange()}
        onSlidingComplete={() => onSeekSliderSlidingComplete()}
        disabled={!isPlaybackAllowed || loading}
      />
      <View style={styles.player}>
        <TouchableOpacity
          activeOpacity={DISABLED_OPACITY}
          style={styles.PlayStopPause}
        >
          <MaterialCommunityIcons
            name="skip-backward"
            onPress={() => onBackward()}
            size={ICON_SIZE}
            color="black"
            style={{
              opacity:
                !isPlaybackAllowed || loading || !playlist[playlistIndex - 1]
                  ? DISABLED_OPACITY
                  : 1,
            }}
            disabled={
              !isPlaybackAllowed || loading || !playlist[playlistIndex - 1]
            }
          />

          {!isPlaying ? (
            <MaterialCommunityIcons
              name="play"
              onPress={() => startPlay()}
              size={ICON_SIZE}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          ) : (
            <MaterialCommunityIcons
              name="pause"
              onPress={() => pausePlay()}
              size={ICON_SIZE}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          )}
          <MaterialCommunityIcons
            name="stop"
            onPress={() => stopPlay()}
            size={ICON_SIZE}
            color="black"
            disabled={!isPlaybackAllowed || loading}
          />

          <MaterialCommunityIcons
            name="skip-forward"
            onPress={() => onForward()}
            size={ICON_SIZE}
            color="black"
            style={{
              opacity:
                !isPlaybackAllowed || loading || !playlist[playlistIndex + 1]
                  ? DISABLED_OPACITY
                  : 1,
            }}
            disabled={
              !isPlaybackAllowed || loading || !playlist[playlistIndex + 1]
            }
          />
        </TouchableOpacity>
        <Text style={styles.playTime}>
          {getDuration(soundPosition)}/{getDuration(soundDuration)}
        </Text>
      </View>
      <View style={styles.volumeContainer}>
        <TouchableOpacity onPress={() => OnMutePressed()}>
          {isMuted ? (
            <MaterialCommunityIcons
              name="volume-off"
              size={ICON_SIZE}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          ) : (
            <MaterialCommunityIcons
              name="volume-high"
              size={ICON_SIZE}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          )}
        </TouchableOpacity>
        <Slider
          style={styles.volumeSlider}
          value={1.0}
          onValueChange={() => onVolumeChange()}
          disabled={!isPlaybackAllowed || loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playbackSlider: {
    marginBottom: 20,
  },
  PlayStopPause: {
    flexDirection: "row",
  },
  player: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playBackContainer: {
    width: DEVICE_WIDTH / 1.2,
  },
  playTime: {
    fontSize: 15,
    alignSelf: "flex-start",
  },
  volumeContainer: {
    flexDirection: "row",
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.2,
  },
});
