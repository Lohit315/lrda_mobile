import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import NoteDetailModal from "./NoteDetailModal";
import { formatToLocalDateString } from "../../components/time";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { mapDarkStyle, mapStandardStyle } from "./mapData";
import ApiService from "../../utils/api_calls";
import { useTheme } from "@react-navigation/native";
import Constants from 'expo-constants'

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 220;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const ExploreScreen = () => {
  const theme = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [globeIcon, setGlobeIcon] = useState("earth-outline");
  const [searchQuery, setSearchQuery] = useState('');

  const onViewNote = (note) => {
    setSelectedNote(note);
    setModalVisible(true);
  };

  const [searchResults, setSearchResults] = useState(null);

  const searchForMessages = useCallback(async () => {
    console.log("Searching for messages: ", searchQuery);
    const searchResults = await ApiService.searchMessages(searchQuery);
  
    if (searchResults && searchResults.length > 0) {
      const firstResult = searchResults[0];
      const latitude = parseFloat(firstResult.latitude) || 0;
      const longitude = parseFloat(firstResult.longitude) || 0;
  
      const newRegion = {
        ...state.region,
        latitude,
        longitude
      };
      setState(prevState => ({
        ...prevState,
        region: newRegion
      }));
  
      _map.current.animateToRegion(newRegion, 350);
    }
    setSearchResults(searchResults);
  });
  
  const fetchMessages = useCallback(async () => {
    try {
      const fetchedNotes = searchResults ? searchResults : await ApiService.fetchMessages(
        globeIcon === "earth",
        globeIcon !== "earth",
        "someUserId"
      );
      // console.log("Notes being used: ", fetchedNotes);

      const fetchedMarkers = fetchedNotes.map((note) => {
        let time;
        if (note.time === undefined) {
          time = new Date(note.__rerum.createdAt);
          var date = new Date();
          var offsetInHours = date.getTimezoneOffset() / 60;
          time.setHours(time.getHours() - offsetInHours);
        } else {
          time = new Date(note.time);
        }

        return {
          coordinate: {
            latitude: parseFloat(note.latitude) || 0,
            longitude: parseFloat(note.longitude) || 0,
          },
          creator: note.creator || "",
          createdAt: note.__rerum.createdAt || "",
          title: note.title || "",
          description: note.BodyText || "",
          images:
            note.media.map((mediaItem) => ({ uri: mediaItem.uri })) ||
            require("../../../assets/map_marker.png"), // need to replace with placeholder image
          time: formatToLocalDateString(time) || "",
        };
      });

      setState((prevState) => ({
        ...prevState,
        markers: fetchedMarkers,
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  });

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

const [state, setState] = useState({
  markers: [],
  categories: [
    {
      name: "Events",
      icon: (
        <MaterialCommunityIcons
          style={styles.chipsIcon}
          name="calendar-multiple"
          size={18}
        />
      ),
    },
    {
      name: "Cultural",
      icon: (
        <Ionicons
          name="ios-globe-outline"
          style={styles.chipsIcon}
          size={18}
        />
      ),
    },
    {
      name: "History",
      icon: <Ionicons name="md-time" style={styles.chipsIcon} size={18} />,
    },
    {
      name: "Modern",
      icon: (
        <MaterialCommunityIcons
          name="city-variant-outline"
          style={styles.chipsIcon}
          size={18}
        />
      ),
    },
    {
      name: "Religious",
      icon: (
        <MaterialCommunityIcons
          name="church"
          style={styles.chipsIcon}
          size={15}
        />
      ),
    },
  ],
  region: {
    latitude: 38.631393,
    longitude: -90.192226,
    latitudeDelta: 0.04864195044303443,
    longitudeDelta: 0.040142817690068,
  },
});

  let mapIndex = 0;
  let mapAnimation = new Animated.Value(0);

  useEffect(() => {
    mapAnimation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
      if (index >= state.markers.length) {
        index = state.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(regionTimeout);

      const regionTimeout = setTimeout(() => {
        if (mapIndex !== index) {
          mapIndex = index;
          const { coordinate } = state.markers[index];
          _map.current.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: state.region.latitudeDelta,
              longitudeDelta: state.region.longitudeDelta,
            },
            350
          );
        }
      }, 10);
    });
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      if (isMounted) {
        setState(prevState => ({
          ...prevState,
          region: {
            latitude,
            longitude,
            latitudeDelta: 0.04864195044303443,
            longitudeDelta: 0.040142817690068,
          }
        }));
      }
    })();

    return () => isMounted = false;
  }, []);

  const interpolations = state.markers.map((marker, index) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = mapAnimation.interpolate({
      inputRange,
      outputRange: [1, 1.5, 1],
      extrapolate: "clamp",
    });

    return { scale };
  });

  const onMarkerPress = (mapEventData) => {
    const markerID = mapEventData._targetInst.return.key;

    let x = markerID * CARD_WIDTH + markerID * 20;
    if (Platform.OS === "ios") {
      x = x - SPACING_FOR_CARD_INSET;
    }

    _scrollView.current.scrollTo({ x: x, y: 0, animated: true });
  };

  const _map = useRef(null);
  const _scrollView = useRef(null);

  return (
    <View style={styles.container}>
      <MapView
        ref={_map}
        initialRegion={state.region}
        style={styles.container}
        provider={PROVIDER_GOOGLE}
        customMapStyle={theme.dark ? mapDarkStyle : mapStandardStyle}
      >
        {state.markers.map((marker, index) => {
          const scaleStyle = {
            transform: [
              {
                scale: interpolations[index].scale,
              },
            ],
          };
          return (
            <MapView.Marker
              key={index}
              coordinate={marker.coordinate}
              onPress={(e) => onMarkerPress(e)}
            >
              <Animated.View style={[styles.markerWrap]}>
                <Animated.Image
                  source={require("../../../assets/marker.png")}
                  style={[styles.marker, scaleStyle]}
                  resizeMode="cover"
                />
              </Animated.View>
            </MapView.Marker>
          );
        })}
      </MapView>
      <View style={styles.searchBox}>
      <TouchableOpacity onPress={() => {
          setGlobeIcon(prevIcon => (prevIcon === "earth-outline" ? "earth" : "earth-outline"));
          setSearchResults(null); 
      }}>
          <Ionicons 
              name={globeIcon} 
              size={25} 
              color={globeIcon === "earth" ? "#008080" : "#000"} 
              style={{ marginRight: 9 }} 
          />
      </TouchableOpacity>
      <TextInput
          returnKeyType="done"
          placeholder="Search here"
          placeholderTextColor="#000"
          autoCapitalize="none"
          style={{ flex: 1, padding: 0 }}
          onChangeText={setSearchQuery}
      />
      <Ionicons name="ios-search" size={25} onPress={searchForMessages} />
    </View>

      {/* <ScrollView
        horizontal
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        height={50}
        style={styles.chipsScrollView}
        contentInset={{
          // iOS only
          top: 0,
          left: 0,
          bottom: 0,
          right: 20,
        }}
        contentContainerStyle={{
          paddingRight: Platform.OS === "android" ? 20 : 0,
        }}
      >
        {state.categories.map((category, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.chipsItem}
      onPress={() => {
        if (category.name === 'Events') {
          fetchMessages();
        }
      }}
    >
      {category.icon}
      <Text>{category.name}</Text>
    </TouchableOpacity>
  ))}
      </ScrollView> */}
      <Animated.ScrollView
        ref={_scrollView}
        horizontal
        pagingEnabled
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 20}
        snapToAlignment="center"
        style={styles.scrollView}
        contentInset={{
          top: 0,
          left: SPACING_FOR_CARD_INSET,
          bottom: 0,
          right: SPACING_FOR_CARD_INSET,
        }}
        contentContainerStyle={{
          paddingHorizontal:
            Platform.OS === "android" ? SPACING_FOR_CARD_INSET : 0,
        }}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  x: mapAnimation,
                },
              },
            },
          ],
          { useNativeDriver: true }
        )}
      >
        {state.markers.map((marker, index) => (
  <View style={styles.card} key={index}>
    {marker.images[0] && (
      <Image
        source={marker.images[0]}
        style={styles.cardImage}
        resizeMode="cover"
      />
    )}
    <View style={styles.textContent}>
      <Text numberOfLines={1} style={styles.cardtitle}>
        {marker.title}
      </Text>
      <Text numberOfLines={1} style={styles.cardDescription}>
        {marker.description.replace(/<[^>]+>/g, '').substring(0, 200).trim()}
      </Text>
      <View style={styles.button}>
        <TouchableOpacity
          onPress={() => onViewNote(marker)}
          style={[
            styles.signIn,
            {
              borderColor: "#000000",
              borderWidth: 1,
              borderRadius: 15,
            },
          ]}
        >
          <Text
            style={[
              styles.textSign,
              {
                color: "#111111",
              },
            ]}
          >
            View Note
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
))}

      </Animated.ScrollView>
      <NoteDetailModal 
      isVisible={isModalVisible} 
      onClose={() => setModalVisible(false)} 
      note={selectedNote} 
    />
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    position: "absolute",
    marginTop: Constants.statusBarHeight,
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "90%",
    alignSelf: "center",
    borderRadius: 5,
    padding: 10,
    shadowColor: "#ccc",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  chipsScrollView: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 80,
    paddingHorizontal: 10,
  },
  chipsIcon: {
    marginRight: 5,
  },
  chipsItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    height: 35,
    shadowColor: "#ccc",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  endPadding: {
    paddingRight: width - CARD_WIDTH,
  },
  card: {
    // padding: 10,
    elevation: 2,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: -2 },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: "hidden",
  },
  cardImage: {
    flex: 3,
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  textContent: {
    flex: 2,
    padding: 10,
  },
  cardtitle: {
    fontSize: 12,
    // marginTop: 5,
    fontWeight: "bold",
  },
  cardDescription: {
    fontSize: 12,
    color: "#444",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  marker: {
    width: 30,
    height: 30,
  },
  button: {
    alignItems: "center",
    marginTop: 5,
  },
  signIn: {
    width: "100%",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
  },
  textSign: {
    fontSize: 14,
    fontWeight: "bold",
  },
});