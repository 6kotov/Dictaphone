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
const DISABLED_OPACITY = 0.7;

export default function App() {
  const [recordPremission, setRecordPremission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [soundDuration, setSoundDuration] = useState(null);
  const [soundPosition, setSoundPosition] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPosition, setSeekPosition] = useState(null);
  const [isSeeking, setIsSeeking] = useState(0);
  const [recorder, setRecorder] = useState(new Audio.Recording());
  const [soundPlayer, setSoundPlayer] = useState(null);
  const [recColor, setRecColor] = useState("black");
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const recordButton = isRecording ? "Stop recording." : "Start recording.";
  const recordSwich = isRecording ? stopRecord : startRecord;
  const playSwich = isPlaying ? pausePlay : startPlay;

  useEffect(() => {
    askForPremissions();
  }, [askForPremissions]);

  async function askForPremissions() {
    const { status } = await Premissions.askAsync(Premissions.AUDIO_RECORDING);
    setRecordPremission(status === "granted");
  }

  async function startRecord() {
    setRecColor("red");
    try {
      if (!recordPremission) {
        askForPremissions();
      }

      setIsRecording(true);
      await recorder.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY
      );
      console.log("Recording Prepared");
      await recorder.startAsync();
      console.log("Record Stared");
      // You are now recording!
    } catch (error) {
      console.log("Can`t start recording! ", error);
    }
  }

  async function stopRecord() {
    setRecColor("black");
    try {
      await recorder.stopAndUnloadAsync();
      const { sound, status } = await recorder.createNewLoadedSoundAsync(
        {},
        null
      );

      setIsRecording(false);
      setSoundPlayer(sound);
      setRecorder(null);
      setRecorder(new Audio.Recording());
      console.log("Recording stopped");
    } catch (error) {
      console.log("Error? cant stop recording", error);
    }
  }

  async function startPlay() {
    setIsPlaying(true);
    await soundPlayer.playAsync();
  }

  async function pausePlay() {
    setIsPlaying(false);
    await soundPlayer.pauseAsync();
  }

  async function stopPlay() {
    setIsPlaying(false);
    await soundPlayer.stopAsync();
  }

  return (
    <View style={styles.container}>
      <Text>Recorder</Text>

      <TouchableOpacity
        onPress={() => recordSwich()}
        activeOpacity={DISABLED_OPACITY}
      >
        <MaterialCommunityIcons
          name="record-rec"
          size={60}
          style={styles.recordButton}
          color={recColor}
        />
      </TouchableOpacity>
      <View style={styles.playBackContainer}>
        <Slider
          style={styles.playbackSlider}
          // trackImage={ICON_TRACK_1.module}
          // thumbImage={ICON_THUMB_1.module}
          // value={this._getSeekSliderPosition()}
          // onValueChange={this._onSeekSliderValueChange}
          // onSlidingComplete={this._onSeekSliderSlidingComplete}
          disabled={!isPlaybackAllowed || loading}
        />
        <TouchableOpacity
          activeOpacity={DISABLED_OPACITY}
          style={styles.player}
        >
          {!isPlaying ? (
            <MaterialCommunityIcons
              name="play"
              onPress={() => playSwich()}
              size={60}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          ) : (
            <MaterialCommunityIcons
              name="pause"
              onPress={() => playSwich()}
              size={60}
              color="black"
              disabled={!isPlaybackAllowed || loading}
            />
          )}
          <MaterialCommunityIcons
            name="stop"
            onPress={() => stopPlay()}
            size={60}
            color="black"
            disabled={!isPlaybackAllowed || loading}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  playbackSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
  recordButton: {},
  player: {
    flexDirection: "row",
  },
  playBackContainer: {},
});
