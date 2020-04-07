import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  Slider,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import { Asset } from "expo-asset";
// import Slider from "@react-native-community/slider";
import * as Premissions from "expo-permissions";
import { MaterialCommunityIcons } from "@expo/vector-icons";

class Icon {
  constructor(module, width, height) {
    (this.module = module), (this.whidth = width), (this.height = height);
    Asset.fromModule(this.module).downloadAsync();
  }
}
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#FFF8ED";
const LIVE_COLOR = "#FF0000";
const DISABLED_OPACITY = 0.5;

export default function App() {
  const [recordPremission, setRecordPremission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [soundDuration, setSoundDuration] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(null);
  const [soundPosition, setSoundPosition] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPosition, setSeekPosition] = useState(null);
  const [isSeeking, setIsSeeking] = useState(0);
  const [recorder, setRecorder] = useState(null);
  const [soundPlayer, setSoundPlayer] = useState(null);
  const [recColor, setRecColor] = useState("black");
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);

  useEffect(() => {
    askForPremissions();
  }, [askForPremissions]);

  async function askForPremissions() {
    const { status } = await Premissions.askAsync(Premissions.AUDIO_RECORDING);
    setRecordPremission(status === "granted");
  }

  function updateScreenForRecordStatus(status) {
    if (status.canRecord) {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.durationMillis);
    } else if (status.isDoneRecording) {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.durationMillis);
    }
  }

  function updateScreenForSoundStatus(status) {
    if (status.isLoaded) {
      setSoundDuration(status.durationMillis);
      setSoundPosition(status.positionMillis);
      // shouldPlay: status.shouldPlay,
      setIsPlaying(status.isPlaying);
      // rate: status.rate,
      setIsMuted(status.isMuted);
      setVolume(status.volume);
      setIsPlaybackAllowed(true);
    } else {
      setSoundDuration(null);
      setSoundPosition(null);
      setIsPlaybackAllowed(false);
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  }

  async function stopPlaybackAndBeginRecording() {
    try {
      if (!recordPremission) {
        askForPremissions();
      }

      if (soundPlayer !== null) {
        await soundPlayer.unloadAsync();
        soundPlayer.setOnPlaybackStatusUpdate(null);
        setSoundPlayer(null);
        setIsPlaying(false);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      if (recorder !== null) {
        recorder.setOnRecordingStatusUpdate(null);
        setRecorder(null);
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY
      );
      recording.setOnRecordingStatusUpdate(updateScreenForRecordStatus);

      await recording.startAsync();
      setRecorder(recording);
      setRecColor("red");
    } catch (error) {
      console.log("Can`t start recording! ", error);
    }
  }

  async function stopRecordingAndEnablePlayback() {
    try {
      await recorder.stopAndUnloadAsync();
      setRecColor("black");
      const { sound, status } = await recorder.createNewLoadedSoundAsync(
        {
          isLooping: true,
          isMuted: isMuted,
          volume: volume,
        },
        updateScreenForSoundStatus
      );
      setIsPlaybackAllowed(true);
      setSoundPlayer(sound);
      console.log("Recording stopped");
    } catch (error) {
      console.log("Error? cant stop recording", error);
    }
  }

  function onRecordPressed() {
    if (isRecording) {
      stopRecordingAndEnablePlayback();
    } else {
      stopPlaybackAndBeginRecording();
    }
  }

  async function startPlay() {
    await soundPlayer.playAsync();
  }

  async function pausePlay() {
    await soundPlayer.pauseAsync();
  }

  async function stopPlay() {
    await soundPlayer.stopAsync();
  }

  function onVolumeChange(value) {
    soundPlayer.setVolumeAsync(value);
  }

  function OnMutePressed() {
    if (soundPlayer != null) {
      soundPlayer.setIsMutedAsync(!isMuted);
    }
  }

  function getDuration(source) {
    if (source !== 0) {
      return getMMSSFromMillis(source);
    }
    return getMMSSFromMillis(0);
  }
  function getSeekSliderPosition() {
    if (
      soundPlayer !== null &&
      soundPosition !== null &&
      soundDuration !== null
    ) {
      return soundPosition / soundDuration;
    }
    return 0;
  }

  function getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = (number) => {
      const string = number.toString();
      if (number < 10) {
        return "0" + string;
      }
      return string;
    };
    return padWithZero(minutes) + ":" + padWithZero(seconds);
  }

  return (
    <>
      <Text style={styles.title}> -Dictaphone- </Text>
      <View style={styles.container}>
        <View style={styles.recordContainer}>
          <TouchableOpacity
            onPress={onRecordPressed}
            activeOpacity={DISABLED_OPACITY}
          >
            <MaterialCommunityIcons
              name="record-rec"
              size={60}
              color={recColor}
            />
          </TouchableOpacity>
          <View style={styles.RecordTimeStamp}>
            <Text style={styles.liveRecord}>{isRecording ? "LIVE " : " "}</Text>
            <Text style={styles.recordTime}>
              {getDuration(recordingDuration)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.playBackContainer,
            { opacity: !isPlaybackAllowed ? DISABLED_OPACITY : 1.0 },
          ]}
        >
          <Slider
            style={styles.playbackSlider}
            value={getSeekSliderPosition()}
            // onValueChange={this._onSeekSliderValueChange}
            // onSlidingComplete={this._onSeekSliderSlidingComplete}
            disabled={!isPlaybackAllowed || loading}
          />
          <View style={styles.player}>
            <TouchableOpacity
              activeOpacity={DISABLED_OPACITY}
              style={styles.PlayStopPause}
            >
              {!isPlaying ? (
                <MaterialCommunityIcons
                  name="play"
                  onPress={startPlay}
                  size={60}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              ) : (
                <MaterialCommunityIcons
                  name="pause"
                  onPress={pausePlay}
                  size={60}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              )}
              <MaterialCommunityIcons
                name="stop"
                onPress={stopPlay}
                size={60}
                color="black"
                disabled={!isPlaybackAllowed || loading}
              />
            </TouchableOpacity>
            <Text style={styles.playTime}>
              {getDuration(soundPosition)}/{getDuration(soundDuration)}
            </Text>
          </View>
          <View style={styles.volumeContainer}>
            <TouchableOpacity onPress={OnMutePressed}>
              {isMuted ? (
                <MaterialCommunityIcons
                  name="volume-off"
                  size={50}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              ) : (
                <MaterialCommunityIcons
                  name="volume-high"
                  size={50}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              )}
            </TouchableOpacity>
            <Slider
              style={styles.volumeSlider}
              // trackImage={ICON_TRACK_1.module}
              // thumbImage={ICON_THUMB_1.module}
              value={volume}
              onValueChange={onVolumeChange}
              // onSlidingComplete={this._onSeekSliderSlidingComplete}
            />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  playbackSlider: {
    marginBottom: 20,
  },
  recordContainer: {
    width: DEVICE_WIDTH / 1.3,
    flexDirection: "row",
    justifyContent: "space-between",
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
  title: {
    alignSelf: "center",
    paddingHorizontal: 5,
    marginTop: 30,
    fontSize: 30,
    fontWeight: "bold",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 7,
  },
  liveRecord: {
    color: "red",
    fontSize: 20,
  },
  recordTime: {
    fontSize: 20,
  },
  playTime: {
    fontSize: 20,
    alignSelf: "flex-start",
  },
  RecordTimeStamp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeContainer: {
    flexDirection: "row",
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.2,
  },
});
