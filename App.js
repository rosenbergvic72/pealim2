import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { NativeEventEmitter } from 'expo-modules-core';
import { NativeEventEmitter, NativeModules } from 'react-native';
import React, { useEffect } from 'react';
import * as Font from 'expo-font';
import LanguageSelectionPage from './LanguageSelectionPage';
import WelcomePage from './WelcomePage';
import WelcomePageEn from './WelcomePageEn';
import WelcomePageFr from './WelcomePageFr';
import WelcomePageEs from './WelcomePageEs';
import WelcomePagePt from './WelcomePagePt';
import WelcomePageAr from './WelcomePageAr';
import WelcomePageAm from './WelcomePageAm';
import MenuPage from './MenuPage';
import MenuPageEn from './MenuPageEn';
import MenuPageFr from './MenuPageFr';
import MenuPageEs from './MenuPageEs';
import MenuPagePt from './MenuPagePt';
import MenuPageAr from './MenuPageAr';
import MenuPageAm from './MenuPageAm';
import Exercise1 from './Exercise1';
import Exercise1En from './Exercise1En';
import Exercise1Fr from './Exercise1Fr';
import Exercise1Es from './Exercise1Es';
import Exercise1Pt from './Exercise1Pt';
import Exercise1Ar from './Exercise1Ar';
import Exercise1Am from './Exercise1Am';
import Exercise2 from './Exercise2';
import Exercise2En from './Exercise2En';
import Exercise2Fr from './Exercise2Fr';
import Exercise2Es from './Exercise2Es';
import Exercise2Pt from './Exercise2Pt';
import Exercise2Ar from './Exercise2Ar';
import Exercise2Am from './Exercise2Am';
import Exercise3 from './Exercise3';
import Exercise3En from './Exercise3En';
import Exercise3Fr from './Exercise3Fr';
import Exercise3Es from './Exercise3Es';
import Exercise3Pt from './Exercise3Pt';
import Exercise3Ar from './Exercise3Ar';
import Exercise3Am from './Exercise3Am';
import Exercise4 from './Exercise4';
import Exercise5 from './Exercise5';
import Exercise5En from './Exercise5En';
import Exercise5Fr from './Exercise5Fr';
import Exercise5Es from './Exercise5Es';
import Exercise5Pt from './Exercise5Pt';
import Exercise5Ar from './Exercise5Ar';
import Exercise5Am from './Exercise5Am';
import Exercise6 from './Exercise6';
import Exercise7 from './Exercise7';
import Exercise8 from './Exercise8';

// import { PixelRatio, StyleSheet, Text, View } from 'react-native';
// import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
  
const Stack = createStackNavigator();

