import React, { useState, useEffect, memo, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Note } from "../../../types";
import RenderHTML from "react-native-render-html";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  note?: Note;
}

const NoteDetailModal: React.FC<Props> = memo(({ isVisible, onClose, note }) => {
  const [isImageTouched, setImageTouched] = useState(false);
  const [isTextTouched, setTextTouched] = useState(true);
  const [creatorName, setCreatorName] = useState('');
  const {height, width} = useWindowDimensions();
  
  useEffect(() => {
    setTextTouched(true);
    if (note?.creator) {
      fetch(note.creator)
        .then((response) => response.json())
        .then((data) => {
          if (data.name) {
            setCreatorName(data.name);
          }
        })
        .catch((err) => console.error("Error fetching creator: ", err));
    }
  }, [note]);
  

  const handleImageTouchStart = () => {
    setImageTouched(true);
    setTextTouched(false);
  };

  const handleTextTouchStart = () => {
    setTextTouched(true);
    setImageTouched(false);
  };

  // Declare a new state variable for image loading
  const [imageLoadedState, setImageLoadedState] = useState<{
    [key: string]: boolean;
  }>({});

  const images: string = useMemo(() => {
    if (note?.images) {
      return note.images.filter(
        (mediaItem: any) => mediaItem.uri.endsWith(".jpg") || mediaItem.uri.endsWith(".png")
      );
    }
    return [];
  }, [note]);

  const handleLoad = (uri: string) => {
    setImageLoadedState((prev) => ({ ...prev, [uri]: true }));
  };
  let newNote = false;
  if (note?.description && note.description.includes('<div>')) {
    newNote = true;
  }
  
  const html = note?.description;
  
  const htmlSource = useMemo(() => {
    return { html };
  }, [html]);

  const MemoizedRenderHtml = React.memo(RenderHTML);
  
  return (
    <Modal animationType="slide" transparent={false} visible={isVisible}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <View style={styles.closeIcon}>
          <Ionicons name="close" size={30} color="#000" />
        </View>
      </TouchableOpacity>

      <ScrollView
        style={{ height: isImageTouched ? "80%" : "50%" }}
        onTouchStart={images.length > 2 ? handleImageTouchStart : undefined}
      >
        {images && images.length > 0 ? (
          images.map((image, index) => {
            return (
              <View key={index} style={styles.imageContainer}>
                {!imageLoadedState[image.uri] && (
                  <ActivityIndicator size="large" color="#0000ff" />
                )}
                <Image
                  source={{ uri: image.uri }}
                  style={styles.image}
                  onLoad={() => handleLoad(image.uri)}
                />
              </View>
            );
          })
        ) : (
          <Text style={{ alignSelf: "center", justifyContent: "center", marginTop: 200 }}>
            No images
          </Text>
        )}
        <View style={{ height: 250 }}></View>
      </ScrollView>
      <View
        style={[
          styles.textContainer,
          {
            height: isTextTouched ? "60%" : "30%",
          },
        ]}
        onTouchStart={handleTextTouchStart}
      >
        <ScrollView>
          <Text style={styles.modalTitle}>{note?.title}</Text>
          <View style={styles.metaDataContainer}>
  <View style={styles.creatorContainer}>
    <Ionicons name="person-circle-outline" size={18} color="#555" />
    <Text style={styles.creatorText}>{creatorName}</Text>
  </View>
  <View style={styles.dateContainer}>
    <Ionicons name="calendar-outline" size={18} color="#555" />
    <Text style={styles.dateText}>{note?.time}</Text>
  </View>
</View>
          <View
            style={{
              height: 2,
              width: "100%",
              backgroundColor: "black",
              marginBottom: 10,
            }}
          ></View>
          {newNote ? (<MemoizedRenderHtml baseStyle={{color: '#666'}} contentWidth={width} source={ htmlSource } />
          ) : (
            <Text style={styles.modalText}>{note?.description}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});

export default NoteDetailModal;

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
    borderRadius: 25,
  },
  closeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    padding: 10,
    paddingLeft: 15, // Indentation for the body text
    backgroundColor: "#fafafa",
    borderTopColor: "#e0e0e0",
    borderTopWidth: 2,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginLeft: 15, // Less indent for title
    marginBottom: 8,
    color: "#2c3e50",
  },
  modalText: {
    fontSize: 18,
    lineHeight: 24,
    marginLeft: 15, // Uniform indentation for other texts
    color: "#34495e",
  },
  metaDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorIcon: {
    fontSize: 16,
    color: "#555",
  },
  creatorText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 16,
    color: "#555",
  },
  dateText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    color: "#555",
  },
  timeText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 5,
  },  
  imageContainer: {
    width: "100%",
    height: 360,
    marginBottom: 2,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  separator: { // Divider line style
    height: 1,
    width: "90%",
    backgroundColor: "#e0e0e0",
    marginLeft: "5%",
    marginRight: "5%",
    marginBottom: 20,
  },
});
