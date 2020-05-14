import React, { useEffect, useState, useRef } from "react";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import ErrorBoundary from "./ErrorBoundary";
import { AsyncStorage } from "react-native";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Slider,
  ImageBackground,
  Animated,
  Easing,
  BackHandler,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PlayList from "./src/Playlist";
import Recorder from "./src/Recorder";
import SettingsList from "./src/SettingsList";
import Gallery from "./src/Gallery";
import NetInfo from "@react-native-community/netinfo";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const DISABLED_OPACITY = 0.5;
const ICON_SIZE = 40;
const recognizeServer = "http://192.168.0.10:4004/recordings";

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
  const [imagelist, setImagelist] = useState([]);
  const [playlistIndex, setPlaylistIndex] = useState(null);
  const [prewiewImage, setPrewiewImage] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [recognize, setRecognize] = useState("OFF");
  const [settings, setSettings] = useState({
    instatntLoading: false,
    recordQuality: "high",
    recognizedFileName: false,
    setting4: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  let camera = useRef(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const recordsDir = FileSystem.documentDirectory + "records/";
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
      const assets = await retrieveData("playlist");
      if (!assets) {
        await storeData("playlist", []);
      }
      const recDirExist = await FileSystem.getInfoAsync(recordsDir);
      if (!recDirExist.exists) {
        await FileSystem.makeDirectoryAsync(recordsDir);
      }

      await loadPlaylist();
      await loadimagelist();
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      goBack
    );

    return () => backHandler.remove();
  }, []);

  function goBack() {
    if (camera.current) {
      setShowCamera(false);
      return true;
    }
    return false;
  }

  async function storeData(key, val) {
    const value = JSON.stringify(val);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log("Can`t write asyncMemory", error);
    }
  }

  async function getConnection() {
    const state = await NetInfo.fetch();
    return state.isInternetReachable;
  }

  async function retrieveData(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) {
        return value;
      }
      return JSON.parse(value);
    } catch (error) {
      console.log("Can`t read asyncMemory", error);
    }
  }

  async function getAlbum() {
    const album = await MediaLibrary.getAlbumAsync("dictaphone");
    return album ? album : false;
  }

  async function loadimagelist() {
    const queryAlbum = await getAlbum();
    if (!queryAlbum) {
      return;
    }
    const assets = await MediaLibrary.getAssetsAsync({
      album: queryAlbum,
      first: 200,
      mediaType: [MediaLibrary.MediaType.photo],
    });
    assets.assets.map((item) => {
      item.serverStoring = false;
    });

    if (await getConnection()) {
      const syncList = await syncFiles(assets.assets, "imageList");
      setImagelist(syncList);
      return;
    }
    setImagelist(assets.assets);
  }

  async function loadPlaylist() {
    try {
      const assets = await retrieveData("playlist");
      if (await getConnection()) {
        const syncList = await syncFiles(assets, "soundList");
        setPlaylist(syncList);
        return;
      }
      setPlaylist(assets);
    } catch (error) {
      console.log("Cant load playlist", error);
    }
  }

  async function syncFiles(fileList, syncType) {
    const filesUrl = "http://dictaphone.worddict.net/fileslist/";
    try {
      const re = /.*loaded_/gi;
      const response = await fetch(filesUrl);
      const fileonServer = await response.json();
      if (syncType === "soundList") {
        const serverSoundList = fileonServer.soundList.map((item) =>
          item.replace(re, "")
        );
        fileList.map(
          (item) =>
            (item.serverStoring = serverSoundList.includes(item.filename))
        );
        return fileList;
      } else if (syncType === "imageList") {
        const serverImageList = fileonServer.ImageList.map((item) =>
          item.replace(re, "")
        );
        fileList.map(
          (item) =>
            (item.serverStoring = serverImageList.includes(item.filename))
        );
        return fileList;
      }
    } catch (error) {
      console.log("Sync error", error);
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
        settings.recordQuality === "high"
          ? Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
          : Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY
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

  async function fetchRecordName(file) {
    const data = new FormData();
    data.append("file", file);
    try {
      const response = await fetch(recognizeServer, {
        method: "POST",
        body: data,
      });
      const fileName = await response.json();
      return fileName.result;
    } catch (error) {
      console.log("upload error", error);
      return getRecordName(Date.now());
    }
  }

  async function stopRecordingAndEnablePlayback() {
    setLoading(true);
    try {
      await recorder.stopAndUnloadAsync();
      setRecColor("black");
      const status = await recorder.getStatusAsync();
      const info = await FileSystem.getInfoAsync(recorder.getURI());
      const re = /(?!.*\/).*[^"]/g;
      const recordName =
        (await getConnection()) && settings.recognizedFileName
          ? await fetchRecordName({
              name: info.uri.match(re)[0],
              type: "audio/mp4",
              uri: info.uri,
            })
          : getRecordName(Date.now());
      const filename = info.uri.match(re)[0];
      const fileLink = recordsDir + filename;
      await FileSystem.moveAsync({
        from: info.uri,
        to: fileLink,
      });
      const newRecord = {
        filename,
        recordName,
        duration: getDuration(status.durationMillis),
        uri: fileLink,
        serverStoring: false,
      };

      if (settings.instatntLoading && (await getConnection())) {
        await sendFile(newRecord, "sound");
      }

      storeData("playlist", [...playlist, newRecord]);
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
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileLink },
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

  async function playItem(playbackItemIndex, onDelete = false) {
    try {
      setLoading(true);
      if (soundPlayer !== null) {
        await soundPlayer.unloadAsync();
        soundPlayer.setOnPlaybackStatusUpdate(null);
        setSoundPlayer(null);
        setIsPlaying(false);
        setIsPlaybackAllowed(false);
      }
      if (!playlist[playbackItemIndex]) {
        setLoading(false);
        return;
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
          shouldPlay: !onDelete,
        },
        updateScreenForSoundStatus
      );

      setSoundPlayer(sound);
      if (!onDelete) {
        sound.playAsync();
      }
      setLoading(false);
    } catch (error) {
      console.log("Error, cant start playback:", error);
    }
  }

  async function deleteSound(id, item) {
    try {
      if (id === playlistIndex && soundPlayer !== null) {
        soundPlayer.stopAsync();
        setShouldPlay(false);
        playItem(playlistIndex - 1, true);
      } else if (playlist[playlistIndex - 1] && id < playlistIndex) {
        setPlaylistIndex(playlistIndex - 1);
      }
      const playlistFilter = playlist.filter(
        (rec) => rec.filename !== item.filename
      );
      await storeData("playlist", playlistFilter);
      await loadPlaylist();
      await FileSystem.deleteAsync(item.uri);
    } catch (error) {
      console.log("Cant remove record:" + error);
    }
  }

  async function deleteImage(asset) {
    const album = await getAlbum();
    await MediaLibrary.removeAssetsFromAlbumAsync([asset], album);
    await loadimagelist();
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
      if (settings.instatntLoading && (await getConnection())) {
        await sendFile(photo, "image");
      }
      await saveToAlbum(photo);
      setPrewiewImage(null);
      await loadimagelist();
    } catch (error) {
      console.log("Error? cant save photo", error);
    }
  }

  async function saveToAlbum(asset) {
    const queryAlbum = await getAlbum();
    queryAlbum
      ? await MediaLibrary.addAssetsToAlbumAsync([asset], queryAlbum, false)
      : await MediaLibrary.createAlbumAsync("dictaphone", asset, false);
  }

  const createFormData = (file, body, type, fieldname) => {
    const data = new FormData();

    data.append(fieldname, {
      name: file.filename,
      type: type,
      uri:
        Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
    });

    Object.keys(body).forEach((key) => {
      data.append(key, body[key]);
    });

    return data;
  };
  async function sendList(list, type) {
    if (!!(await getConnection())) {
      return;
    }
    const syncType = type === "image" ? "imageList" : "soundList";
    await syncFiles(list, syncType);
    list.map(async (item) => {
      if (!item.serverStoring && getConnection()) {
        await sendFile(item, type);
      }
    });
  }

  async function sendFile(file, type) {
    if (!(await getConnection())) {
      return;
    }
    const url =
        type === "image"
          ? "http://dictaphone.worddict.net/api/upload/image/"
          : "http://dictaphone.worddict.net/api/upload/sound/",
      fileType = type === "image" ? "image/jpeg" : "audio/mp4",
      fieldname = type === "image" ? "photo" : "sound",
      syncType = type === "image" ? "imageList" : "soundList",
      fileList = type === "image" ? imagelist : playlist;

    setFetching(true);
    try {
      await fetch(url, {
        method: "POST",
        body: createFormData(file, {}, fileType, fieldname),
      });
      await syncFiles(fileList, syncType);
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
              ) : !showGallery ? (
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
                      onPress={goBack}
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
                      name="image-area"
                      onPress={() => setShowGallery(true)}
                      style={styles.previewControlButton}
                      size={ICON_SIZE}
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
              ) : (
                <Gallery
                  sendList={sendList}
                  sendFile={sendFile}
                  list={imagelist}
                  onDelete={deleteImage}
                  styles={styles}
                  setShowGallery={setShowGallery}
                />
              )
            ) : (
              <Text style={styles.noAcccessCamera}>No access to camera</Text>
            )}
          </View>
        ) : showSettings ? (
          <SettingsList
            styles={styles}
            settings={settings}
            setShowSettings={setShowSettings}
            setSettings={setSettings}
          />
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
            <PlayList
              sendList={sendList}
              sendFile={sendFile}
              list={playlist}
              onPlay={playItem}
              onDelete={deleteSound}
              styles={styles}
              playlistIndex={playlistIndex}
            />
            <Recorder
              onRecordPressed={onRecordPressed}
              styles={styles}
              getDuration={getDuration}
              recordingDuration={recordingDuration}
              isRecording={isRecording}
              recColor={recColor}
              recognize={recognize}
              setRecognize={setRecognize}
            />
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
                <Text style={styles.playTime}>
                  {getDuration(soundPosition)}/{getDuration(soundDuration)}
                </Text>
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
                        !isPlaybackAllowed || loading || !playlist.length
                          ? DISABLED_OPACITY
                          : 1,
                    }}
                    disabled={!isPlaybackAllowed || loading || !playlist.length}
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
              </View>

              <View style={styles.bottomPanel}>
                <MaterialCommunityIcons
                  name="camera"
                  onPress={() => setShowCamera(true)}
                  size={ICON_SIZE}
                  color="black"
                  disabled={loading}
                />
                <View style={styles.volumeContainer}>
                  <MaterialCommunityIcons
                    name={isMuted ? "volume-off" : "volume-high"}
                    size={ICON_SIZE}
                    style={{
                      opacity: !isPlaybackAllowed ? DISABLED_OPACITY : 1.0,
                      left: 10,
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
                </View>

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

                <MaterialCommunityIcons
                  name="settings"
                  size={ICON_SIZE}
                  color="black"
                  onPress={() => setShowSettings(true)}
                  disabled={loading}
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
    justifyContent: "flex-start",
    marginTop: 30,
    marginBottom: 15,
  },
  title: {
    alignSelf: "center",
    paddingHorizontal: 5,
    fontSize: 25,
    fontWeight: "bold",
  },
  playlist: {
    height: DEVICE_HEIGHT / 2,
    width: DEVICE_WIDTH,
    borderTopColor: "gray",
    borderStyle: "solid",
    borderTopWidth: 2,
    borderRadius: 3,
    borderBottomColor: "gray",
    borderBottomWidth: 2,
    marginTop: 5,
    backgroundColor: "lightgray",
  },
  playlistItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    marginVertical: 2,
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
    backgroundColor: "#33a2da",
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
    fontSize: 18,
    marginRight: 2,
  },
  recordTime: {
    fontSize: 18,
  },
  recordContainer: {
    width: DEVICE_WIDTH / 1.1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "flex-start",
    marginHorizontal: 15,
    marginVertical: 5,
  },
  playbackSlider: {
    width: DEVICE_WIDTH / 1.1,
    alignSelf: "center",
  },
  PlayStopPause: {
    flexDirection: "row",
    width: DEVICE_WIDTH / 1.3,
    marginVertical: 10,
    justifyContent: "space-between",
    alignSelf: "center",
  },
  player: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: DEVICE_WIDTH,
    alignSelf: "center",
  },
  playBackContainer: {
    width: DEVICE_WIDTH / 1.2,
  },
  playTime: {
    fontSize: 15,
    alignSelf: "flex-end",
    marginRight: 25,
  },
  volumeContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  bottomPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: DEVICE_WIDTH - 25,
    alignSelf: "center",
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.5,
  },
  playlistItemTimeAndDelete: {
    flexDirection: "row",
    width: 105,
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
  noAcccessCamera: { margin: 20 },
  recognizeToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  settings: {
    width: DEVICE_WIDTH,
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 35,
  },
  settingsList: {
    marginTop: 15,
    width: DEVICE_WIDTH,
    flexDirection: "column",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "black",
    borderStyle: "solid",
  },
  settingsItem: {
    borderTopWidth: 1,
    borderColor: "black",
    borderStyle: "solid",
    width: DEVICE_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginLeft: 15,
  },
  imagePrewiewList: {
    height: 150,
    width: 100,
  },
  galleryItem: {
    borderTopWidth: 1,
    borderColor: "black",
    borderStyle: "solid",
    width: DEVICE_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingLeft: 15,
    paddingRight: 10,
  },
  gallery: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT - 25,
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 35,
  },
  galleryTitle: {
    width: DEVICE_WIDTH - 10,
    marginVertical: 5,
    marginHorizontal: 5,
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 3,
    borderColor: "black",
    backgroundColor: "#33a2da",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "300",
  },
  imageName: {
    width: 150,
  },
  galleryCloudAndDelete: {
    flexDirection: "column",
    width: 50,
    justifyContent: "space-between",
  },
  settingsSwich: {
    flexDirection: "row",
  },
});
