import React, { useState, useEffect } from "react";
import {
  Platform,
  Linking,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { User } from "../models/user_class";
import { Note } from "../../types";
import { HomeScreenProps } from "../../types";
import ApiService from "../utils/api_calls";
import DataConversion from "../utils/data_conversion";
import { SwipeListView } from "react-native-swipe-list-view";
import NoteSkeleton from "../components/noteSkeleton";
import LoadingImage from "../components/loadingImage";
import { formatToLocalDateString } from "../components/time";
import Constants from 'expo-constants'

const user = User.getInstance();

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [drawerAnimation] = useState(new Animated.Value(0));
  const [buttonAnimation] = useState(new Animated.Value(0));
  const [isPrivate, setIsPrivate] = useState(true);
  const [global, setGlobal] = useState(false);
  const [published, setPublished] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [userInitials, setUserInitials] = useState("N/A");

  useEffect(() => {
    (async () => {
      const name = await user.getName();
      if (name) {
        const initials = name
          .split(" ")
          .map((namePart) => namePart[0])
          .join("");
        setUserInitials(initials);
      }
    })();
  }, []);

  let textLength = 16;

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const refreshPage = () => {
    setUpdateCounter(updateCounter + 1);
  };

  useEffect(() => {
    if (isOpen) {
      Animated.timing(drawerAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(buttonAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const animatedStyles = {
    transform: [
      {
        translateX: drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 500],
        }),
      },
    ],
  };

  const buttonAnimatedStyles = {
    transform: [
      {
        rotate: buttonAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  useEffect(() => {
    setRendering(true);
    if (route.params?.note) {
      setNotes([...notes, route.params.note]);
    }
    fetchMessages();
  }, [route.params, updateCounter]);

  const fetchMessages = async () => {
    try {
      const userId = await user.getId(); // add await here
      const data = await ApiService.fetchMessages(
        global,
        published,
        userId || "" // use userId instead of directly using user.getId()
      );
      setMessages(data);

      const fetchedNotes = DataConversion.convertMediaTypes(data);

      if (Platform.OS === "web") {
        textLength = 50;
        setNotes(reversed ? fetchedNotes.reverse() : fetchedNotes);
      } else {
        setNotes(reversed ? fetchedNotes : fetchedNotes.reverse());
      }
      setRendering(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const updateNote = (note: Note) => {
    setNotes((prevNotes) =>
      prevNotes?.map((prevNote) => (prevNote.id === note.id ? note : prevNote))
    );
    refreshPage();
  };

  const deleteNoteFromAPI = async (id: string) => {
    try {
      const userId = await user.getId();
      const success = await ApiService.deleteNoteFromAPI(id, userId || "");
      if (success) {
        // refreshPage();
        return true;
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  };

  const handleGoWeb = () => {
    Linking.openURL(
      "http://lived-religion-dev.rerum.io/deer-lr/dashboard.html"
    );
  };

  const handleLogout = () => {
    user.logout();
  };

  const handleFilters = (name: string) => {
    if (name == "published") {
      setGlobal(false);
      setIsPrivate(false);
      setPublished(true);
      refreshPage();
    } else if (name == "global") {
      setGlobal(true);
      setIsPrivate(false);
      setPublished(false);
      refreshPage();
    } else if (name == "private") {
      setGlobal(false);
      setIsPrivate(true);
      setPublished(false);
      refreshPage();
    }
  };

  const handleReverseOrder = () => {
    setNotes(notes.reverse());
    setReversed(!reversed);
    setUpdateCounter(updateCounter + 1);
  };

  const sideMenu = (data: any, rowMap: any) => {
    return (
      <View style={styles.rowBack} key={data.index}>
        <TouchableOpacity>
          <TouchableOpacity onPress={() => publishNote(data.item.id, rowMap)}>
            <Ionicons name="earth" size={30} color="black" />
          </TouchableOpacity>
        </TouchableOpacity>
        <View style={[styles.backRightBtn, styles.backRightBtnRight]}>
          {isPrivate ? (
            <TouchableOpacity
              style={{
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                right: 20,
              }}
              onPress={() => deleteNote(data.item.id, rowMap)}
            >
              <Ionicons name="trash-outline" size={24} color="#111111" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const deleteNote = (data: any, rowMap: any) => {
    if (rowMap[data]) {
      rowMap[data].closeRow();
    }
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== data));
    deleteNoteFromAPI(data);
  };

  async function publishNote(data: any, rowMap: any) {
    if (rowMap[data]) {
      rowMap[data].closeRow();
    }
    const foundNote = notes.find((note) => note.id === data);
    const editedNote: Note = {
      id: foundNote?.id || "",
      title: foundNote?.title || "",
      text: foundNote?.text || "",
      creator: foundNote?.creator || "",
      media: foundNote?.media || [],
      latitude: foundNote?.latitude || "",
      longitude: foundNote?.longitude || "",
      audio: foundNote?.audio || [],
      published: !foundNote?.published || false,
      time: foundNote?.time || new Date(),
      tags: foundNote?.tags || [],
    };
    await ApiService.overwriteNote(editedNote);
    refreshPage();
  }

  const renderList = (notes: Note[]) => {
    return isPrivate ? (
      <SwipeListView
        data={notes}
        renderItem={renderItem}
        renderHiddenItem={sideMenu}
        leftActivationValue={160}
        rightActivationValue={-160}
        leftOpenValue={75}
        rightOpenValue={-75}
        stopLeftSwipe={175}
        stopRightSwipe={-175}
        keyExtractor={(item) => item.id}
        onRightAction={(data, rowMap) => deleteNote(data, rowMap)}
        onLeftAction={(data, rowMap) => publishNote(data, rowMap)}
      />
    ) : (
      <SwipeListView
        data={notes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    );
  };

  const renderItem = (data: any) => {
    const item = data.item;
    const tempTime = new Date(item.time);
    const showTime = formatToLocalDateString(tempTime);
    const mediaItem = item.media[0];
    const ImageType = mediaItem?.getType();
    let ImageURI = "";
    let IsImage = false;
    if (ImageType === "image") {
      ImageURI = mediaItem.getUri();
      IsImage = true;
    } else if (ImageType === "video") {
      ImageURI = mediaItem.getThumbnail();
      IsImage = true;
    }
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={1}
        style={styles.noteContainer}
        onPress={() =>
          navigation.navigate("EditNote", {
            note: item,
            onSave: (editedNote: Note) => {
              updateNote(editedNote);
              refreshPage();
            },
          })
        }
      >
        <View style={{ flexDirection: "row" }}>
          {IsImage ? (
            <View style={{ alignSelf: "center", height: 100, width: 100 }}>
              <LoadingImage
                imageURI={ImageURI}
                type={ImageType}
                isImage={true}
              />
            </View>
          ) : (
            <View style={{ alignSelf: "center", height: 100, width: 100 }}>
              <LoadingImage imageURI={""} type={ImageType} isImage={false} />
            </View>
          )}

          <View
            style={{ alignSelf: "center", position: "absolute", left: 120 }}
          >
            <Text style={styles.noteTitle}>
              {item.title.length > textLength
                ? item.title.slice(0, textLength) + "..."
                : item.title}
            </Text>

            <Text style={styles.noteText}>{showTime}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            right: 10,
          }}
        >
          {item.published ? (
            <Ionicons name="earth" size={24} color="#111111" />
          ) : (
            <Ionicons name="earth-outline" size={24} color="#111111" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleDrawer}
        style={[styles.overlay, { display: !isOpen ? "flex" : "none" }]}
      />
      <Animated.View style={[styles.drawer, animatedStyles]}>
        <Animated.View style={[buttonAnimatedStyles]}>
          <TouchableOpacity style={styles.backButton} onPress={toggleDrawer}>
            <Ionicons
              name={isOpen ? "chevron-back-outline" : "chevron-forward-outline"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name={"person-outline"} size={30} color="black" />
          <Text style={styles.mediumText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name={"people-outline"} size={30} color="black" />
          <Text style={styles.mediumText}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={handleGoWeb}>
          <Ionicons name={"laptop-outline"} size={30} color="black" />
          <Text style={styles.mediumText}>Our Website</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name={"settings-outline"} size={30} color="black" />
          <Text style={styles.mediumText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name={"bug-outline"} size={30} color="black" />
          <Text style={styles.mediumText}>Report a Bug</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <Ionicons name={"log-out-outline"} size={30} color="white" />
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.topView}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.userPhoto}>
            <Text
              style={{ fontWeight: "600", fontSize: 20, alignSelf: "center" }}
            >
              {userInitials}
            </Text>
          </View>
          <Text style={styles.title}>Field Notes</Text>
        </View>
        <TouchableOpacity onPress={toggleDrawer} style={[styles.menuButton]}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.filtersContainer}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        <TouchableOpacity
          onPress={() => handleFilters("private")}
          style={isPrivate ? styles.filtersSelected : styles.filters}
        >
          <Text style={isPrivate ? styles.selectedFont : styles.filterFont}>
            {rendering
              ? "Private"
              : isPrivate
              ? `Private (${notes.length})`
              : "Private"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleFilters("published")}
          style={published ? styles.filtersSelected : styles.filters}
        >
          <Text style={published ? styles.selectedFont : styles.filterFont}>
            {rendering
              ? "Published"
              : published
              ? `Published (${notes.length})`
              : "Published"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilters("global")}
          style={global ? styles.filtersSelected : styles.filters}
        >
          <Text style={global ? styles.selectedFont : styles.filterFont}>
            {rendering
              ? "Global"
              : global
              ? `Global (${notes.length})`
              : "Global"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReverseOrder} style={styles.filters}>
          <Text style={styles.filterFont}>Sort by Time</Text>
        </TouchableOpacity>
      </ScrollView>
      {rendering ? <NoteSkeleton /> : renderList(notes)}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddNote", { refreshPage })}
      >
        <Ionicons name="add-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight - 10,
    flex: 1,
  },
  overlay: {
    position: "absolute",
    width: "150%",
    height: "150%",
    flex: 1,
    zIndex: 80,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    paddingTop: Constants.statusBarHeight - 10,
    height: "110%",
    width: 200,
    position: "absolute",
    backgroundColor: "white",
    zIndex: 99,
    right: 0,
  },
  drawerItem: {
    paddingLeft: 10,
    paddingTop: 10,
    flexDirection: "row",
  },
  logout: {
    flexDirection: "row",
    position: "absolute",
    bottom: "10%",
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginLeft: "10%",
    width: "80%",
    borderRadius: 20,
  },
  logoutText: {
    marginLeft: 5,
    marginRight: 10,
    fontSize: 20,
    fontWeight: "600",
    maxWidth: "100%",
    color: "white",
  },
  backButton: {
    margin: "7%",
    backgroundColor: "#111111",
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  userPhoto: {
    backgroundColor: "#F4DFCD",
    height: 50,
    width: 50,
    borderRadius: 50,
    alignContent: "center",
    justifyContent: "center",
  },
  mediumText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "600",
    maxWidth: "100%",
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: "600",
    maxWidth: "100%",
    flexShrink: 1,
  },
  noteBox: {
    width: "100%",
    flexDirection: "column",
    flexWrap: "wrap",
  },
  noteText: {
    marginTop: 10,
    fontSize: 18,
  },
  noteTextBox: {
    width: "60%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 22,
    fontSize: 28,
    color: "#bbb",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#111111",
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  topView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  menuButton: {
    backgroundColor: "#111111",
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  noteContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 10,
    width: "98%",
    padding: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    height: 120,
  },
  filtersContainer: {
    minHeight: 30,
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 5,
    maxHeight: 30,
    marginBottom: 17,
    zIndex: 10,
  },
  filters: {
    justifyContent: "center",
    borderColor: "#F4DFCD",
    borderWidth: 2,
    borderRadius: 30,
    marginRight: 10,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  filtersSelected: {
    justifyContent: "center",
    backgroundColor: "#C7EBB3",
    fontSize: 22,
    borderRadius: 30,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  selectedFont: {
    fontSize: 17,
    color: "#111111",
    fontWeight: "700",
  },
  filterFont: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    lineHeight: 80,
    color: "#111111",
    marginLeft: 5,
    marginBottom: "-1%",
  },
  pfp: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginLeft: 3,
    marginTop: 3,
  },
  backRightBtn: {
    alignItems: "flex-end",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 75,
    paddingRight: 17,
  },
  backRightBtnLeft: {
    backgroundColor: "#1f65ff",
    right: 50,
  },
  backRightBtnRight: {
    backgroundColor: "red",
    width: "52%",
    right: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#C7EBB3",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 15,
    margin: 5,
    marginBottom: 15,
    borderRadius: 20,
  },
});

export default HomeScreen;
