import React from "react";
import PropTypes from "prop-types";

import { Text, View, Dimensions, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function PlayList({ list, onPlay, onDelete, styles, playlistIndex }) {
  return list.map((item, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.playlistItem,
          {
            borderColor: index === playlistIndex ? "gray" : "black",
            backgroundColor: index === playlistIndex ? "lightgray" : "white",
          },
        ]}
        onPress={() => onPlay(index)}
      >
        <Text>{item.recordName}</Text>
        <View style={styles.playlistItemTimeAndDelete}>
          <Text>{item.duration}</Text>
          <MaterialCommunityIcons
            name="delete-forever"
            onPress={() => onDelete(index, item)}
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
      </TouchableOpacity>
    );
  });
}
PlayList.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDelete: PropTypes.func.isRequired,
  onPlay: PropTypes.func.isRequired,
};

export default PlayList;
