import { Audio } from "expo-av";
// import { useDispatch } from "react-redux";
import * as FileSystem from "expo-file-system";
// import { set_loading } from "../redux/actions";

// const dispatch = useDispatch();
// const set_is_loading = (value) => {
//   dispatch(set_loading(value));
// };

class PlayRec {
  constructor(Audio, FileSystem) {
    if (typeof PlayRec.instance === "object") {
      return PlayRec.instance;
    }
    PlayRec.instance = this;
    this.volume = 1.0;
    this.isMuted = false;
    this.soundDuration = null;
    this.recordingDuration = null;
    this.soundPosition = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.isSeeking = false;
    this.recorder = null;
    this.soundPlayer = null;
    this.recColor = "black";
    this.isPlaybackAllowed = true;
    this.shouldPlay = false;
    this.shouldPlayAtEndOfSeek = false;
    this.isLooping = false;
    this.playlist = [];
    this.playlistIndex = 0;
    this.Audio = Audio;
    this.FileSystem = FileSystem;
    return this;
  }
  setAudioModeAsync() {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  }

  updateScreenForRecordStatus(status) {
    console.log(this.isRecording);
    if (status.canRecord) {
      this.isRecording = status.isRecording;
      this.recordingDuration = status.durationMillis;
    } else if (status.isDoneRecording) {
      this.isRecording = status.isRecording;
      this.recordingDuration = status.durationMillis;
    }
    console.log(this.isRecording);
  }

  updateScreenForSoundStatus(status) {
    if (status.isLoaded) {
      this.soundDuration = status.durationMillis;
      this.soundPosition = status.positionMillis;
      this.shouldPlay = status.shouldPlay;
      this.isPlaying = status.isPlaying;
      this.isMuted = status.isMuted;
      this.volume = status.volume;
      this.isPlaybackAllowed = true;
    } else {
      this.soundDuration = null;
      this.soundPosition = null;
      this.isPlaybackAllowed = false;
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  }

  async stopPlaybackAndBeginRecording() {
    // this.set_is_loading(true);
    try {
      // if (!recordPremission) {
      //   console.log(
      //     "Application not allowed to use microphone, plaese check premissions!"
      //   );
      // }
      if (this.soundPlayer !== null) {
        await this.soundPlayer.unloadAsync();
        this.soundPlayer.setOnPlaybackStatusUpdate(null);
        this.soundPlayer = null;
        this.isPlaying = false;
        this.isPlaybackAllowed = false;
      }

      if (this.recorder !== null) {
        this.recorder.setOnRecordingStatusUpdate(null);
        this.recorder = null;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      recording.setOnRecordingStatusUpdate(this.updateScreenForRecordStatus);
      console.log(recording);

      await recording.startAsync();
      this.recorder = recording;
      this.recColor = "red";
      // this.set_is_loading(false);
      console.log(this.isRecording);
    } catch (error) {
      console.log("Can`t start recording! ", error);
    }
  }

  async stopRecordingAndEnablePlayback() {
    // this.set_is_loading(true);
    try {
      await this.recorder.stopAndUnloadAsync();
      this.recColor = "black";

      const info = await FileSystem.getInfoAsync(this.recorder.getURI());
      this.isPlaybackAllowed = true;
      this.recordingDuration = null;

      const date = new Date(),
        name = `Record_${date.toLocaleString().replace(/ |,|\.|:/gi, "_")}`;
      const duration = this.getDuration(this.recorder._finalDurationMillis);

      this.playlist.push({
        name: name,
        uri: info.uri,
        duration,
      });

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: info.uri },
        {
          isLooping: this.isMuted,
          isMuted: this.isMuted,
          volume: this.volume,
          shouldPlay: this.shouldPlay,
        },
        this.updateScreenForSoundStatus
      );
      this.soundPlayer = sound;
      this.playlistIndex = playlist.length - 1;
      // this.set_is_loading(false);
    } catch (error) {
      console.log("Error? cant stop recording", error);
    }
  }

  async playItem(playbackItemIndex) {
    try {
      // this.set_is_loading(true);
      if (this.soundPlayer !== null) {
        await this.soundPlayer.unloadAsync();
        this.soundPlayer.setOnPlaybackStatusUpdate(null);
        this.soundPlayer = null;
        this.isPlaying = false;
        this.isPlaybackAllowed = false;
      }

      this.playlistIndex = playbackItemIndex;

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: playlist[playlistIndex].uri },
        {
          isLooping,
          isMuted: isMuted,
          volume: volume,
          shouldPlay,
        },
        updateScreenForSoundStatus
      );
      this.soundPlayer = sound;
      this.shouldPlay = false;
      // this.set_is_loading(false);
    } catch (error) {
      console.log("Error, cant start playback:", error);
    }
  }

  getMMSSFromMillis(millis) {
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

  onRecordPressed() {
    console.log(this.isRecording);
    if (this.isRecording) {
      this.stopRecordingAndEnablePlayback();
    } else {
      this.stopPlaybackAndBeginRecording();
    }
  }

  async startPlay() {
    if (this.soundPosition === this.soundDuration) {
      this.soundPlayer.setPositionAsync(0);
    }
    await this.soundPlayer.playAsync();
  }

  async pausePlay() {
    await this.soundPlayer.pauseAsync();
  }

  async stopPlay() {
    await this.soundPlayer.stopAsync();
  }

  onVolumeChange(value) {
    if (this.soundPlayer !== null) {
      this.soundPlayer.setVolumeAsync(value);
    }
  }

  OnMutePressed() {
    if (this.soundPlayer != null) {
      this.soundPlayer.setIsMutedAsync(!isMuted);
    }
  }

  onForward() {
    if (!this.playlist[this.playlistIndex + 1]) {
      return;
    }
    this.shouldPlay = true;
    this.playItem(this.playlistIndex + 1);
  }

  onBackward() {
    if (!this.playlist[this.playlistIndex - 1]) {
      return;
    }
    this.shouldPlay = true;
    this.playItem(this.playlistIndex - 1);
  }

  deleteItem(id) {
    // if (id === playlistIndex) {
    //   playItem(playlistIndex - 1);
    // }
    this.playlist.filter((item, index) => index !== id);
  }

  getDuration(source) {
    if (source !== null) {
      return this.getMMSSFromMillis(source);
    }
    return this.getMMSSFromMillis(0);
  }

  getSeekSliderPosition() {
    if (
      this.soundPlayer !== null &&
      this.soundPosition !== null &&
      this.soundDuration !== null
    ) {
      return this.soundPosition / this.soundDuration;
    }
    return 0.0;
  }

  onSeekSliderValueChange() {
    if (this.soundPlayer != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = shouldPlay;
      this.soundPlayer.pauseAsync();
    }
  }

  async onSeekSliderSlidingComplete(value) {
    if (this.soundPlayer != null) {
      this.isSeeking = false;
      const seekPosition = value * this.soundDuration;
      if (this.shouldPlayAtEndOfSeek) {
        this.soundPlayer.playFromPositionAsync(seekPosition);
      } else {
        this.soundPlayer.setPositionAsync(seekPosition);
      }
    }
  }
}

export const PlayerRecorder = new PlayRec(Audio, FileSystem);
