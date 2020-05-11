import React from "react";
import PropTypes from "prop-types";

import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function PlayList({
  list,
  onPlay,
  onDelete,
  styles,
  playlistIndex,
  sendFile,
  sendList,
}) {
  return (
    <View style={styles.playlist}>
      <Text style={styles.playlisttitle}>
        Record list{"  "}
        <MaterialCommunityIcons
          name="sync"
          size={ICON_SIZE - 20}
          color="black"
          onPress={() => sendList(list, "sound")}
        />
      </Text>
      <ScrollView>
        {list.map((item, index) => {
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.playlistItem,
                {
                  borderColor: index === playlistIndex ? "gray" : "black",
                  backgroundColor:
                    index === playlistIndex ? "#33a2db" : "white",
                },
              ]}
              onPress={() => onPlay(index)}
            >
              <Text>{item.recordName}</Text>
              <View style={styles.playlistItemTimeAndDelete}>
                <MaterialCommunityIcons
                  name={item.serverStoring ? "cloud-check" : "cloud-sync"}
                  size={ICON_SIZE - 15}
                  color="grey"
                  onPress={
                    item.serverStoring ? null : () => sendFile(item, "sound")
                  }
                />
                <Text>{item.duration}</Text>
                <MaterialCommunityIcons
                  name="delete-circle"
                  onPress={() => onDelete(index, item)}
                  size={ICON_SIZE - 15}
                  color="black"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
PlayList.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDelete: PropTypes.func.isRequired,
  onPlay: PropTypes.func.isRequired,
  playlistIndex: PropTypes.number,
  sendFile: PropTypes.func.isRequired,
};

export default PlayList;
