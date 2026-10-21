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
<Text style={styles.modalTitle}>DESCRIPTION DE L’APPLICATION</Text>

<Text style={styles.modalText}>
  Verbify est un{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    outil pratique d’entraînement et d’apprentissage des verbes hébreux
  </Text>
  . Il aide à mémoriser les verbes, à comprendre les binyanim, à pratiquer
  la conjugaison, à apprendre les associations entre verbes et prépositions
  et à utiliser correctement les verbes dans des phrases.
</Text>

<Text style={styles.modalText}>
  L’application convient aussi bien aux personnes qui possèdent déjà{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    des connaissances de base en hébreu
  </Text>
  , qu’aux débutants qui souhaitent apprendre progressivement les verbes
  les plus courants et leurs différentes formes.
</Text>

{/* Fiches de verbes */}
<Text style={styles.modalTitle}>FICHES DE VERBES</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Fiches de verbes —
  </Text>{' '}
  un moyen rapide et pratique de consulter un verbe, sa traduction,
  son binyan et ses différentes formes de conjugaison.
</Text>

{/* Exercices */}
<Text style={styles.modalTitle}>EXERCICES</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercices 1 et 2 —
  </Text>{' '}
  aident à mémoriser plus de 400 verbes hébreux essentiels et à associer
  chaque verbe écrit à sa signification.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercice 3 —
  </Text>{' '}
  entraînement à l’identification du binyan d’un verbe hébreu.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercice 4 —
  </Text>{' '}
  entraînement à l’impératif en hébreu.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercices 5 et 6 —
  </Text>{' '}
  exercices principaux pour pratiquer la conjugaison des verbes hébreux.
  Un entraînement régulier aide à choisir automatiquement la bonne forme
  du verbe.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercices 7 et 8 —
  </Text>{' '}
  exercices de conjugaison plus avancés pour les utilisateurs qui maîtrisent
  déjà les exercices de base.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercice 9 « Le verbe dans la phrase » —
  </Text>{' '}
  choisissez la forme correcte du verbe en fonction du contexte de la phrase.
  Faites attention au temps, à la personne, au nombre et au genre.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercice 10 « Écouter et comprendre » —
  </Text>{' '}
  écoutez des phrases en hébreu et choisissez la traduction correcte.
  Cet exercice développe la compréhension orale.
</Text>


{/* Exercice 11 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercice 11 « Composez le verbe » —
  </Text>{' '}
  reconstituez vous-même les formes verbales en hébreu
  en sélectionnant les lettres dans le bon ordre.
  L’infinitif, la racine et le binyan vous aident à
  retrouver la forme correcte, tandis que trois
  tentatives proposent des indices progressifs.
  Cet entraînement renforce la mémorisation, améliore
  l’orthographe et développe la capacité à produire
  les verbes sans choix de réponses.
</Text>


{/* Prépositions */}
<Text style={styles.modalTitle}>VERBES ET PRÉPOSITIONS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • « Prépositions 1 » —
  </Text>{' '}
  entraînement aux prépositions les plus courantes utilisées avec les verbes
  dans l’hébreu de tous les jours.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • « Prépositions 2 » —
  </Text>{' '}
  pratique plus avancée des associations entre verbes et prépositions.
  Elle permet d’apprendre des combinaisons naturelles plutôt que des mots
  isolés.
</Text>

{/* Verbes de la même racine */}
<Text style={styles.modalTitle}>VERBES DE LA MÊME RACINE</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • « Verbes de la même racine » —
  </Text>{' '}
  comparez des verbes ayant la même racine dans différents binyanim et
  observez comment le changement de binyan peut modifier le sens du verbe.
</Text>

{/* Conseil */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• Conseil :</Text>{' '}
  commencez par apprendre les verbes et leurs formes de base, puis passez
  à la conjugaison, aux prépositions et aux phrases. Ainsi, les formes
  correctes deviennent progressivement plus rapides et plus automatiques.
</Text>

{/* Bloc final */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    Une pratique régulière avec Verbify vous aide non seulement à mémoriser
    les verbes hébreux, mais aussi à reconnaître plus rapidement leurs formes,
    à les utiliser correctement dans des phrases et à mieux comprendre
    l’hébreu parlé.
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
