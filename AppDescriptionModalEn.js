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

              {/* Title */}
<Text style={styles.modalTitle}>APP DESCRIPTION</Text>

<Text style={styles.modalText}>
  Verbify is a{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    practical trainer and learning tool for Hebrew verbs
  </Text>
  . It helps you memorize verbs, understand binyanim, practise conjugation,
  learn verb-preposition combinations, and use verbs correctly in sentences.
</Text>

<Text style={styles.modalText}>
  The app is suitable both for learners who already have{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    basic knowledge of Hebrew
  </Text>
  , and for beginners who want to gradually master common verbs
  and their forms.
</Text>

{/* Verb Cards */}
<Text style={styles.modalTitle}>VERB CARDS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Verb Cards —
  </Text>{' '}
  a quick and convenient way to review a verb, its translation,
  binyan, and conjugation forms.
</Text>

{/* Main Exercises */}
<Text style={styles.modalTitle}>EXERCISES</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercises 1 and 2 —
  </Text>{' '}
  help you memorize more than 400 essential Hebrew verbs and connect
  each written verb with its meaning.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercise 3 —
  </Text>{' '}
  practise identifying the binyan of a Hebrew verb.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercise 4 —
  </Text>{' '}
  practise the Hebrew imperative.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercises 5 and 6 —
  </Text>{' '}
  core exercises for practising Hebrew verb conjugation.
  Regular practice helps make choosing the correct verb form automatic.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercises 7 and 8 —
  </Text>{' '}
  more advanced conjugation practice for learners who are already
  comfortable with the basic exercises.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercise 9 “Verb in a Sentence” —
  </Text>{' '}
  choose the correct verb form according to the context of the sentence.
  Pay attention to tense, person, number, and gender.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercise 10 “Listen and Understand” —
  </Text>{' '}
  listen to Hebrew sentences and choose the correct translation.
  This exercise develops listening comprehension.
</Text>

{/* Prepositions */}
<Text style={styles.modalTitle}>VERBS AND PREPOSITIONS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • “Prepositions 1” —
  </Text>{' '}
  practise the most common prepositions used with verbs
  in everyday Hebrew.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • “Prepositions 2” —
  </Text>{' '}
  more advanced practice with verb-preposition combinations.
  It helps you learn natural combinations instead of isolated words.
</Text>

{/* Same-root Verbs */}
<Text style={styles.modalTitle}>SAME-ROOT VERBS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • “Same-root Verbs” —
  </Text>{' '}
  compare verbs that share the same root across different binyanim
  and see how a change in binyan can change the meaning of the verb.
</Text>

{/* Tip */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• Tip:</Text>{' '}
  start by learning verbs and their basic forms, then move on to conjugation,
  prepositions, and sentences. This way, correct verb forms gradually become
  faster and more automatic.
</Text>

{/* Final block */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    Regular practice with Verbify helps you not only memorize Hebrew verbs,
    but also recognize their forms faster, use them correctly in sentences,
    and understand spoken Hebrew more confidently.
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
    color: '#1C3F60',      // тёмно-синий для заголовков
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333652',      // основной текст
  },
  listItem: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 5,
    color: '#333652',
  },
  finalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    color: '#333652',
  },
  bold: {
    fontWeight: 'bold',
  },

  // 🔹 Цветовые акценты
  highlightMain: {
    color: '#0F4C81',   // ключевые идеи / общий смысл
  },
  highlightExercise: {
    color: '#C8502D',   // про упражнения
  },
  highlightTip: {
    color: '#00796B',   // советы
  },
  highlightAccent: {
    color: '#8E24AA',   // термины: binyanim, imperative, beginners
  },
  highlightFinal: {
    color: '#D81B60',   // яркий финальный вывод
  },

  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2D4769',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
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