const App = () => {

  // const fontScale = PixelRatio.getFontScale(); // Определение внутри компонента

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'mt-bold': require('./assets/fonts/Montserrat-VariableFont_wght.ttf'),
        'mt-light': require('./assets/fonts/Montserrat-Italic-VariableFont_wght.ttf'),
      });
    };

    loadFonts();
  }, []);

  useEffect(() => {
    const fetchAllKeys = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const stores = await AsyncStorage.multiGet(keys);
        stores.map((result, i, store) => {
          console.log({ [store[i][0]]: store[i][1] });
          return true;
        });
      } catch (error) {
        console.error("Error accessing AsyncStorage:", error);
      }
    };

    fetchAllKeys();
  }, []);

  useEffect(() => {
    AsyncStorage.getAllKeys((err, keys) => {
      if (err) {
        console.error("Error fetching keys in AsyncStorage:", err);
      } else {
        console.log("All keys in AsyncStorage:", keys); // Вывод всех ключей в консоль
      }
    });
  }, []);

  return (
    <NavigationContainer>
      
      <Stack.Navigator initialRouteName="LanguageSelect">
        <Stack.Screen name="LanguageSelect" component={LanguageSelectionPage} options={{ title: 'Select Language' }} />
        <Stack.Screen name="Welcome" component={WelcomePage} options={{ title: 'Добро пожаловать!' }}/>
        <Stack.Screen name="WelcomeEn" component={WelcomePageEn} options={{ title: 'Welcome!' }}/>
        <Stack.Screen name="WelcomeFr" component={WelcomePageFr} options={{ title: 'Bienvenue!' }}/>
        <Stack.Screen name="WelcomeEs" component={WelcomePageEs} options={{ title: '¡Bienvenidos!' }}/>
        <Stack.Screen name="WelcomePt" component={WelcomePagePt} options={{ title: 'Bem-vindos!' }}/>
        <Stack.Screen name="WelcomeAr" component={WelcomePageAr} options={{ title: 'أهلًا وسهلًا' }}/>
        <Stack.Screen name="WelcomeAm" component={WelcomePageAm} options={{ title: 'ሰላም መጡ!' }}/>
        <Stack.Screen name="Menu" component={MenuPage} options={{ title: 'Меню' }}/>
        <Stack.Screen name="MenuEn" component={MenuPageEn} options={{ title: 'Menu' }}/>
        <Stack.Screen name="MenuFr" component={MenuPageFr} options={{ title: 'Menu' }}/>
        <Stack.Screen name="MenuEs" component={MenuPageEs} options={{ title: 'Menú' }}/>
        <Stack.Screen name="MenuPt" component={MenuPagePt} options={{ title: 'Menu' }}/>
        <Stack.Screen name="MenuAr" component={MenuPageAr} options={{ title: 'القائمة' }}/>
        <Stack.Screen name="MenuAm" component={MenuPageAm} options={{ title: 'ምናሌ' }}/>
        <Stack.Screen name="Exercise1" component={Exercise1} options={{ title: 'Упражнение 1' }}/>
        <Stack.Screen name="Exercise1En" component={Exercise1En} options={{ title: 'Exercise 1' }}/>
        <Stack.Screen name="Exercise1Fr" component={Exercise1Fr} options={{ title: 'Exercice 1' }}/>
        <Stack.Screen name="Exercise1Es" component={Exercise1Es} options={{ title: 'Ejercicio 1' }}/>
        <Stack.Screen name="Exercise1Pt" component={Exercise1Pt} options={{ title: 'Exercício 1' }}/>
        <Stack.Screen name="Exercise1Ar" component={Exercise1Ar} options={{ title: 'التمرين 1' }}/>
        <Stack.Screen name="Exercise1Am" component={Exercise1Am} options={{ title: 'ልምምድ አንድ' }}/>
        <Stack.Screen name="Exercise2" component={Exercise2} options={{ title: 'Упражнение 2' }}/>
        <Stack.Screen name="Exercise2En" component={Exercise2En} options={{ title: 'Exercise 2' }}/>
        <Stack.Screen name="Exercise2Fr" component={Exercise2Fr} options={{ title: 'Exercice 2' }}/>
        <Stack.Screen name="Exercise2Es" component={Exercise2Es} options={{ title: 'Ejercicio 2' }}/>
        <Stack.Screen name="Exercise2Pt" component={Exercise2Pt} options={{ title: 'Exercício 2' }}/>
        <Stack.Screen name="Exercise2Ar" component={Exercise2Ar} options={{ title: 'التمرين 2' }}/>
        <Stack.Screen name="Exercise2Am" component={Exercise2Am} options={{ title: 'ልምምድ ሁለት' }}/>
        <Stack.Screen name="Exercise3" component={Exercise3} options={{ title: 'Упражнение 3' }}/>
        <Stack.Screen name="Exercise3En" component={Exercise3En} options={{ title: 'Exercise 3' }}/>
        <Stack.Screen name="Exercise3Fr" component={Exercise3Fr} options={{ title: 'Exercice 3' }}/>
        <Stack.Screen name="Exercise3Es" component={Exercise3Es} options={{ title: 'Ejercicio 3' }}/>
        <Stack.Screen name="Exercise3Pt" component={Exercise3Pt} options={{ title: 'Exercício 3' }}/>
        <Stack.Screen name="Exercise3Ar" component={Exercise3Ar} options={{ title: 'التمرين 3' }}/>
        <Stack.Screen name="Exercise3Am" component={Exercise3Am} options={{ title: 'ልምምድ ሶስት' }}/>
        <Stack.Screen name="Exercise4" component={Exercise4} options={{ title: 'Упражнение 4' }}/>
        <Stack.Screen name="Exercise5" component={Exercise5} options={{ title: 'Упражнение 4' }}/>
        <Stack.Screen name="Exercise5En" component={Exercise5En} options={{ title: 'Exercise 4' }}/>
        <Stack.Screen name="Exercise5Fr" component={Exercise5Fr} options={{ title: 'Exercice 4' }}/>
        <Stack.Screen name="Exercise5Es" component={Exercise5Es} options={{ title: 'Ejercicio 4' }}/>
        <Stack.Screen name="Exercise5Pt" component={Exercise5Pt} options={{ title: 'Exercício 4' }}/>
        <Stack.Screen name="Exercise5Ar" component={Exercise5Ar} options={{ title: 'التمرين 4' }}/>
        <Stack.Screen name="Exercise5Am" component={Exercise5Am} options={{ title: 'ልምምድ አራት' }}/>
        <Stack.Screen name="Exercise6" component={Exercise6} options={{ title: 'Упражнение 6' }}/> 
        <Stack.Screen name="Exercise7" component={Exercise7} options={{ title: 'Упражнение 7' }}/>
        <Stack.Screen name="Exercise8" component={Exercise8} options={{ title: 'Упражнение 8' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;