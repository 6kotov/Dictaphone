import React from "react";
import PropTypes from "prop-types";

import { Text, View, Button } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
const ICON_SIZE = 40;

function SettingsList({ styles, settings, setSettings, setShowSettings }) {
  return (
    <View style={styles.settings}>
      <View style={styles.backButton}>
        <Button onPress={() => setShowSettings(false)} title="Back" />
      </View>
      <Text style={styles.galleryTitle}> Settings </Text>
      <View style={styles.settingsList}>
        <View style={styles.settingsItem}>
          <Text>Setting #1</Text>
          <MaterialCommunityIcons
            name={
              settings.setting1
                ? "checkbox-blank-circle-outline"
                : "checkbox-marked-circle-outline"
            }
            onPress={() =>
              setSettings({ ...settings, setting1: !settings.setting1 })
            }
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
        <View style={styles.settingsItem}>
          <Text>Setting #2</Text>
          <MaterialCommunityIcons
            name={
              settings.setting2
                ? "checkbox-blank-circle-outline"
                : "checkbox-marked-circle-outline"
            }
            onPress={() =>
              setSettings({ ...settings, setting2: !settings.setting2 })
            }
            size={ICON_SIZE - 15}
            color="black"
          />
        </View>
        <View style={styles.settingsItem}>
          <Text>Setting #3</Text>
          <MaterialCommunityIcons
            name={
              settings.setting3
                ? "checkbox-blank-circle-outline"
                : "checkbox-marked-circle-outline"
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
                ? "checkbox-blank-circle-outline"
                : "checkbox-marked-circle-outline"
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
