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
const ICON_SIZE = 40;

export default function Playlist() {
  const {
    playItem,
    deleteItem,
    playlist,
    playlistIndex,
    // MaterialCommunityIcons,
  } = useContext(Context);
  return (
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
            <Text>{item.duration}</Text>
            <MaterialCommunityIcons
              name="delete-forever"
              onPress={() => deleteItem(index)}
              size={ICON_SIZE - 15}
              color="black"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
