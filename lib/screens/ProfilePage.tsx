import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { User } from "../utils/user_class";
import PhotoScroller from "../components/photoScroller";

interface Note {
  images: any;
  id: string;
  title: string;
  text: string;
  time: string;
  creator: string;
}

const user = User.getInstance();

export default function ProfilePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [key, setKey] = useState(0);

  const fetchMessages = async () => {
    let response;
    try {
      response = await fetch(
        "http://lived-religion-dev.rerum.io/deer-lr/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "message",
            creator: user.getId(),
          }),
        }
      );

      const data = await response.json();
      setMessages(data);

      const fetchedNotes: Note[] = data.map((message: any) => {
        const time = message.__rerum.isOverwritten
          ? new Date(message.__rerum.isOverwritten)
          : new Date(message.__rerum.createdAt);
        time.setHours(time.getHours() - 5);
        return {
          id: message["@id"],
          title: message.title || "",
          text: message.BodyText || "",
          images: message.items || [],
          time:
            time.toLocaleString("en-US", { timeZone: "America/Chicago" }) || "",
          creator: message.creator || "",
        };
      });

      fetchedNotes.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      setNotes(fetchedNotes);
      setCount(fetchedNotes.length);

      let extractedImages = fetchedNotes.flatMap((note) => note.images);

      setAllImages(extractedImages.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  let role = "Administrator";
  let fieldNotes = count;
  if (user.getRoles()) {
    role = "Student";
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: "center" }}>
          <View style={styles.profileImage}>
            <Image
              source={require("../../assets/profile-pic.jpg")}
              style={styles.image}
              resizeMode="center"
            ></Image>
          </View>
          <TouchableOpacity style={styles.add}>
            <Ionicons
              name="ios-add"
              size={48}
              color="#DFD8C8"
              style={{ marginTop: 6, marginLeft: 2 }}
            ></Ionicons>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.text, { fontWeight: "200", fontSize: 36 }]}>
            {user.getName()}
          </Text>
          <Text style={[styles.text, { color: "#AEB5BC", fontSize: 14 }]}>
            {role}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsBox}>
            <Text style={[styles.text, { fontSize: 24 }]}>{fieldNotes}</Text>
            <Text style={[styles.text, styles.subText]}>Posts</Text>
          </View>
          <View
            style={[
              styles.statsBox,
              {
                borderColor: "#DFD8C8",
                borderLeftWidth: 1,
                borderRightWidth: 1,
              },
            ]}
          >
            <Text style={[styles.text, { fontSize: 24 }]}>
              {allImages.length}
            </Text>
            <Text style={[styles.text, styles.subText]}>Images</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={[styles.text, { fontSize: 24 }]}>{"< Year "}</Text>
            <Text style={[styles.text, styles.subText]}>Age</Text>
          </View>
        </View>

        <View style={{ marginTop: 32, width: "100%" }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {allImages?.map((uri, index) => (
              <View key={index}>
                <View key={index}>
                  <Image style={styles.preview} source={{ uri }} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={[styles.subText, styles.recent]}>Recent Activity</Text>
        <View style={{ alignItems: "center" }}>
          <View style={styles.recentItem}>
            <View style={styles.activityIndicator}></View>
            <View style={{ width: 250 }}>
              <Text
                style={[styles.text, { color: "#41444B", fontWeight: "300" }]}
              >
                Started following{" "}
                <Text style={{ fontWeight: "400" }}>Jake Challeahe</Text> and{" "}
                <Text style={{ fontWeight: "400" }}>Luis Poteer</Text>
              </Text>
            </View>
          </View>

          <View style={styles.recentItem}>
            <View style={styles.activityIndicator}></View>
            <View style={{ width: 250 }}>
              <Text
                style={[styles.text, { color: "#41444B", fontWeight: "300" }]}
              >
                Started following{" "}
                <Text style={{ fontWeight: "400" }}>Luke Harper</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  text: {
    fontFamily: "HelveticaNeue",
    color: "#52575D",
  },
  image: {
    flex: 1,
    height: undefined,
    width: undefined,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
  },
  add: {
    backgroundColor: "#41444B",
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    alignSelf: "center",
    alignItems: "center",
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 32,
  },
  statsBox: {
    alignItems: "center",
    flex: 1,
  },
  subText: {
    fontSize: 12,
    color: "#AEB5BC",
    textTransform: "uppercase",
    fontWeight: "500",
  },
  preview: {
    width: 200,
    height: 200,
    marginRight: 1,
  },
  recent: {
    marginLeft: 78,
    marginTop: 32,
    marginBottom: 6,
    fontSize: 10,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  activityIndicator: {
    backgroundColor: "#CABFAB",
    padding: 4,
    height: 12,
    width: 12,
    borderRadius: 6,
    marginTop: 3,
    marginRight: 20,
  },
});
