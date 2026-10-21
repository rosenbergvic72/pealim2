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
  Verbify es una{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    herramienta práctica para entrenar y aprender los verbos en hebreo
  </Text>
  . Ayuda a memorizar verbos, comprender los binyanim, practicar la conjugación,
  aprender combinaciones de verbos y preposiciones y utilizar correctamente
  los verbos dentro de frases.
</Text>

<Text style={styles.modalText}>
  La aplicación es adecuada tanto para quienes ya tienen{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    conocimientos básicos de hebreo
  </Text>
  , como para principiantes que quieren aprender poco a poco los verbos
  más frecuentes y sus diferentes formas.
</Text>

{/* Tarjetas de verbos */}
<Text style={styles.modalTitle}>TARJETAS DE VERBOS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Tarjetas de verbos —
  </Text>{' '}
  una forma rápida y cómoda de consultar un verbo, su traducción,
  su binyan y sus diferentes formas de conjugación.
</Text>

{/* Ejercicios */}
<Text style={styles.modalTitle}>EJERCICIOS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicios 1 y 2 —
  </Text>{' '}
  ayudan a memorizar más de 400 verbos esenciales en hebreo y a relacionar
  cada verbo escrito con su significado.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicio 3 —
  </Text>{' '}
  práctica para identificar el binyan de un verbo hebreo.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicio 4 —
  </Text>{' '}
  práctica del imperativo en hebreo.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicios 5 y 6 —
  </Text>{' '}
  ejercicios principales para practicar la conjugación de los verbos en hebreo.
  La práctica regular ayuda a elegir de forma automática la forma correcta
  del verbo.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicios 7 y 8 —
  </Text>{' '}
  práctica de conjugación más avanzada para quienes ya dominan
  los ejercicios básicos.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicio 9 «El verbo en la oración» —
  </Text>{' '}
  elige la forma correcta del verbo según el contexto de la frase.
  Presta atención al tiempo, la persona, el número y el género.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicio 10 «Escucha y comprende» —
  </Text>{' '}
  escucha frases en hebreo y elige la traducción correcta.
  Este ejercicio desarrolla la comprensión auditiva.
</Text>


{/* Ejercicio 11 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Ejercicio 11 «Forma el verbo» —
  </Text>{' '}
  construye las formas verbales en hebreo seleccionando
  las letras en el orden correcto. El infinitivo, la
  raíz y el binyán te ayudan a recordar la forma adecuada,
  mientras que tres intentos ofrecen pistas progresivas.
  Esta práctica fortalece la memoria, mejora la ortografía
  y te ayuda a formar verbos sin depender de respuestas
  de opción múltiple.
</Text>


{/* Preposiciones */}
<Text style={styles.modalTitle}>VERBOS Y PREPOSICIONES</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Preposiciones 1» —
  </Text>{' '}
  práctica de las preposiciones más frecuentes que se utilizan con verbos
  en el hebreo cotidiano.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Preposiciones 2» —
  </Text>{' '}
  práctica más avanzada de combinaciones de verbos y preposiciones.
  Ayuda a aprender combinaciones naturales en lugar de palabras aisladas.
</Text>

{/* Verbos con la misma raíz */}
<Text style={styles.modalTitle}>VERBOS DE LA MISMA RAÍZ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Verbos de la misma raíz» —
  </Text>{' '}
  compara verbos que comparten la misma raíz en diferentes binyanim y observa
  cómo un cambio de binyan puede cambiar el significado del verbo.
</Text>

{/* Consejo */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• Consejo:</Text>{' '}
  empieza aprendiendo los verbos y sus formas básicas, y después continúa
  con la conjugación, las preposiciones y las frases. De esta forma,
  las formas correctas se vuelven cada vez más rápidas y automáticas.
</Text>

{/* Bloque final */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    La práctica regular con Verbify te ayuda no solo a memorizar los verbos
    en hebreo, sino también a reconocer sus formas más rápidamente,
    utilizarlos correctamente en frases y comprender mejor el hebreo hablado.
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
