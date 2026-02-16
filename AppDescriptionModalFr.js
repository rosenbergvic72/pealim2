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

              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image source={require('./VERBIFY.png')} style={styles.logo} />
              </View>

              {/* Titre */}
              <Text style={styles.modalTitle}>DESCRIPTION DE L'APPLICATION</Text>

              <Text style={styles.modalText}>
                C'est un{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  outil et entraîneur efficace
                </Text>{' '}
                pour ceux qui étudient déjà l'hébreu,
                ont des{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  connaissances de base
                </Text>
                , veulent{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  apprendre à conjuguer les verbes rapidement et correctement
                </Text>{' '}
                ou{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  améliorer cette compétence
                </Text>
                .
                L'application est également utile pour les{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  débutants
                </Text>
                , car elle comprend des exercices pour{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  mémoriser les verbes
                </Text>
                , leurs formes, les{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  binyanim
                </Text>{' '}
                et{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  pratiquer l'utilisation de l'impératif (impératifs)
                </Text>
                .
              </Text>

              {/* Exercices Principaux */}
              <Text style={styles.modalTitle}>EXERCICES PRINCIPAUX</Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  La conjugaison des verbes est une partie clé de l'application.
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Exercices 5 et 6 -
                </Text>{' '}
                ce sont les tâches principales pour pratiquer la conjugaison. Nous recommandons de les faire régulièrement jusqu'à ce que la compétence devienne automatique.
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Exercices 7 et 8 -
                </Text>{' '}
                versions avancées des exercices 5 et 6. Ils sont conçus pour ceux qui ont déjà obtenu des résultats confiants et souhaitent faire passer leur pratique au niveau supérieur.
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightTip]}>
                  • Conseil :
                </Text>{' '}
                pratiquez d'abord la conjugaison dans les exercices 5 et 6, puis passez aux exercices 7 et 8 plus complexes !
              </Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  Exercices pour apprendre les bases.
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Exercices 1 et 2 -
                </Text>{' '}
                aident à mémoriser environ 350 verbes clés et leurs formes de base.
              </Text>
              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Exercice 3 -
                </Text>{' '}
                pratique la détermination du binyan d'un verbe (connaissances de base requises).
              </Text>
              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Exercice 4 -
                </Text>{' '}
                entraîneur pour pratiquer l'impératif en hébreu.
              </Text>

              {/* Bloc final */}
              <Text style={styles.finalText}>
                <Text style={[styles.bold, styles.highlightFinal]}>
                  La pratique constante des exercices jette des bases solides pour l'utilisation correcte des verbes et de leurs conjugaisons dans la langue parlée quotidienne !
                </Text>
              </Text>

            </ScrollView>

            {/* Bouton de fermeture fixe */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.button} onPress={onToggle}>
                <Text style={styles.textStyle}>Fermer</Text>
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
    color: '#1C3F60', // тёмно-синий заголовок
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333652', // основной текст
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
    color: '#0F4C81', // ключевые идеи / общий смысл
  },
  highlightExercise: {
    color: '#C8502D', // блоки об упражнениях
  },
  highlightTip: {
    color: '#00796B', // советы
  },
  highlightAccent: {
    color: '#8E24AA', // особые термины / группы
  },
  highlightFinal: {
    color: '#D81B60', // яркий финальный вывод
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
