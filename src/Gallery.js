import React, { useEffect } from "react";
import PropTypes from "prop-types";

import {
  Text,
  View,
  Image,
  ScrollView,
  Button,
  BackHandler,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function Gallery({
  list,
  onDelete,
  styles,
  setShowGallery,
  sendFile,
  sendList,
}) {
  function goBack() {
    setShowGallery(false);
    return true;
  }
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      goBack
    );

    return () => backHandler.remove();
  }, []);
  return (
    <View style={styles.gallery}>
      <View style={styles.backButton}>
        <Button onPress={goBack} title="< Back" />
      </View>
      <Text style={styles.galleryTitle}>
        {" "}
        Gallery{"  "}
        <MaterialCommunityIcons
          name="sync"
          size={ICON_SIZE - 20}
          color="black"
          onPress={() => sendList(list, "image")}
        />
      </Text>
      <ScrollView>
        {list.map((item, index) => {
          return (
            <View key={index} style={[styles.galleryItem]}>
              <Text style={styles.imageName} numberOfLines={3}>
                {item.filename}
              </Text>
              <View style={styles.galleryCloudAndDelete}>
                <MaterialCommunityIcons
                  name={item.serverStoring ? "cloud-check" : "cloud-sync"}
                  size={ICON_SIZE - 5}
                  color="grey"
                  onPress={
                    item.serverStoring ? null : () => sendFile(item, "image")
                  }
                />

                <MaterialCommunityIcons
                  name="delete-circle"
                  onPress={() => onDelete(item)}
                  size={ICON_SIZE - 5}
                  color="black"
                />
              </View>
              <Image
                style={styles.imagePrewiewList}
                source={{ uri: item.uri }}
                resizeMethod="scale"
                resizeMode="contain"
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
Gallery.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDelete: PropTypes.func.isRequired,
  setShowGallery: PropTypes.func.isRequired,
  sendFile: PropTypes.func.isRequired,
};

export default Gallery;
