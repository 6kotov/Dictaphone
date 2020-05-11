import React, { useEffect } from "react";
import PropTypes from "prop-types";

import { Text, View, Button, BackHandler } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function SettingsList({ styles, settings, setSettings, setShowSettings }) {
  function goBack() {
    setShowSettings(false);
    return true;
  }
  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", goBack);

    return () => BackHandler.removeEventListener("hardwareBackPress", goBack);
  }, []);

  return (
    <View style={styles.settings}>
      <View style={styles.backButton}>
        <Button onPress={goBack} title="< Back" />
      </View>
      <Text style={styles.galleryTitle}> Settings </Text>
      <View style={styles.settingsList}>
        <View style={styles.settingsItem}>
          <Text>Upload new files on server</Text>
          <MaterialCommunityIcons
            name={
              settings.instatntLoading
                ? "checkbox-marked-circle-outline"
                : "checkbox-blank-circle-outline"
            }
            onPress={() =>
              setSettings({
                ...settings,
                instatntLoading: !settings.instatntLoading,
              })
            }
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
        <View style={styles.settingsItem}>
          <Text>Record quality</Text>
          <View style={styles.settingsSwich}>
            <Text>Low</Text>
            <MaterialCommunityIcons
              name={
                settings.recordQuality === "low"
                  ? "checkbox-marked-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
              onPress={() =>
                setSettings({
                  ...settings,
                  recordQuality: "low",
                })
              }
              size={ICON_SIZE - 15}
              color="black"
            />
            <Text>{"  "}High</Text>
            <MaterialCommunityIcons
              name={
                settings.recordQuality === "high"
                  ? "checkbox-marked-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
              onPress={() =>
                setSettings({
                  ...settings,
                  recordQuality: "high",
                })
              }
              size={ICON_SIZE - 15}
              color="black"
            />
          </View>
        </View>
        <View style={styles.settingsItem}>
          <Text>Setting #3</Text>
          <MaterialCommunityIcons
            name={
              settings.setting3
                ? "checkbox-marked-circle-outline"
                : "checkbox-blank-circle-outline"
            }
            onPress={() =>
              setSettings({ ...settings, setting3: !settings.setting3 })
            }
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
        <View style={styles.settingsItem}>
          <Text>Setting #4</Text>
          <MaterialCommunityIcons
            name={
              settings.setting4
                ? "checkbox-marked-circle-outline"
                : "checkbox-blank-circle-outline"
            }
            onPress={() =>
              setSettings({ ...settings, setting4: !settings.setting4 })
            }
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
      </View>
    </View>
  );
}
SettingsList.propTypes = {
  settings: PropTypes.object.isRequired,
  setSettings: PropTypes.func.isRequired,
  setShowSettings: PropTypes.func.isRequired,
};

export default SettingsList;
