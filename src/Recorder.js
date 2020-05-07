import React from "react";
import PropTypes from "prop-types";

import { Text, View, TouchableOpacity, Button } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;
const DISABLED_OPACITY = 0.5;

function Recorder({
  onRecordPressed,
  styles,
  getDuration,
  recordingDuration,
  isRecording,
  recColor,
  recognize,
  setRecognize,
}) {
  return (
    <View style={styles.recordContainer}>
      <TouchableOpacity
        onPress={onRecordPressed}
        activeOpacity={DISABLED_OPACITY}
      >
        <MaterialCommunityIcons
          name="record-rec"
          size={ICON_SIZE + 25}
          color={recColor}
        />
      </TouchableOpacity>
      {isRecording && (
        <View style={styles.RecordTimeStamp}>
          <Text style={styles.liveRecord}>LIVE</Text>
          <Text style={styles.recordTime}>
            {getDuration(recordingDuration)}
          </Text>
        </View>
      )}
      <View style={styles.recognizeToggle}>
        <Button
          color={recognize === "EN" ? "#33a2da" : "gray"}
          onPress={() => setRecognize("EN")}
          title="EN"
        />
        <Button
          color={recognize === "OFF" ? "#33a2da" : "gray"}
          onPress={() => setRecognize("OFF")}
          title="OFF"
        />
        <Button
          color={recognize === "RU" ? "#33a2da" : "gray"}
          onPress={() => setRecognize("RU")}
          title="RU"
        />
      </View>
    </View>
  );
}
Recorder.propTypes = {
  onRecordPressed: PropTypes.func.isRequired,
  getDuration: PropTypes.func.isRequired,
  recordingDuration: PropTypes.number,
  isRecording: PropTypes.bool.isRequired,
  recColor: PropTypes.string.isRequired,
  recognize: PropTypes.string.isRequired,
  setRecognize: PropTypes.func.isRequired,
};

export default Recorder;
