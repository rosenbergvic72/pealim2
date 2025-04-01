import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatistics } from './stat';
import LottieView from 'lottie-react-native';

const StatModal2Am = ({ visible, onToggle }) => {
  const [stats, setStats] = useState(null);
  const [name, setName] = useState('');
  const viewRef = useRef();
  const [animationFinished, setAnimationFinished] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const fetchStats = async () => {
        const exerciseId = 'exercise2Am'; // Ensure you use the correct exercise ID
        const retrievedStats = await getStatistics(exerciseId);
        setStats(retrievedStats);

        const storedName = await AsyncStorage.getItem('name');
        if (storedName) {
          setName(storedName);
        }
      };

      fetchStats();
    } else {
      setAnimationFinished(false); // Reset animation state when the modal is closed
      contentOpacity.setValue(0); // Reset the opacity when the modal is closed
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'ስታቲስቲክስ መልመጃ',
        mimeType: 'image/png',
      });
    } catch (error) {
      console.error('Error sharing the screenshot:', error);
    }
  };

  const handleAnimationFinish = () => {
    setAnimationFinished(true);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView} ref={viewRef}>
          {!animationFinished && (
            <LottieView
              source={require('./assets/Animation - 1718461626409.json')}
              autoPlay
              loop={false}
              onAnimationFinish={handleAnimationFinish}
              style={styles.lottie}
            />
          )}
          <Animated.View style={{ opacity: animationFinished ? contentOpacity : 0 }}>
            <View style={styles.headerContainer}>
              <Image
                source={require('./VERBIFY.png')}
                style={styles.image}
              />
              <Text style={styles.greeting} maxFontSizeMultiplier={1.2}>
                {name},
              </Text>
            </View>

            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>ስታቲስቲክስ ለሁለተኛው ልምምድ</Text>
            {stats ? (
              <View style={styles.statsContainer}>
                <View style={styles.row}>
                  <Text style={styles.label} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ</Text>
                  <Text style={styles.number} maxFontSizeMultiplier={1.2}>{stats.timesCompleted}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label} maxFontSizeMultiplier={1.2}>ምርጥ ውጤት, %</Text>
                  <Text style={styles.number} maxFontSizeMultiplier={1.2}>{stats && stats.bestScore ? parseFloat(stats.bestScore).toFixed(2) : 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label} maxFontSizeMultiplier={1.2}>አማካኝ ውጤት, %</Text>
                  <Text style={styles.number} maxFontSizeMultiplier={1.2}>{stats.averageCompletionRate.toFixed(2)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.statsText} maxFontSizeMultiplier={1.2}>ምንም ስታቲስቲክስ አልተገኘም</Text>
            )}
            <TouchableOpacity
              style={[styles.button, styles.centeredButton]}
              onPress={onToggle}
            >
              <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>ዝጋ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Image source={require('./share4.png')} style={styles.shareIcon} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );

};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 25,
    backgroundColor: '#FFF0E4',
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lottie: {
    width: '100%',
    height: 300,
    position: 'absolute',
    top: '45%',
    transform: [{ translateY: -100 }],
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
  },
  image: {
    width: 100,
    height: 100,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D4769',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 14,
    fontWeight: 'bold',
    textAlign: "center",
    fontSize: 15,
    color: '#2D4769',
  },

  statsText: {
    marginBottom: 14,
    fontWeight: 'bold',
    textAlign: "center",
    fontSize: 15,
    color: '#2D4769',
  },

  statsContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#E7EAF4',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    height: 50,
  },
  label: {
    fontSize: 13,
    textAlign: "left",
    width: '75%',
    fontWeight: 'bold',
    color: '#2B3270',
  },
  number: {
    fontSize: 16,
    color: 'white',
    width: '25%',
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
    backgroundColor: "#2D4769",
    padding: 6,
    borderRadius: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%', // Added to center the button
  },
  button: {
    backgroundColor: "#2D4769",
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '50%',
    alignItems: 'center',
    marginTop: 10,
  },
  centeredButton: {
    alignSelf: 'center', // Center the button horizontally
  },
  shareButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  shareIcon: {
    width: 46,
    height: 46,
    // marginTop: 5,
  },
});

export default StatModal2Am;
