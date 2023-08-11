import React, { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Placeholder, PlaceholderMedia, Progressive } from "rn-placeholder";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

interface LoadingImageProps {
  imageURI: string;
  type: string;
  isImage: boolean;
}

export default function LoadingImage({
  imageURI,
  type,
  isImage,
}: LoadingImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleSaveMedia = async () => {
    try {
      const fileName = imageURI.replace(/^.*[\\\/]/, "");
      const imageFullPathInLocalStorage =
        FileSystem.documentDirectory + fileName;

      FileSystem.downloadAsync(imageURI, imageFullPathInLocalStorage).then(
        async ({ uri }) => {
          await MediaLibrary.saveToLibraryAsync(imageFullPathInLocalStorage);
        }
      );
    } catch (error) {
      console.error("Error saving media:", error);
    }
  };

  if (isImage && imageURI !== "") {
    return (
      <View>
        {isLoading && (
          <Placeholder
            Animation={Progressive}
            Left={() => (
              <PlaceholderMedia
                size={100}
                style={{ borderRadius: 10, marginRight: 20 }}
              />
            )}
          />
        )}
        {type === "video" ? (
          <View>
            <Image
              style={styles.preview}
              source={{ uri: imageURI }}
              onLoadEnd={() => setIsLoading(false)}
            />
            <View style={styles.playUnderlay}>
              <Ionicons
                name="play-outline"
                size={24}
                color="#dfe5e8"
                style={styles.icon}
              />
            </View>
          </View>
        ) : (
          <View>
            <Image
              style={styles.preview}
              source={{ uri: imageURI }}
              onLoadEnd={() => setIsLoading(false)}
            />
          </View>
        )}
      </View>
    );
  } else {
    return (
      <View>
        {isLoading && (
          <Placeholder
            Animation={Progressive}
            Left={() => (
              <PlaceholderMedia
                size={100}
                style={{ borderRadius: 10, marginRight: 20 }}
              />
            )}
          />
        )}
        <Image
          style={styles.preview}
          source={require("./public/noPreview.png")}
          onLoadEnd={() => setIsLoading(false)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  preview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: "10%",
    alignContent: "center",
    alignSelf: "center",
  },
  icon: {
    position: "absolute",
    alignSelf: "center",
    marginLeft: 10,
    marginTop: 2,
  },
  playUnderlay: {
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: "rgba(5,5,5,0.5)",
    position: "absolute",
    right: 40,
    bottom: 36,
  },
});
