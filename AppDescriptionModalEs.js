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

              {/* Título */}
              <Text style={styles.modalTitle}>DESCRIPCIÓN DE LA APLICACIÓN</Text>

              <Text style={styles.modalText}>
                Este es un{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  entrenador y herramienta eficaz
                </Text>{' '}
                para aquellos que ya están estudiando hebreo,
                tienen{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  conocimientos básicos
                </Text>
                , quieren{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  aprender a conjugar verbos rápida y correctamente
                </Text>{' '}
                o{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  mejorar esta habilidad
                </Text>
                .
                La aplicación también es útil para{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  principiantes
                </Text>
                , ya que incluye ejercicios para{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  memorizar verbos
                </Text>
                , sus formas,{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  binyanim
                </Text>{' '}
                y{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>
                  practicar el uso del modo imperativo (imperativos)
                </Text>
                .
              </Text>

              {/* Ejercicios Principales */}
              <Text style={styles.modalTitle}>EJERCICIOS PRINCIPALES</Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  La conjugación de verbos es una parte clave de la aplicación.
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Ejercicios 5 y 6 -
                </Text>{' '}
                estas son las tareas principales para practicar la conjugación. Recomendamos hacerlas regularmente hasta que la habilidad se vuelva automática.
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Ejercicios 7 y 8 -
                </Text>{' '}
                versiones avanzadas de los ejercicios 5 y 6. Están diseñados para aquellos que ya han logrado resultados seguros y desean llevar su práctica al siguiente nivel.
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightTip]}>
                  • Consejo:
                </Text>{' '}
                primero practica la conjugación en los ejercicios 5 y 6, ¡luego pasa a los más complejos 7 y 8!
              </Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  Ejercicios para aprender los conceptos básicos.
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Ejercicios 1 y 2 -
                </Text>{' '}
                ayudan a memorizar alrededor de 350 verbos clave y sus formas básicas.
              </Text>
              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Ejercicio 3 -
                </Text>{' '}
                practica la determinación del binyan de un verbo (se requieren conocimientos básicos).
              </Text>
              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • Ejercicio 4 -
                </Text>{' '}
                entrenador para practicar el modo imperativo en hebreo.
              </Text>

              {/* Bloque final */}
              <Text style={styles.finalText}>
                <Text style={[styles.bold, styles.highlightFinal]}>
                  ¡La práctica constante de ejercicios sienta una base sólida para el uso correcto de los verbos y sus conjugaciones en el lenguaje hablado cotidiano!
                </Text>
              </Text>

            </ScrollView>

            {/* Botón de cierre fijo */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.button} onPress={onToggle}>
                <Text style={styles.textStyle}>Cerrar</Text>
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
    color: '#8E24AA', // термины / выделенные группы (principiantes, binyanim, imperativo)
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
