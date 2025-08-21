import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AppDescriptionModal = ({ visible, onToggle }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onToggle}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalView,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.contentWrapper}>
            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.logoContainer}>
                <Image source={require('./VERBIFY.png')} style={styles.logo} />
              </View>

              <Text style={styles.modalTitle}>APP DESCRIPTION</Text>

              <Text style={styles.modalText}>
                This is an <Text style={styles.bold}>effective trainer and tool</Text> for those who are already studying Hebrew,
                have <Text style={styles.bold}>basic knowledge</Text>, want to
                <Text style={styles.bold}> learn to conjugate verbs quickly and correctly</Text> or <Text style={styles.bold}>improve this skill</Text>.
                The application is also useful for <Text style={styles.bold}>beginners</Text>, as it includes exercises
                for <Text style={styles.bold}>memorizing verbs</Text>, their forms, <Text style={styles.bold}>binyanim</Text> and
                <Text style={styles.bold}> practicing the use of the imperative mood</Text>.
              </Text>

              <Text style={styles.modalTitle}>MAIN EXERCISES</Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Verb conjugation is a key part of the application.</Text>
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Exercises 5 and 6 -</Text> practice conjugation regularly until it's automatic.
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Exercises 7 and 8 -</Text> advanced versions of 5 and 6.
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Tip:</Text> master 5 and 6 before moving to 7 and 8.
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Basic learning exercises:</Text>
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Exercises 1 and 2 -</Text> help memorize about 300 key verbs.
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Exercise 3 -</Text> practice identifying the binyan (basic knowledge needed).
              </Text>
              <Text style={styles.listItem}>
                <Text style={styles.bold}>• Exercise 4 -</Text> trainer for the imperative mood in Hebrew.
              </Text>

              <Text style={styles.finalText}>
                <Text style={styles.bold}>
                  Constant exercise lays a solid foundation for the correct use of verbs in everyday speech!
                </Text>
              </Text>
            </ScrollView>

            {/* Fixed Close Button */}
            <View style={styles.buttonWrapper}>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle}>Close</Text>
  </TouchableOpacity>
</View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollArea: {
    flex: 1,
    marginTop: 20,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 5,
  },
  finalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  bold: {
    fontWeight: 'bold',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2D4769',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%', // или сколько нужно
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppDescriptionModal;
