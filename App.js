import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, Dimensions } from "react-native";
import { Audio } from "expo-av";
import { Asset } from "expo-asset";
import * as Premissions from "expo-permissions";

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
  const [recordDuration, setRecordDuration] = useState(null);
  const [recordStatus, setRecordStatus] = useState(false);
  const recordButton = recordStatus ? "Stop recording." : "Start recording.";
  const [recording, setRecording] = useState(new Audio.Recording());
  const recordSwich = recordStatus ? stopRecord : startRecord;

  useEffect(() => {
    askForPremissions();
  }, [askForPremissions]);

  async function askForPremissions() {
    const { status } = await Premissions.askAsync(Premissions.AUDIO_RECORDING);
    setRecordPremission(status === "granted");
  }

  async function startRecord() {
    try {
      if (!recordPremission) {
        askForPremissions();
      }
      if (recording === null) {
        setRecording(new Audio.Recording());
      }

      setRecordStatus(true);
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      console.log("Recording Prepared");
      console.log(recording.getURI());
      recording.getURI();
      await recording.startAsync();
      console.log("Record Stared");
      // You are now recording!
    } catch (error) {
      console.log("Can`t start recording! ", error);
    }
  }

  async function stopRecord() {
    try {
      recording.stopAndUnloadAsync();
      setRecordStatus(false);
      setRecording(null);
      setRecording(new Audio.Recording());
      console.log("Recording stopped");
    } catch (error) {
      console.log("Error? cant stop recording", error);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Recorder</Text>
      <View>
        <Button onPress={() => recordSwich()} title={recordButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
