import React, { useEffect, useState, useRef } from "react";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import ErrorBoundary from "./ErrorBoundary";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Slider,
  ScrollView,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const DISABLED_OPACITY = 0.5;
const ICON_SIZE = 40;

export default function App() {
  const [recordPremission, setRecordPremission] = useState(false);
  const [mediaLibPremission, setMediaLibPremission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [cameraAspectRatio, setCameraAspectRatio] = useState("16:9");
  const [cameraReady, setCameraReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
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
  const [recorder, setRecorder] = useState(null);
  const [soundPlayer, setSoundPlayer] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [playlistIndex, setPlaylistIndex] = useState(null);
  const [prewiewImage, setPrewiewImage] = useState(null);
  const [fetching, setFetching] = useState(false);
  let camera = useRef(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const opacity = opacityAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });
  useEffect(() => {
    animate();
  }, []);

  function animate() {
    opacityAnim.setValue(0);
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
    }).start(() => animate());
  }

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibPremission(status === "granted");
    })();

    (async () => {
      const { status } = await Permissions.askAsync(
        Permissions.AUDIO_RECORDING,
        Permissions.CAMERA_ROLL
      );
      setRecordPremission(status === "granted");
    })();

    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setCameraPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await loadPlaylist();
    })();
  }, []);

  useEffect(() => {
    setRecorder(recorder);
  }, [recorder]);

  useEffect(() => {
    setSoundPlayer(soundPlayer);
  }, [soundPlayer]);

  useEffect(() => {
    setPlaylistIndex(playlistIndex);
  }, [playlistIndex]);

  async function loadPlaylist() {
    try {
      const queryAlbum = await MediaLibrary.getAlbumAsync("dictaphone");
      if (queryAlbum) {
        const assets = await MediaLibrary.getAssetsAsync({
          album: queryAlbum,
          first: 50,
          mediaType: [MediaLibrary.MediaType.audio],
        });
        setPlaylist(assets.assets);
      } else {
        setPlaylist([]);
      }
    } catch (error) {
      console.log("Cant load playlist", error);
    }
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
      setIslooping(status.isLooping);
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
        const { status } = await Permissions.askAsync(
          Permissions.AUDIO_RECORDING,
          Permissions.CAMERA_ROLL
        );
        setRecordPremission(status === "granted");
      }
      if (!mediaLibPremission) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setMediaLibPremission(status === "granted");
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
      const sounforSend = await MediaLibrary.createAssetAsync(info.uri);
      const queryAlbum = await MediaLibrary.getAlbumAsync("dictaphone");
      queryAlbum
        ? await MediaLibrary.addAssetsToAlbumAsync(
            [sounforSend],
            queryAlbum,
            false
          )
        : await MediaLibrary.createAlbumAsync("dictaphone", sounforSend, false);

      sendFile(sounforSend, "sound");
      await loadPlaylist();

      setRecordingDuration(null);
      setPlaylistIndex(playlist.length);

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
      console.log("Error, cant stop recording", error);
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
          isMuted,
          volume,
          shouldPlay,
        },
        updateScreenForSoundStatus
      );

      setSoundPlayer(sound);
      sound.playAsync();
      setLoading(false);
    } catch (error) {
      console.log("Error, cant start playback:", error);
    }
  }

  async function deleteItem(id, item) {
    try {
      if (id === playlistIndex) {
        soundPlayer.stopAsync();
        setShouldPlay(false);
        playItem(playlistIndex - 1);
      }
      await MediaLibrary.deleteAssetsAsync([item]);

      await loadPlaylist();
    } catch (error) {
      console.log("Cant remove record:" + error);
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
    if (!soundPlayer) {
      return;
    }
    if (soundPosition === soundDuration) {
      soundPlayer.setPositionAsync(0);
    }
    await soundPlayer.playAsync();
  }

  async function pausePlay() {
    if (!soundPlayer) {
      return;
    }
    await soundPlayer.pauseAsync();
  }

  async function stopPlay() {
    if (!soundPlayer) {
      return;
    }
    await soundPlayer.stopAsync();
  }

  function onForward() {
    setShouldPlay(true);
    playItem(playlistIndex + 1);
  }

  function onBackward() {
    setShouldPlay(true);
    playItem(playlistIndex - 1);
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

  function onLoopPressed() {
    if (soundPlayer != null) {
      soundPlayer.setIsLoopingAsync(!isLooping);
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

  function getRecordName(epoch) {
    const date = new Date(epoch),
      rowName = `Rec_${date.toLocaleDateString()}-${date.toLocaleTimeString()}`,
      // name = rowName.replace(/ |,|\.|\/|:/gi, "_");
      name = rowName.replace(/\//gi, ".");
    return name;
  }

  async function snap() {
    if (camera && cameraReady) {
      let { uri } = await camera.current.takePictureAsync();
      setPrewiewImage({ uri });
    }
  }

  async function savePhoto(uri) {
    try {
      let photo = await MediaLibrary.createAssetAsync(uri);
      sendFile(photo, "image");
      // await MediaLibrary.saveToLibraryAsync(uri);
      setPrewiewImage(null);
    } catch (error) {
      console.log("Error? cant save photo", error);
    }
  }

  const createFormData = (photo, body, type, fieldname) => {
    const data = new FormData();

    data.append(fieldname, {
      name: photo.filename,
      type: type,
      uri:
        Platform.OS === "android"
          ? photo.uri
          : photo.uri.replace("file://", ""),
    });

    Object.keys(body).forEach((key) => {
      data.append(key, body[key]);
    });

    return data;
  };

  async function sendFile(file, type) {
    console.log("sending", file);
    const url =
        type === "image"
          ? "http://dictaphone.worddict.net/api/upload/image/"
          : "http://dictaphone.worddict.net/api/upload/sound/",
      fileType = type === "image" ? "image/jpeg" : "audio/mp4",
      fieldname = type === "image" ? "photo" : "sound";

    setFetching(true);
    ss;
    try {
      const response = await fetch(url, {
        method: "POST",
        body: createFormData(file, {}, fileType, fieldname),
      });
      const status = await response.json();
      console.log(status);
    } catch (error) {
      console.log("upload error", error);
    }
    setFetching(false);
  }

  return (
    <>
      <ErrorBoundary>
        {showCamera ? (
          <View style={{ flex: 1 }}>
            {cameraPermission === null ? (
              <Viev />
            ) : cameraPermission ? (
              prewiewImage ? (
                <ImageBackground
                  source={prewiewImage}
                  style={styles.imagePreview}
                >
                  <MaterialCommunityIcons
                    name="delete-forever"
                    onPress={() => setPrewiewImage(null)}
                    style={styles.previewControlButton}
                    size={ICON_SIZE}
                    color="white"
                    disabled={loading}
                  />
                  <MaterialCommunityIcons
                    name="content-save"
                    onPress={() => savePhoto(prewiewImage.uri)}
                    style={styles.previewControlButton}
                    size={ICON_SIZE}
                    color="white"
                    disabled={loading}
                  />
                </ImageBackground>
              ) : (
                <Camera
                  ref={camera}
                  style={{
                    flex: 1,
                  }}
                  type={cameraType}
                  ratio={cameraAspectRatio}
                  onCameraReady={() => setCameraReady(true)}
                >
                  <Animated.View style={{ opacity }}>
                    {fetching && (
                      <MaterialCommunityIcons
                        style={styles.fetchingIconCamera}
                        name="cloud-upload"
                        size={ICON_SIZE - 10}
                        color="lightgray"
                      />
                    )}
                  </Animated.View>
                  <View style={styles.cameraPreview}>
                    <MaterialCommunityIcons
                      style={styles.previewControlButton}
                      name="microphone"
                      onPress={() => setShowCamera(false)}
                      size={ICON_SIZE}
                      color="white"
                      disabled={loading}
                    />

                    <MaterialCommunityIcons
                      style={styles.previewControlButton}
                      name="camera-iris"
                      onPress={snap}
                      size={ICON_SIZE + 20}
                      color="white"
                      disabled={loading}
                    />
                    <MaterialCommunityIcons
                      name="camera-switch"
                      onPress={() => {
                        setCameraType(
                          cameraType === Camera.Constants.Type.back
                            ? Camera.Constants.Type.front
                            : Camera.Constants.Type.back
                        );
                      }}
                      style={styles.previewControlButton}
                      size={ICON_SIZE}
                      color="white"
                      disabled={loading}
                    />
                  </View>
                </Camera>
              )
            ) : (
              <Text style={styles.NoAcccessCamera}>No access to camera</Text>
            )}
          </View>
        ) : (
          <View style={styles.playerContainer}>
            <View
              style={{
                flexDirection: "row",
                width: DEVICE_WIDTH - 20,
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.title}> -Dictaphone- </Text>
              <View
                style={{
                  alignSelf: "center",
                }}
              >
                {fetching && (
                  <Animated.View style={{ opacity }}>
                    <MaterialCommunityIcons
                      name="cloud-upload"
                      size={ICON_SIZE - 10}
                      color="black"
                    />
                  </Animated.View>
                )}
              </View>
            </View>

            <ScrollView style={styles.playlist}>
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
                    <Text>{getRecordName(item.modificationTime)}</Text>
                    <View style={styles.playlistItemTimeAndDelete}>
                      <Text>{getDuration(item.duration * 1000)}</Text>
                      <MaterialCommunityIcons
                        name="delete-forever"
                        onPress={() => deleteItem(index, item)}
                        size={ICON_SIZE - 15}
                        color="black"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                <Text style={styles.liveRecord}>
                  {isRecording ? "LIVE " : " "}
                </Text>
                <Text style={styles.recordTime}>
                  {getDuration(recordingDuration)}
                </Text>
              </View>
            </View>
            <View style={[styles.playBackContainer]}>
              <Slider
                style={styles.playbackSlider}
                value={getSeekSliderPosition()}
                onValueChange={onSeekSliderValueChange}
                onSlidingComplete={onSeekSliderSlidingComplete}
                disabled={!isPlaybackAllowed || loading}
              />
              <View
                style={[
                  styles.player,
                  { opacity: !isPlaybackAllowed ? DISABLED_OPACITY : 1.0 },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={DISABLED_OPACITY}
                  style={styles.PlayStopPause}
                >
                  <MaterialCommunityIcons
                    name="skip-backward"
                    onPress={onBackward}
                    size={ICON_SIZE}
                    color="black"
                    style={{
                      opacity:
                        !isPlaybackAllowed ||
                        loading ||
                        !playlist[playlistIndex - 1]
                          ? DISABLED_OPACITY
                          : 1,
                    }}
                    disabled={
                      !isPlaybackAllowed ||
                      loading ||
                      !playlist[playlistIndex - 1]
                    }
                  />

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

                  <MaterialCommunityIcons
                    name="skip-forward"
                    onPress={onForward}
                    size={ICON_SIZE}
                    color="black"
                    style={{
                      opacity:
                        !isPlaybackAllowed ||
                        loading ||
                        !playlist[playlistIndex + 1]
                          ? DISABLED_OPACITY
                          : 1,
                    }}
                    disabled={
                      !isPlaybackAllowed ||
                      loading ||
                      !playlist[playlistIndex + 1]
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.playTime}>
                  {getDuration(soundPosition)}/{getDuration(soundDuration)}
                </Text>
              </View>

              <View style={styles.volumeContainer}>
                <MaterialCommunityIcons
                  style={{
                    marginHorizontal: 4,
                    right: 4,
                  }}
                  name="camera"
                  onPress={() => setShowCamera(true)}
                  size={ICON_SIZE}
                  color="black"
                  disabled={loading}
                />

                <MaterialCommunityIcons
                  name={isMuted ? "volume-off" : "volume-high"}
                  size={ICON_SIZE}
                  style={{
                    opacity: !isPlaybackAllowed ? DISABLED_OPACITY : 1.0,
                  }}
                  color="black"
                  onPress={OnMutePressed}
                  disabled={!isPlaybackAllowed || loading}
                />

                <Slider
                  style={styles.volumeSlider}
                  value={1.0}
                  onValueChange={onVolumeChange}
                  disabled={!isPlaybackAllowed || loading}
                />

                <MaterialCommunityIcons
                  name="loop"
                  size={ICON_SIZE}
                  color="black"
                  onPress={onLoopPressed}
                  disabled={!isPlaybackAllowed || loading}
                  style={{
                    opacity: !isLooping ? DISABLED_OPACITY : 1,
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </ErrorBoundary>
    </>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginVertical: 30,
  },
  title: {
    alignSelf: "center",
    paddingHorizontal: 5,
    fontSize: 25,
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
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
  RecordTimeStamp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  liveRecord: {
    color: "red",
    fontSize: 15,
  },
  recordTime: {
    fontSize: 15,
  },
  recordContainer: {
    width: DEVICE_WIDTH / 1.3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playbackSlider: {
    marginBottom: 20,
  },
  PlayStopPause: {
    flexDirection: "row",
    marginBottom: 15,
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
  playlistItemTimeAndDelete: {
    flexDirection: "row",
    width: 70,
    justifyContent: "space-between",
  },
  imagePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    alignSelf: "center",
  },
  previewControlButton: {
    alignSelf: "flex-end",
    margin: 20,
  },
  fetchingIconCamera: {
    alignSelf: "flex-end",
    marginTop: 20,
    marginHorizontal: 15,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  NoAcccessCamera: { margin: 20 },
});
