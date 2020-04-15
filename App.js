import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Provider } from "react-redux";
import { rootReducer } from './'
import thunk from "redux-thunk";
import { createStore, compose, applyMiddleware } from "redux";
// import Slider from "@react-native-community/slider";
import Context from "./src/Context";
import * as Premissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import Playlist from "./src/components/playlist";
import Player from "./src/components/player";
import Recorder from "./src/components/recorder";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const store = createStore()

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
  const [isSeeking, setIsSeeking] = useState(false);
  const [recColor, setRecColor] = useState("black");
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [shouldPlayAtEndOfSeek, setShouldPlayAtEndOfSeek] = useState(false);
  const [isLooping, setIslooping] = useState(false);
  let soundPlayer = null;
  let playlist = [];
  let playlistIndex = 0;
  let recorder = null;

  const contextValue = {
    MaterialCommunityIcons,
    loading,
    playlist,
    playlistIndex,
    recColor,
    isRecording,
    recordingDuration,
    isPlaybackAllowed,
    soundDuration,
    soundPosition,
    isPlaying,
    playItem,
    deleteItem,
    onSeekSliderSlidingComplete,
    onSeekSliderValueChange,
    getSeekSliderPosition,
    getDuration,
    OnMutePressed,
    onVolumeChange,
    stopPlay,
    pausePlay,
    startPlay,
    onRecordPressed,
    onBackward,
    onForward,
  };

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
      setShouldPlay(status.shouldPlay);
      setIsPlaying(status.isPlaying);
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
    setLoading(true);
    try {
      if (!recordPremission) {
        askForPremissions();
      }

      if (soundPlayer !== null) {
        await soundPlayer.unloadAsync();
        soundPlayer.setOnPlaybackStatusUpdate(null);
        soundPlayer = null;
        setIsPlaying(false);
        setIsPlaybackAllowed(false);
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
        recorder = null;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      recording.setOnRecordingStatusUpdate(updateScreenForRecordStatus);
      recorder = recording;
      await recorder.startAsync();
      setRecColor("red");
      setLoading(false);
    } catch (error) {
      console.log("Can`t start recording! ", error);
    }
  }

  async function stopRecordingAndEnablePlayback() {
    setLoading(true);
    try {
      await recorder.stopAndUnloadAsync();
      setRecColor("black");

      const info = await FileSystem.getInfoAsync(recorder.getURI());

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        playsInSilentLockedModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      setIsPlaybackAllowed(true);

      const date = new Date(),
        name = `Record_${date.toLocaleString().replace(/ |,|\.|:/gi, "_")}`;
      playlist.concat({
        name: name,
        uri: info.uri,
      });

      playItem(playlist[playlist.length1 - 1]);
      setLoading(false);
    } catch (error) {
      console.log("Error? cant stop recording", error);
    }
  }

  async function playItem(playbackItemIndex) {
    try {
      setLoading(true);
      if (soundPlayer !== null) {
        await soundPlayer.unloadAsync();
        soundPlayer.setOnPlaybackStatusUpdate(null);
        soundPlayer = null;
        setIsPlaying(false);
        setIsPlaybackAllowed(false);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        playsInSilentLockedModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      playlistIndex = playbackItemIndex;
      const currentItem = playlist[playbackItemIndex];

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: currentItem.uri },
        {
          isLooping,
          isMuted,
          volume,
          shouldPlay,
        },
        updateScreenForSoundStatus
      );

      await sound.playAsync();
      soundPlayer = sound;
      setLoading(false);
    } catch (error) {
      console.log("Error, cant start playback:", error);
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
    if (soundPosition === soundDuration) {
      soundPlayer.setPositionAsync(0);
    }
    await soundPlayer.playAsync();
  }

  async function pausePlay() {
    await soundPlayer.pauseAsync();
  }

  async function stopPlay() {
    await soundPlayer.stopAsync();
  }

  function onForward() {
    shouldPlay = true;
    playItem(this.playlistIndex + 1);
  }

  function onBackward() {
    shouldPlay = true;
    playItem(this.playlistIndex - 1);
  }

  function onVolumeChange(value) {
    if (soundPlayer !== null) {
      soundPlayer.setVolumeAsync(value);
    }
  }

  function OnMutePressed() {
    if (soundPlayer != null) {
      soundPlayer.setIsMutedAsync(!isMuted);
    }
  }

  function getDuration(source) {
    if (source !== null) {
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

  function onSeekSliderValueChange(value) {
    if (soundPlayer != null && !isSeeking) {
      setIsSeeking(true);
      setShouldPlayAtEndOfSeek(shouldPlay);
      soundPlayer.pauseAsync();
    }
  }

  async function onSeekSliderSlidingComplete(value) {
    if (soundPlayer != null) {
      setIsSeeking(false);
      const seekPosition = value * soundDuration;
      if (shouldPlayAtEndOfSeek) {
        soundPlayer.playFromPositionAsync(seekPosition);
      } else {
        soundPlayer.setPositionAsync(seekPosition);
      }
    }
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

  function deleteItem(id) {
    if (id === playlistIndex) {
      soundPlayer.stopAsync();
      setShouldPlay(false);
      playItem(playlistIndex - 1);
    }
    playlist.filter((item, index) => index !== id);
  }

  return (
    <Context.Provider value={contextValue}>
      <Text style={styles.title}> -Dictaphone- </Text>
      <View style={styles.container}>
        <Playlist />
        <Recorder />
        <Player />
      </View>
    </Context.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  title: {
    alignSelf: "center",
    paddingHorizontal: 5,
    marginTop: 30,
    fontSize: 25,
    fontWeight: "bold",
  },
});
