import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Context from "../Context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const DISABLED_OPACITY = 0.5;
const ICON_SIZE = 40;

export default function Recorder() {
  const {
    onRecordPressed,
    // MaterialCommunityIcons,
    recColor,
    isRecording,
    recordingDuration,
    getDuration,
  } = useContext(Context);
  return (
    <View style={styles.recordContainer}>
      <TouchableOpacity
        onPress={onRecordPressed.bind(null)}
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
        <Text style={styles.recordTime}>{getDuration(recordingDuration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
