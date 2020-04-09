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
import * as FileSystem from "expo-file-system";

class Icon {
  constructor(module, width, height) {
    (this.module = module), (this.whidth = width), (this.height = height);
    Asset.fromModule(this.module).downloadAsync();
  }
}
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const DISABLED_OPACITY = 0.5;
const ICON_SIZE = 40;

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
  const [recorder, setRecorder] = useState(null);
  const [soundPlayer, setSoundPlayer] = useState(null);
  const [recColor, setRecColor] = useState("black");
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [shouldPlayAtEndOfSeek, setShouldPlayAtEndOfSeek] = useState(false);
  const [isLooping, setIslooping] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [playlistIndex, setPlaylistIndex] = useState(null);

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
        setSoundPlayer(null);
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
        setRecorder(null);
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      recording.setOnRecordingStatusUpdate(updateScreenForRecordStatus);

      await recording.startAsync();
      setRecorder(recording);
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

      setPlaylist([
        ...playlist,
        {
          name: name,
          uri: info.uri,
        },
      ]);

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: info.uri },
        {
          isLooping,
          isMuted: isMuted,
          volume: volume,
          shouldPlay: false,
        },
        updateScreenForSoundStatus
      );
      setSoundPlayer(sound);
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
        setSoundPlayer(null);
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
      setPlaylistIndex(playbackItemIndex);
      const currentItem = playlist[playbackItemIndex];

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: currentItem.uri },
        {
          isLooping,
          isMuted: isMuted,
          volume: volume,
          shouldPlay: false,
        },
        updateScreenForSoundStatus
      );

      await sound.playAsync();
      setSoundPlayer(sound);
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

  return (
    <>
      <Text style={styles.title}> -Dictaphone- </Text>
      <View style={styles.container}>
        <View style={styles.playlist}>
          <Text style={styles.playlisttitle}>Record list</Text>
          {playlist.map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.playlistItem,
                  {
                    borderColor: index === playlistIndex ? "gray" : "black",
                    backgroundColor:
                      index === playlistIndex ? "lightgray" : "white",
                  },
                ]}
                onPress={() => playItem(index)}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.recordContainer}>
          <TouchableOpacity
            onPress={onRecordPressed}
            activeOpacity={DISABLED_OPACITY}
          >
            <MaterialCommunityIcons
              name="record-rec"
              size={ICON_SIZE + 10}
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
            onValueChange={onSeekSliderValueChange}
            onSlidingComplete={onSeekSliderSlidingComplete}
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
                  size={ICON_SIZE}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              ) : (
                <MaterialCommunityIcons
                  name="pause"
                  onPress={pausePlay}
                  size={ICON_SIZE}
                  color="black"
                  disabled={!isPlaybackAllowed || loading}
                />
              )}
              <MaterialCommunityIcons
                name="stop"
                onPress={stopPlay}
                size={ICON_SIZE}
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
              value={1}
              onValueChange={onVolumeChange}
              disabled={!isPlaybackAllowed || loading}
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
    fontSize: 25,
    fontWeight: "bold",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 7,
  },
  liveRecord: {
    color: "red",
    fontSize: 15,
  },
  recordTime: {
    fontSize: 15,
  },
  playTime: {
    fontSize: 15,
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
  playlist: {
    height: DEVICE_HEIGHT / 2,
    width: DEVICE_WIDTH - 20,
    borderColor: "gray",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 3,
  },
  playlistItem: {
    padding: 5,
    marginVertical: 3,
    marginHorizontal: 5,
    borderColor: "gray",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 3,
  },
  playlisttitle: {
    marginVertical: 3,
    marginHorizontal: 5,
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 3,
    borderColor: "black",
    backgroundColor: "darkgray",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "300",
  },
});
