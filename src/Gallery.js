import React from "react";
import PropTypes from "prop-types";

import { Text, View, Image, ScrollView, Button } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function Gallery({ list, onDelete, styles, setShowGallery }) {
  return (
    <View style={styles.gallery}>
      <View style={styles.backButton}>
        <Button onPress={() => setShowGallery(false)} title="Back" />
      </View>
      <Text style={styles.galleryTitle}> Gallery </Text>
      <ScrollView>
        {list.map((item, index) => {
          return (
            <View key={index} style={[styles.galleryItem]}>
              <Text style={styles.imageName} numberOfLines={3}>
                {item.filename}
              </Text>
              <View style={styles.galleryCloudAndDelete}>
                {item.serverStoring && (
                  <MaterialCommunityIcons
                    name="cloud-check"
                    size={ICON_SIZE - 5}
                    color="lightgray"
                  />
                )}
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
};

export default Gallery;
