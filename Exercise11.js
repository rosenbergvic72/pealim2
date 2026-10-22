import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Audio} from 'expo-av';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {updateStatistics, getStatistics} from './stat';
import ProgressBar from './ProgressBar';
import { LinearGradient } from 'expo-linear-gradient';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';
import verbsData from './verbs6RU.json';
import verbsInfo from './verbs1.json';
import soundsconj from './soundconj';
import sounds from './Soundss';

const ASSETS = { logo: require('./VERBIFY.png'), on: require('./SoundOn.png'), off: require('./SoundOff.png'), list: require('./spisok2.png'), stats: require('./stat.png'), help: require('./question.png'), speaker: require('./speaker3.png'), hide: require('./glaz1.png'), hidden: require('./glaz2.png'), pin: require('./gant1.png'), pinned: require('./gant2.png') };
const GENDER_ICONS = {man:require('./man1.png'),woman:require('./woman1.png'),men:require('./men1.png'),women:require('./women1.png')};
const ROWS = ['קראטוןםפ', 'שדגכעיחלךף', 'זסבהנמצתץ'];
const COUNTS = [8,12,18,24];
const SCORE = [100,70,40,0];
const ERROR_SOUND = require('./assets/sounds/failure_root.mp3');
const LABEL = {
 ru:{name:'Собери глагол',begin:'НАЧАТЬ',next:'ДАЛЕЕ',check:'ПРОВЕРИТЬ',back:'Назад',meaning:'Напишите форму глагола',inf:'Инфинитив',root:'Корень',binyan:'Биньян',translit:'Транслитерация',wrong:'Неверно. Нужные буквы выделены.',last:'Попробуйте ещё раз.',right:'Правильно!',lost:'Правильный ответ:',score:'Результат',finish:'ЗАВЕРШИТЬ',repeat:'ЕЩЁ РАЗ',count:'Выбери количество заданий',help:`В этом упражнении вы самостоятельно составляете нужную форму глагола на иврите по русскому переводу. Инфинитив, корень и биньян помогут вспомнить спряжение, а буквы нужно выбрать на клавиатуре в правильном порядке.

У вас три попытки: первая — без подсказок (100%), вторая — с выделением нужных букв (70%), третья — с транслитерацией и озвучкой (40%). После ответа можно проверить написание и прослушать форму.

Почему это полезно: вы не просто узнаёте готовый ответ, а вспоминаете и воспроизводите его самостоятельно. Такая практика развивает память на формы, точность написания и скорость использования глаголов в речи. Сложные формы отмечайте для более частого повторения, а освоенные исключайте из ротации.`,none:'Нет подходящих заданий',available:'Доступно',speaker:'Прослушать',remove:'Удалить',excluded:'Исключить',more:'Чаще',settings:'Настройки'},
 en:{name:'Build the Verb',begin:'START',next:'NEXT',check:'CHECK',back:'Back',meaning:'Write the verb form!',inf:'Infinitive',root:'Root',binyan:'Binyan',translit:'Transliteration',wrong:'Not quite. Required letters are highlighted.',last:'Try again.',right:'Correct!',lost:'Correct answer:',score:'Result',finish:'FINISH',repeat:'TRY AGAIN',count:'Choose the number of questions',help:`Build the correct Hebrew verb form yourself from the translation. Use the infinitive, root, and binyan as clues, then tap the letters in the correct order.

You have three attempts: no hints (100%), highlighted required letters (70%), and transliteration with audio (40%). After answering, review the spelling and listen to the correct form.

Why it helps: instead of recognizing an answer, you actively recall and produce it. This strengthens your memory of conjugations, improves spelling accuracy, and helps you use verbs more fluently. Pin difficult forms for extra practice or exclude the ones you already know.`,none:'No available exercises',available:'Available',speaker:'Listen',remove:'Backspace',excluded:'Exclude',more:'More often',settings:'Settings'}, fr:{"name": "Composez le verbe", "begin": "COMMENCER", "next": "SUIVANT", "check": "VÉRIFIER", "back": "Retour", "meaning": "Écrivez la forme du verbe", "inf": "Infinitif", "root": "Racine", "binyan": "Binyan", "translit": "Translittération", "wrong": "Incorrect. Les lettres nécessaires sont surlignées.", "last": "Réessayez.", "right": "Correct !", "lost": "Bonne réponse :", "score": "Résultat", "finish": "TERMINER", "repeat": "RECOMMENCER", "count": "Choisissez le nombre de questions", "help": "Composez vous-même la forme correcte du verbe hébreu à partir de sa traduction. Utilisez l’infinitif, la racine et le binyan comme indices. Vous avez trois tentatives : sans aide (100 %), avec les lettres mises en évidence (70 %) et avec la translittération et l’audio (40 %). Cet exercice renforce la mémorisation des conjugaisons et la précision de l’écriture. Marquez les formes difficiles pour les revoir plus souvent.", "none": "Aucune question disponible", "available": "Disponibles", "speaker": "Écouter", "remove": "Effacer", "excluded": "Exclure", "more": "Plus souvent", "settings": "Paramètres"},
 es:{"name": "Forma el verbo", "begin": "EMPEZAR", "next": "SIGUIENTE", "check": "COMPROBAR", "back": "Volver", "meaning": "Escribe la forma verbal", "inf": "Infinitivo", "root": "Raíz", "binyan": "Binyán", "translit": "Transliteración", "wrong": "Incorrecto. Se resaltan las letras necesarias.", "last": "Inténtalo de nuevo.", "right": "¡Correcto!", "lost": "Respuesta correcta:", "score": "Resultado", "finish": "FINALIZAR", "repeat": "REPETIR", "count": "Elige la cantidad de preguntas", "help": "Forma la conjugación correcta en hebreo a partir de la traducción. Utiliza el infinitivo, la raíz y el binyán como pistas. Tienes tres intentos: sin pistas (100 %), con letras resaltadas (70 %) y con transliteración y audio (40 %). La práctica mejora la memoria de las conjugaciones y la escritura. Marca las formas difíciles para repasarlas más a menudo.", "none": "No hay preguntas disponibles", "available": "Disponibles", "speaker": "Escuchar", "remove": "Borrar", "excluded": "Excluir", "more": "Más a menudo", "settings": "Ajustes"},
 pt:{"name": "Monte o verbo", "begin": "COMEÇAR", "next": "PRÓXIMO", "check": "VERIFICAR", "back": "Voltar", "meaning": "Escreva a forma do verbo", "inf": "Infinitivo", "root": "Raiz", "binyan": "Binyan", "translit": "Transliteração", "wrong": "Incorreto. As letras necessárias foram destacadas.", "last": "Tente novamente.", "right": "Correto!", "lost": "Resposta correta:", "score": "Resultado", "finish": "CONCLUIR", "repeat": "TENTAR DE NOVO", "count": "Escolha a quantidade de questões", "help": "Monte a forma correta do verbo em hebraico a partir da tradução. Use o infinitivo, a raiz e o binyan como pistas. Você tem três tentativas: sem dicas (100%), com letras destacadas (70%) e com transliteração e áudio (40%). Essa prática melhora a memória das conjugações e a escrita. Marque as formas difíceis para treinar com mais frequência.", "none": "Nenhuma questão disponível", "available": "Disponíveis", "speaker": "Ouvir", "remove": "Apagar", "excluded": "Excluir", "more": "Mais vezes", "settings": "Configurações"},
 ar:{"name": "كوّن الفعل", "begin": "ابدأ", "next": "التالي", "check": "تحقّق", "back": "رجوع", "meaning": "اكتب صيغة الفعل", "inf": "المصدر", "root": "الجذر", "binyan": "البنيان", "translit": "النقل الصوتي", "wrong": "إجابة غير صحيحة. تم تمييز الحروف المطلوبة.", "last": "حاول مرة أخرى.", "right": "صحيح!", "lost": "الإجابة الصحيحة:", "score": "النتيجة", "finish": "إنهاء", "repeat": "حاول مجددًا", "count": "اختر عدد الأسئلة", "help": "كوّن صيغة الفعل بالعبرية بنفسك انطلاقًا من الترجمة. استعِن بالمصدر والجذر والبنيان. لديك ثلاث محاولات: دون تلميحات (100٪)، مع تمييز الحروف المطلوبة (70٪)، ثم مع النقل الصوتي والتسجيل (40٪). يساعد التمرين على تذكّر التصريف وتحسين الكتابة. ثبّت الصيغ الصعبة لمراجعتها أكثر.", "none": "لا توجد أسئلة متاحة", "available": "المتاح", "speaker": "استمع", "remove": "حذف", "excluded": "استبعاد", "more": "تكرار أكثر", "settings": "الإعدادات"},
 am:{"name": "ግሱን ይገንቡ", "begin": "ጀምር", "next": "ቀጣይ", "check": "አረጋግጥ", "back": "ተመለስ", "meaning": "የግሱን ቅርጽ ይጻፉ", "inf": "የግስ መነሻ", "root": "ሥር", "binyan": "ቢንያን", "translit": "የድምፅ ጽሑፍ", "wrong": "ትክክል አይደለም። አስፈላጊ ፊደላት ተለይተዋል።", "last": "እንደገና ይሞክሩ።", "right": "ትክክል!", "lost": "ትክክለኛው መልስ:", "score": "ውጤት", "finish": "ጨርስ", "repeat": "እንደገና ሞክር", "count": "የጥያቄዎችን ብዛት ይምረጡ", "help": "ከትርጉሙ ተነስተው ትክክለኛውን የዕብራይስጥ ግስ ቅርጽ ይገንቡ። የግሱን መነሻ፣ ሥር እና ቢንያን እንደ ፍንጭ ይጠቀሙ። ሦስት ሙከራዎች አሉዎት፤ ያለ ፍንጭ (100%)፣ በተለዩ ፊደላት (70%) እና በድምፅ እርዳታ (40%)። ይህ ልምምድ የግስ ቅርጾችን ለማስታወስ እና አጻጻፍን ለማሻሻል ይረዳል።", "none": "የሚገኙ ጥያቄዎች የሉም", "available": "የሚገኙ", "speaker": "አዳምጥ", "remove": "ሰርዝ", "excluded": "አስወግድ", "more": "በብዛት", "settings": "ቅንብሮች"}
};
const EX11_EXTRA = {
 "ru": {
  "exitTitle": "Выйти из упражнения?",
  "exitBody": "Текущий прогресс упражнения не будет сохранён.",
  "cancel": "Отмена",
  "exit": "Выйти",
  "correctCount": "Правильно",
  "wrongCount": "Неправильно",
  "verbList": "Список глаголов",
  "emptyList": "Нет закреплённых или исключённых форм",
  "close": "ЗАКРЫТЬ",
  "menu": "В МЕНЮ",
  "statsTitle": "Статистика упражнения 11",
  "completed": "Завершено",
  "average": "Средний результат",
  "statsError": "Не удалось загрузить статистику",
  "intro": "Составьте форму глагола на иврите по переводу, нажимая буквы на клавиатуре. У вас три попытки: без подсказок (100%), с выделением нужных букв (70%) и с транслитерацией и озвучкой (40%)."
 },
 "en": {
  "exitTitle": "Exit exercise?",
  "exitBody": "Your current exercise progress will not be saved.",
  "cancel": "Cancel",
  "exit": "Exit",
  "correctCount": "Correct",
  "wrongCount": "Wrong",
  "verbList": "Verb list",
  "emptyList": "No pinned or excluded forms",
  "close": "CLOSE",
  "menu": "MENU",
  "statsTitle": "Exercise 11 statistics",
  "completed": "Completed",
  "average": "Average score",
  "statsError": "Statistics unavailable",
  "intro": "Build the Hebrew verb form from its translation by tapping letters. You have three tries: without hints (100%), with highlighted letters (70%), and with transliteration and audio (40%)."
 },
 "fr": {
  "name": "Composez le verbe",
  "begin": "COMMENCER",
  "next": "SUIVANT",
  "check": "VÉRIFIER",
  "back": "Retour",
  "meaning": "Écrivez la forme du verbe",
  "inf": "Infinitif",
  "root": "Racine",
  "binyan": "Binyan",
  "translit": "Translittération",
  "wrong": "Incorrect. Les lettres nécessaires sont surlignées.",
  "last": "Réessayez.",
  "right": "Correct !",
  "lost": "Bonne réponse :",
  "score": "Résultat",
  "finish": "TERMINER",
  "repeat": "RECOMMENCER",
  "count": "Choisissez le nombre de questions",
  "help": "Composez vous-même la forme correcte du verbe hébreu à partir de sa traduction. Utilisez l’infinitif, la racine et le binyan comme indices. Vous avez trois tentatives : sans aide (100 %), avec les lettres mises en évidence (70 %) et avec la translittération et l’audio (40 %). Cet exercice renforce la mémorisation des conjugaisons et la précision de l’écriture. Marquez les formes difficiles pour les revoir plus souvent.",
  "none": "Aucune question disponible",
  "available": "Disponibles",
  "speaker": "Écouter",
  "remove": "Effacer",
  "excluded": "Exclure",
  "more": "Plus souvent",
  "settings": "Paramètres",
  "exitTitle": "Quitter l’exercice ?",
  "exitBody": "Votre progression en cours ne sera pas enregistrée.",
  "cancel": "Annuler",
  "exit": "Quitter",
  "correctCount": "Correctes",
  "wrongCount": "Incorrectes",
  "verbList": "Liste des verbes",
  "emptyList": "Aucune forme marquée ou exclue",
  "close": "FERMER",
  "menu": "MENU",
  "statsTitle": "Statistiques de l’exercice 11",
  "completed": "Terminés",
  "average": "Résultat moyen",
  "statsError": "Statistiques indisponibles",
  "intro": "Composez la forme du verbe hébreu à partir de sa traduction en touchant les lettres. Vous avez trois essais : sans aide (100 %), avec des lettres surlignées (70 %), puis avec translittération et audio (40 %)."
 },
 "es": {
  "name": "Forma el verbo",
  "begin": "EMPEZAR",
  "next": "SIGUIENTE",
  "check": "COMPROBAR",
  "back": "Volver",
  "meaning": "Escribe la forma verbal",
  "inf": "Infinitivo",
  "root": "Raíz",
  "binyan": "Binyán",
  "translit": "Transliteración",
  "wrong": "Incorrecto. Se resaltan las letras necesarias.",
  "last": "Inténtalo de nuevo.",
  "right": "¡Correcto!",
  "lost": "Respuesta correcta:",
  "score": "Resultado",
  "finish": "FINALIZAR",
  "repeat": "REPETIR",
  "count": "Elige la cantidad de preguntas",
  "help": "Forma la conjugación correcta en hebreo a partir de la traducción. Utiliza el infinitivo, la raíz y el binyán como pistas. Tienes tres intentos: sin pistas (100 %), con letras resaltadas (70 %) y con transliteración y audio (40 %). La práctica mejora la memoria de las conjugaciones y la escritura. Marca las formas difíciles para repasarlas más a menudo.",
  "none": "No hay preguntas disponibles",
  "available": "Disponibles",
  "speaker": "Escuchar",
  "remove": "Borrar",
  "excluded": "Excluir",
  "more": "Más a menudo",
  "settings": "Ajustes",
  "exitTitle": "¿Salir del ejercicio?",
  "exitBody": "No se guardará el progreso de esta sesión.",
  "cancel": "Cancelar",
  "exit": "Salir",
  "correctCount": "Correctas",
  "wrongCount": "Incorrectas",
  "verbList": "Lista de verbos",
  "emptyList": "No hay formas marcadas o excluidas",
  "close": "CERRAR",
  "menu": "MENÚ",
  "statsTitle": "Estadísticas del ejercicio 11",
  "completed": "Completados",
  "average": "Resultado medio",
  "statsError": "Estadísticas no disponibles",
  "intro": "Forma el verbo hebreo según la traducción tocando las letras. Tienes tres intentos: sin pistas (100 %), con letras resaltadas (70 %) y con transliteración y audio (40 %)."
 },
 "pt": {
  "name": "Monte o verbo",
  "begin": "COMEÇAR",
  "next": "PRÓXIMO",
  "check": "VERIFICAR",
  "back": "Voltar",
  "meaning": "Escreva a forma do verbo",
  "inf": "Infinitivo",
  "root": "Raiz",
  "binyan": "Binyan",
  "translit": "Transliteração",
  "wrong": "Incorreto. As letras necessárias foram destacadas.",
  "last": "Tente novamente.",
  "right": "Correto!",
  "lost": "Resposta correta:",
  "score": "Resultado",
  "finish": "CONCLUIR",
  "repeat": "TENTAR DE NOVO",
  "count": "Escolha a quantidade de questões",
  "help": "Monte a forma correta do verbo em hebraico a partir da tradução. Use o infinitivo, a raiz e o binyan como pistas. Você tem três tentativas: sem dicas (100%), com letras destacadas (70%) e com transliteração e áudio (40%). Essa prática melhora a memória das conjugações e a escrita. Marque as formas difíceis para treinar com mais frequência.",
  "none": "Nenhuma questão disponível",
  "available": "Disponíveis",
  "speaker": "Ouvir",
  "remove": "Apagar",
  "excluded": "Excluir",
  "more": "Mais vezes",
  "settings": "Configurações",
  "exitTitle": "Sair do exercício?",
  "exitBody": "O progresso desta sessão não será salvo.",
  "cancel": "Cancelar",
  "exit": "Sair",
  "correctCount": "Corretas",
  "wrongCount": "Erradas",
  "verbList": "Lista de verbos",
  "emptyList": "Nenhuma forma marcada ou excluída",
  "close": "FECHAR",
  "menu": "MENU",
  "statsTitle": "Estatísticas do exercício 11",
  "completed": "Concluídos",
  "average": "Resultado médio",
  "statsError": "Estatísticas indisponíveis",
  "intro": "Monte o verbo em hebraico a partir da tradução, tocando nas letras. Você tem três tentativas: sem dicas (100%), com letras destacadas (70%) e com transliteração e áudio (40%)."
 },
 "ar": {
  "name": "كوّن الفعل",
  "begin": "ابدأ",
  "next": "التالي",
  "check": "تحقّق",
  "back": "رجوع",
  "meaning": "اكتب صيغة الفعل",
  "inf": "المصدر",
  "root": "الجذر",
  "binyan": "البنيان",
  "translit": "النقل الصوتي",
  "wrong": "إجابة غير صحيحة. تم تمييز الحروف المطلوبة.",
  "last": "حاول مرة أخرى.",
  "right": "صحيح!",
  "lost": "الإجابة الصحيحة:",
  "score": "النتيجة",
  "finish": "إنهاء",
  "repeat": "حاول مجددًا",
  "count": "اختر عدد الأسئلة",
  "help": "كوّن صيغة الفعل بالعبرية بنفسك انطلاقًا من الترجمة. استعِن بالمصدر والجذر والبنيان. لديك ثلاث محاولات: دون تلميحات (100٪)، مع تمييز الحروف المطلوبة (70٪)، ثم مع النقل الصوتي والتسجيل (40٪). يساعد التمرين على تذكّر التصريف وتحسين الكتابة. ثبّت الصيغ الصعبة لمراجعتها أكثر.",
  "none": "لا توجد أسئلة متاحة",
  "available": "المتاح",
  "speaker": "استمع",
  "remove": "حذف",
  "excluded": "استبعاد",
  "more": "تكرار أكثر",
  "settings": "الإعدادات",
  "exitTitle": "هل تريد مغادرة التمرين؟",
  "exitBody": "لن يُحفظ تقدّم هذه الجلسة.",
  "cancel": "إلغاء",
  "exit": "خروج",
  "correctCount": "صحيح",
  "wrongCount": "خطأ",
  "verbList": "قائمة الأفعال",
  "emptyList": "لا توجد صيغ مثبتة أو مستبعدة",
  "close": "إغلاق",
  "menu": "القائمة",
  "statsTitle": "إحصاءات التمرين 11",
  "completed": "المكتمل",
  "average": "متوسط النتيجة",
  "statsError": "الإحصاءات غير متاحة",
  "intro": "كوّن صيغة الفعل العبري من الترجمة بالضغط على الحروف. لديك ثلاث محاولات: دون تلميحات (100٪)، مع تمييز الحروف (70٪)، ثم النقل الصوتي والتسجيل (40٪)."
 },
 "am": {
  "name": "ግሱን ይገንቡ",
  "begin": "ጀምር",
  "next": "ቀጣይ",
  "check": "አረጋግጥ",
  "back": "ተመለስ",
  "meaning": "የግሱን ቅርጽ ይጻፉ",
  "inf": "የግስ መነሻ",
  "root": "ሥር",
  "binyan": "ቢንያን",
  "translit": "የድምፅ ጽሑፍ",
  "wrong": "ትክክል አይደለም። አስፈላጊ ፊደላት ተለይተዋል።",
  "last": "እንደገና ይሞክሩ።",
  "right": "ትክክል!",
  "lost": "ትክክለኛው መልስ:",
  "score": "ውጤት",
  "finish": "ጨርስ",
  "repeat": "እንደገና ሞክር",
  "count": "የጥያቄዎችን ብዛት ይምረጡ",
  "help": "ከትርጉሙ ተነስተው ትክክለኛውን የዕብራይስጥ ግስ ቅርጽ ይገንቡ። የግሱን መነሻ፣ ሥር እና ቢንያን እንደ ፍንጭ ይጠቀሙ። ሦስት ሙከራዎች አሉዎት፤ ያለ ፍንጭ (100%)፣ በተለዩ ፊደላት (70%) እና በድምፅ እርዳታ (40%)። ይህ ልምምድ የግስ ቅርጾችን ለማስታወስ እና አጻጻፍን ለማሻሻል ይረዳል።",
  "none": "የሚገኙ ጥያቄዎች የሉም",
  "available": "የሚገኙ",
  "speaker": "አዳምጥ",
  "remove": "ሰርዝ",
  "excluded": "አስወግድ",
  "more": "በብዛት",
  "settings": "ቅንብሮች",
  "exitTitle": "ከልምምዱ ይውጡ?",
  "exitBody": "የአሁኑ የልምምድ እድገት አይቀመጥም።",
  "cancel": "ሰርዝ",
  "exit": "ውጣ",
  "correctCount": "ትክክል",
  "wrongCount": "ስህተት",
  "verbList": "የግሶች ዝርዝር",
  "emptyList": "የተመረጡ ወይም የተወገዱ ቅርጾች የሉም",
  "close": "ዝጋ",
  "menu": "ምናሌ",
  "statsTitle": "የ11ኛው ልምምድ ስታቲስቲክስ",
  "completed": "የተጠናቀቁ",
  "average": "አማካይ ውጤት",
  "statsError": "ስታቲስቲክስ አልተገኘም",
  "intro": "ከትርጉሙ ተነስተው የዕብራይስጥ ግሱን ፊደላት በመጫን ይገንቡ። ሦስት ሙከራዎች አሉ፤ ያለ ፍንጭ (100%)፣ በተለዩ ፊደላት (70%) እና በድምፅ እርዳታ (40%)።"
 }
};
const LANG_FIELDS = {ru:'russiantext',en:'entext',fr:'frtext',es:'estext',pt:'pttext',ar:'artext',am:'amtext'};
const FALLBACK_FIELDS = {ru:'russian',en:'english',fr:'french',es:'spanish',pt:'portu',ar:'arabic',am:'amharic'};
const LANG_NAMES = {fr:'Construis le verbe',es:'Forma el verbo',pt:'Monte o verbo',ar:'كوّن الفعل',am:'ግሱን ይገንቡ'};
const HEBREW = /[\u05D0-\u05EA]/;
const NIKKUD = /[\u0591-\u05C7]/g;
const PRONOUNS = new Set(['אני','אתה','את','הוא','היא','אנחנו','אתם','אתן','הם','הן']);
function makeItem(row,i) {
 const full = String(row.hebrewtext||'').replace(NIKKUD,'').trim();
 const words = full.split(/\s+/);
 const pronoun = PRONOUNS.has(words[0]) ? words[0] : '';
 const verb = pronoun ? words.slice(1).join('') : words.join('');
 if (!row.infinitive || !verb || ![...verb].every(ch=>HEBREW.test(ch))) return null;
 // Index is necessary: a conjugation can recur for two genders with different audio.
 return {...row,id:String(i),verb,pronoun,full};
}
function shuffled(items) {const x=[...items];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
// Metadata lives in verbs1.json; do not infer roots/binyanim from spelling.
const INFO_INDEX = new Map((Array.isArray(verbsInfo) ? verbsInfo : [])
 .filter(x => x && x.hebrewVerb)
 .map(x => [String(x.hebrewVerb).replace(NIKKUD,'').trim(), x]));
function getInfo(row) { return INFO_INDEX.get(String(row?.infinitive||'').replace(NIKKUD,'').trim()) || null; }
function getRoot(row) {return getInfo(row)?.root || null;}
function getBinyan(row) {return getInfo(row)?.binyan || null;}
function makeDeck(pool,count,pinned) {
 // Pinning increases the chance of a form appearing; it never restricts the
 // entire session to one infinitive. Spread different infinitives first.
 const chosen=[];
 const used=new Set();
 const groups=new Map();
 for(const form of shuffled(pool)) {
   if(!groups.has(form.infinitive))groups.set(form.infinitive,[]);
   groups.get(form.infinitive).push(form);
 }
 const groupList=shuffled([...groups.entries()]);
 // At most 1/4 of the session is reserved for pinned forms (without repeats).
 const pinnedPool=shuffled(pool.filter(x=>pinned.includes(x.id)));
 const pinnedLimit=Math.min(pinnedPool.length,Math.floor(count/4));
 for(const form of pinnedPool.slice(0,pinnedLimit)) {
   chosen.push(form);used.add(form.id);
 }
 for(const [,forms] of groupList) {
   if(chosen.length>=count)break;
   const candidate=forms.find(x=>!used.has(x.id));
   if(candidate){chosen.push(candidate);used.add(candidate.id);}
 }
 for(const form of shuffled(pool)) {
   if(chosen.length>=count)break;
   if(!used.has(form.id)){chosen.push(form);used.add(form.id);}
 }
 return shuffled(chosen);
}
const initSettings={count:12,excluded:[],pinned:[],sound:true};
export default function Exercise11({navigation,route}) {
 const {width:screenWidth,height:screenHeight}=useWindowDimensions();
  const safeInsets=useSafeAreaInsets();
 const compactScreen=screenHeight<880;
 const [language,setLanguage]=useState('en');const [settings,setSettings]=useState(initSettings);
 const [phase,setPhase]=useState('settings');const [deck,setDeck]=useState([]);const [index,setIndex]=useState(0);
 const [typed,setTyped]=useState([]);const [stage,setStage]=useState(0);const [finished,setFinished]=useState(false);const [awarded,setAwarded]=useState(0);
 const [earned,setEarned]=useState(0);const [correct,setCorrect]=useState(0);const [wrong,setWrong]=useState(0);
 const [audioPlaying,setAudioPlaying]=useState(false);
 const [exerciseStats,setExerciseStats]=useState(null);
 const [listOpen,setListOpen]=useState(false);
 const [translationRowWidth,setTranslationRowWidth]=useState(0);
 const [translationTextWidth,setTranslationTextWidth]=useState(0);
 // Intercept React Navigation back actions (header, iOS gesture and Android hardware Back).
 const phaseRef=useRef(phase);
 phaseRef.current=phase;
 const leaveConfirmedRef=useRef(false);
 const exitDialogOpenRef=useRef(false);
 useEffect(()=>{
  const unsubscribe=navigation?.addListener?.('beforeRemove',event=>{
   if(leaveConfirmedRef.current||phaseRef.current!=='task')return;
   event.preventDefault();
   if(exitDialogOpenRef.current)return;
   exitDialogOpenRef.current=true;
   Alert.alert(
    lang.exitTitle,
    lang.exitBody,
    [
     {text:lang.cancel,style:'cancel',onPress:()=>{exitDialogOpenRef.current=false;}},
     {text:lang.exit,style:'destructive',onPress:()=>{
      exitDialogOpenRef.current=false;
      leaveConfirmedRef.current=true;
      navigation.dispatch(event.data.action);
     }}
    ],
    {cancelable:true,onDismiss:()=>{exitDialogOpenRef.current=false;}}
   );
  });
  return ()=>unsubscribe?.();
 },[navigation,language]);
 const cardMotion=useRef(new Animated.Value(0)).current;
 useLayoutEffect(()=>{navigation?.setOptions?.({headerShown:true,headerHideAI:phase==='settings'});},[navigation,phase]);
 useEffect(()=>{if(phase!=='task')return; cardMotion.setValue(0);const loop=Animated.loop(Animated.sequence([Animated.timing(cardMotion,{toValue:1,duration:6500,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false}),Animated.timing(cardMotion,{toValue:0,duration:6500,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false})]));loop.start();return()=>loop.stop();},[phase,cardMotion]);
 const audioRef=useRef(null);const attemptLock=useRef(false);const activeRef=useRef(true);const totalsRef=useRef({earned:0,correct:0,wrong:0});
 const lang={...(LABEL[language]||LABEL.en),...(EX11_EXTRA[language]||EX11_EXTRA.en)};const rtl=language==='ar';
 const shortIntro=lang.intro;
 const all=useMemo(()=> (Array.isArray(verbsData)?verbsData:[]).map(makeItem).filter(Boolean),[]);
 const pool=useMemo(()=>all.filter(x=>!settings.excluded.includes(x.id)),[all,settings.excluded]);
 const item=deck[index];const target=item?.verb||'';
 const result=deck.length?Math.round(earned/deck.length):0;
 const stopAudio=useCallback(async()=>{const old=audioRef.current;audioRef.current=null;if(old){try{await old.stopAsync();await old.unloadAsync();}catch(e){}}setAudioPlaying(false);},[]);
 useEffect(()=>{activeRef.current=true;(async()=>{try{const v=await AsyncStorage.multiGet(['language','exercise11_settings_v1']);if(!activeRef.current)return;setLanguage(route?.params?.language||v[0][1]||'en');if(v[1][1]){
  const saved={...initSettings,...JSON.parse(v[1][1])};
  // Previous versions stored infinitives; they must not exclude entire families.
  // Only exact form IDs in the current database remain valid.
  const valid=new Set(all.map(x=>x.id));
  saved.excluded=[...new Set((Array.isArray(saved.excluded)?saved.excluded:[]).map(String).filter(id=>valid.has(id)))];
  saved.pinned=[...new Set((Array.isArray(saved.pinned)?saved.pinned:[]).map(String).filter(id=>valid.has(id)&&!saved.excluded.includes(id)))];
  setSettings(saved);
  AsyncStorage.setItem('exercise11_settings_v1',JSON.stringify(saved)).catch(()=>{});
 }}catch(e){console.warn('[Ex11] Load settings',e);}})();return()=>{activeRef.current=false;stopAudio();};},[route?.params?.language,stopAudio,all]);
 useFocusEffect(useCallback(()=>{const name=`exercise11${language}`;FirebaseAnalytics.logFirebaseEvent(name,{screen:name});return()=>{stopAudio();};},[language,stopAudio]));
 const saveSettings=patch=>setSettings(old=>{const next={...old,...patch};AsyncStorage.setItem('exercise11_settings_v1',JSON.stringify(next)).catch(console.warn);return next;});
 const playAudio=useCallback(async(source,onFinish)=>{
  if(!settings.sound||!source)return;
  await stopAudio();
  try{setAudioPlaying(true);const created=await Audio.Sound.createAsync(source,{shouldPlay:true});audioRef.current=created.sound;
   created.sound.setOnPlaybackStatusUpdate(status=>{
    if(status.isLoaded&&status.didJustFinish){
     created.sound.setOnPlaybackStatusUpdate(null);
     created.sound.unloadAsync().catch(()=>{});
     if(audioRef.current===created.sound){
      audioRef.current=null;
      setAudioPlaying(false);
      if(typeof onFinish==='function')onFinish();
     }
    }
   });
  }catch(e){console.warn('[Ex11] Audio',e);setAudioPlaying(false);}
 },[settings.sound,stopAudio]);
 const infAudio=()=>{
   const key=String(getInfo(item)?.audioFile || item?.audioFile || '').replace(/\.mp3$/i,'');
   return sounds[key]||sounds[`${key}.mp3`]||null;
 };
 const conjugatedAudio=()=>soundsconj[item?.mp3]||null;
 const begin=()=>{const next=makeDeck(pool,settings.count,settings.pinned);if(!next.length)return;
  totalsRef.current={earned:0,correct:0,wrong:0};setDeck(next);setIndex(0);setTyped([]);setStage(0);setFinished(false);setAwarded(0);setEarned(0);setCorrect(0);setWrong(0);attemptLock.current=false;setPhase('task');};
 const advance=async()=>{await stopAudio();if(index+1<deck.length){setIndex(i=>i+1);setTyped([]);setStage(0);setFinished(false);setAwarded(0);attemptLock.current=false;}else{
  setPhase('result');try{await updateStatistics('exercise11',(totalsRef.current.earned/deck.length).toFixed(2));}catch(e){console.warn('[Ex11] statistics',e);} }};
 const check=()=>{if(finished||typed.length!==[...target].length||attemptLock.current)return;attemptLock.current=true;
  if(typed.join('')===target){const points=SCORE[stage];totalsRef.current.earned+=points;totalsRef.current.correct++;setEarned(totalsRef.current.earned);setCorrect(totalsRef.current.correct);setAwarded(points);setFinished(true);if(settings.sound)playAudio(conjugatedAudio());}
  else if(stage===2){totalsRef.current.wrong++;setWrong(totalsRef.current.wrong);setAwarded(0);setFinished(true);if(settings.sound)playAudio(ERROR_SOUND,()=>playAudio(conjugatedAudio()));}
  else {setStage(s=>s+1);setTyped([]);if(settings.sound){if(stage===1)playAudio(ERROR_SOUND,()=>playAudio(conjugatedAudio()));else playAudio(ERROR_SOUND);}}
  attemptLock.current=false;
 };
 const toggle=(name,formId=item?.id)=>{
  if(formId==null)return;
  const selected=new Set(settings[name]);
  const wasSelected=selected.has(formId);
  if(wasSelected) selected.delete(formId); else selected.add(formId);
  const other=name==='excluded'?'pinned':'excluded';
  const opposite=new Set(settings[other]);
  if(!wasSelected) opposite.delete(formId);
  saveSettings({[name]:[...selected],[other]:[...opposite]});
 };
 // Some rows have an abbreviated display field (e.g. "You" instead of
 // "You will ..."). Prefer the fuller version only when it is an extension
 // of the same text; never substitute a different grammatical meaning.
 const translation=(()=>{
  const localized=String(item?.[LANG_FIELDS[language]]||'').trim();
  const alternate=String(item?.[FALLBACK_FIELDS[language]]||'').trim();
  const candidates=[localized,alternate].filter(Boolean);
  if(candidates.length===2){
   const [a,b]=candidates;
   const short=a.length<=b.length?a:b;
   const long=a.length>b.length?a:b;
   if(long.toLocaleLowerCase().startsWith(short.toLocaleLowerCase()) && long.length>short.length) return long;
  }
  return localized||alternate||item?.entext||item?.english||'';
 })();
 const showHelp=()=>Alert.alert(lang.name,lang.help);
 const goToMenu=()=>{
  if(navigation?.canGoBack?.()){navigation.goBack();return;}
  const menuRoute={ru:'Menu',en:'MenuEn',fr:'MenuFr',es:'MenuEs',pt:'MenuPt',ar:'MenuAr',am:'MenuAm'}[language]||'Menu';
  navigation?.navigate?.(menuRoute);
 };
 const showStats=async()=>{try{const data=await getStatistics('exercise11');setExerciseStats(data);Alert.alert(lang.statsTitle,`${lang.completed}: ${data?.timesCompleted??0}\n${lang.average}: ${Number(data?.averageCompletionRate??0).toFixed(2)}%`);}catch(e){Alert.alert(lang.name,lang.statsError);}};
 // Never split a word across rows. If both words do not fit, move the
 // ENTIRE verb to the second line and leave the pronoun at top right.
 const listOfLetters=[...target];
 const pronounLetters=[...(item?.pronoun||'')];
 // Account for the ScrollView/card's horizontal padding on narrow devices.
 const usableWidth=Math.max(210,screenWidth-66);
 const slotGap=3,wordGap=16;
 const required=listOfLetters.length;
 const rowWidth=(count,w)=>count>0?count*w+(count-1)*slotGap:0;
 const bothFit=(w)=>rowWidth(pronounLetters.length,w)+rowWidth(required,w)+(pronounLetters.length?wordGap:0)<=usableWidth;
 const verbFits=(w)=>rowWidth(required,w)<=usableWidth;
 const chooseWidth=()=>{
   for(const w of [34,32,30,28,26,24,22,20]){
     if(bothFit(w)||verbFits(w))return w;
   }
   return 20; // Exceptionally long single words cannot stay intact on a narrow screen.
 };
 const boxWidth=chooseWidth();
 const isSingleRow=bothFit(boxWidth);
 const firstCount=isSingleRow?required:0; // Only wrap between pronoun and verb
 const firstLetters=listOfLetters.slice(0,firstCount).map((ch,i)=>({ch,i}));
 const secondLetters=listOfLetters.slice(firstCount).map((ch,i)=>({ch,i:firstCount+i}));
 const slotWidthStyle={width:boxWidth,minWidth:boxWidth,paddingHorizontal:0};
 const renderVerbCells=entries=>entries.slice().reverse().map(({ch,i})=><View key={`verb-${i}`} style={[s.slot,slotWidthStyle,finished&&(awarded>0?s.slotGood:s.slotBad)]}><Text style={[s.slotText,boxWidth<30&&{fontSize:19}]}>{finished&&awarded===0?ch:typed[i]||' '}</Text></View>);
 const hint=stage>=1;const allowed=new Set(listOfLetters);const fullTranslit=String(item?.translit||'').trim()||'—';
 return <SafeAreaView style={s.screen} edges={phase==='settings'?['top','left','right']:['left','right']}>
  <View style={[s.page, Platform.OS==='ios'?{paddingBottom:5+safeInsets.bottom}:{paddingBottom:Math.max(5,safeInsets.bottom)}]}>
   {phase==='task'&&<View style={[s.topBar,compactScreen&&s.smallTopBar]}>
     <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.menu} onPress={()=>Alert.alert(lang.exitTitle,undefined,[{text:lang.cancel,style:'cancel'},{text:lang.exit,style:'destructive',onPress:()=>setPhase('settings')}])}>
       <Image source={ASSETS.logo} style={[s.logo,compactScreen&&s.smallLogo]}/>
     </TouchableOpacity>
     <View style={s.topButtons}>
       {[
         {id:'sound',source:settings.sound?ASSETS.on:ASSETS.off,label:lang.speaker,action:()=>saveSettings({sound:!settings.sound})},
         {id:'list',source:ASSETS.list,label:lang.settings,action:()=>setPhase('settings')},
         {id:'stats',source:ASSETS.stats,label:lang.score,action:showStats},
         {id:'help',source:ASSETS.help,label:lang.help,action:showHelp},
       ].map(x=><TouchableOpacity key={x.id} accessibilityRole="button" accessibilityLabel={x.label} onPress={x.action}><Image source={x.source} style={s.topIcon}/></TouchableOpacity>)}
     </View>
   </View>}
   {phase==='settings'&&<><View style={s.panel}><Text style={s.label}>{lang.count}</Text><View style={s.choiceRow}>{COUNTS.map(n=><TouchableOpacity key={n} onPress={()=>saveSettings({count:n})} style={[s.choice,settings.count===n&&s.choiceActive]}><Text style={s.choiceText}>{n}</Text></TouchableOpacity>)}</View><Text style={s.detail}>{lang.available}: {pool.length} / {all.length}</Text><Text style={s.help}>{shortIntro}</Text></View><TouchableOpacity disabled={!pool.length} onPress={begin} style={s.primary}><Text style={s.primaryText}>{lang.begin}</Text></TouchableOpacity></>}
   {phase==='task'&&item&&<><View style={[s.progressBox,compactScreen&&s.smallProgress,Platform.OS==='android'&&s.androidProgressBox]}>
      <View style={s.progressLeft}><Text style={s.progressLabel}>{lang.correctCount}: {correct}</Text><Text style={s.progressLabel}>{lang.wrongCount}: {wrong}</Text></View>
      <View style={s.progressNumberWrap}><Text style={s.progressNumber}>{Math.max(0,deck.length-index-(finished?1:0))}</Text></View>
      <View style={s.progressPercentWrap}><Text style={s.progressPercent}>{Math.round((earned+(finished?0:0))/Math.max(1,(index+(finished?1:0))*100)*100)}%</Text></View>
    </View><View style={[s.progressBarWrap,compactScreen&&s.smallProgressBarWrap,Platform.OS==='android'&&s.androidProgressBarWrap]}><ProgressBar progress={index+(finished?1:0)} totalExercises={deck.length}/></View>
    <ScrollView style={s.taskContent} contentContainerStyle={s.taskContentInner} keyboardShouldPersistTaps="always">
    <View style={[s.card,s.animatedCard,compactScreen&&s.smallVerbCard,Platform.OS==='android'&&s.androidVerbCard]}>
      <DynamicCardBackdrop motion={cardMotion} colors={['126,177,226','174,197,231']}/>
      <View style={[s.verbTwoColumns,compactScreen&&s.smallVerbColumns,Platform.OS==='android'&&s.androidVerbColumns]}>
        {/* Left column: infinitive, meaning, transliteration */}
        <View style={s.verbWordColumn}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.73} style={[s.compactInfinitive,compactScreen&&s.smallInfinitive]}>{item.infinitive}</Text>
          <Text numberOfLines={Platform.OS==='android'?2:1} adjustsFontSizeToFit minimumFontScale={0.75} style={[s.compactMeaning,compactScreen&&s.smallMeaning]}>{item[FALLBACK_FIELDS[language]]||item.english||''}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[s.compactTranslit,compactScreen&&s.smallTranslit]}>{getInfo(item)?.transliteration||item.transliteration||'—'}</Text>
        </View>
        {/* Right column: grammatical information */}
        <View style={s.verbInfoColumn}>
          <View style={[s.compactMetaPill,s.binyanPill,compactScreen&&s.smallMetaPill]}>
            
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.compactMetaValue}>{getBinyan(item)||'—'}</Text>
          </View>
          <View style={[s.compactMetaPill,s.rootPill,compactScreen&&s.smallMetaPill]}>
            
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.compactMetaValue}>{getRoot(item)||'—'}</Text>
          </View>
        </View>
      </View>
      <View style={[s.cardBottomRow,compactScreen&&s.smallCardBottom]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.speaker} onPress={()=>playAudio(infAudio())} disabled={!infAudio()||audioPlaying} style={s.listen}>
          <Image source={ASSETS.speaker} style={s.cardSpeakerIcon}/>
        </TouchableOpacity>
      <View style={s.tools}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.verbList} onPress={()=>setListOpen(true)} style={s.toolButton}>
          <Image source={ASSETS.list} style={s.toolIcon}/>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.excluded} accessibilityState={{selected:settings.excluded.includes(item.id)}} onPress={()=>toggle('excluded')} style={[s.toolButton,settings.excluded.includes(item.id)&&s.toolActive]}>
          <Image source={settings.excluded.includes(item.id)?ASSETS.hidden:ASSETS.hide} style={s.toolIcon}/>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.more} accessibilityState={{selected:settings.pinned.includes(item.id)}} onPress={()=>toggle('pinned')} style={[s.toolButton,settings.pinned.includes(item.id)&&s.toolActive]}>
          <Image source={settings.pinned.includes(item.id)?ASSETS.pinned:ASSETS.pin} style={s.toolIcon}/>
        </TouchableOpacity>
      </View>
      </View>
    </View>
    <View style={[s.taskTitleOutsideCard,compactScreen&&s.smallTaskTitleOutside,Platform.OS==='android'&&s.androidTaskTitle]}><Text style={s.taskPromptTitle}>{lang.meaning}</Text></View>
    <View style={[s.answerCard,compactScreen&&s.smallAnswerCard,Platform.OS==='android'&&s.androidAnswerCard]}>
      <DynamicCardBackdrop motion={cardMotion} colors={['185,155,218','226,166,187']} reverse/>
      <View style={[s.prompt,Platform.OS==='android'&&s.androidPrompt]}>
      <View style={s.translationRow}>
        {!!GENDER_ICONS[item.gender]&&<Image
          source={GENDER_ICONS[item.gender]}
          style={s.genderIconBesideText}
        />}
        <View style={s.centeredTranslationWrap}>
          <Text
             numberOfLines={2}
             ellipsizeMode="tail"
             style={[s.translation,rtl&&{writingDirection:'rtl'}]}
           >{translation}</Text>
        </View>
      </View>
      <View style={s.hintPlaceholder}>{(stage===2||finished)&&<View style={s.promptTranslitRow}>
        <Text style={s.promptTranslit}>{fullTranslit}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.speaker} disabled={!conjugatedAudio()||audioPlaying} onPress={()=>playAudio(conjugatedAudio())} style={s.promptSpeaker}>
          <Image source={ASSETS.speaker} style={s.hintSpeakerIcon}/>
        </TouchableOpacity>
      </View>}</View>
    </View>
    <View style={[s.phraseArea,Platform.OS==='android'&&s.androidPhraseArea]}>
      <View style={[s.phraseLine,Platform.OS==='android'&&s.androidPhraseLine]}>
        <View style={[s.slots,{flexShrink:0,flexWrap:'nowrap'}]}>{renderVerbCells(firstLetters)}</View>
        {!!pronounLetters.length&&<View style={[s.fixedSlots,{flexShrink:0,flexWrap:'nowrap',marginLeft:firstLetters.length?wordGap:0}]}>
          {pronounLetters.slice().reverse().map((ch,i)=><View key={`pron-${i}`} style={[s.slot,s.slotFixed,slotWidthStyle]}><Text style={[s.slotText,boxWidth<30&&{fontSize:19}]}>{ch}</Text></View>)}
        </View>}
      </View>
      <View style={[s.phraseLine,Platform.OS==='android'&&s.androidPhraseLine]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} contentContainerStyle={{flexGrow:1,justifyContent:'center',alignItems:'center'}}>
          <View style={[s.slots,{flexShrink:0,flexWrap:'nowrap'}]}>{renderVerbCells(secondLetters)}</View>
        </ScrollView>
      </View>
    </View>
    </View>
    <View style={[s.message,Platform.OS==='android'&&s.androidMessage]}>{finished?<Text style={[s.status,awarded>0?s.goodText:s.badText]}>{awarded>0?`${lang.right} +${awarded}%`:`${lang.lost} ${target}`}</Text>:stage===1?<Text style={s.badText}>{lang.wrong}</Text>:stage===2?<Text style={s.badText}>{lang.last}</Text>:<Text style={s.detail}>1 / 3 · 100%</Text>}</View>
    </ScrollView>
    <View style={[s.fixedFooter,compactScreen&&s.smallFooter,Platform.OS==='android'&&s.androidFooter]}>
    <View style={[s.keyboard,compactScreen&&s.compactKeyboard]}>{ROWS.map((row,i)=><View style={s.keyRow} key={i}>{[...row].map((letter,j)=>{const enabled=!hint||allowed.has(letter);return <TouchableOpacity key={j} disabled={!enabled||finished||typed.length===listOfLetters.length} onPress={()=>setTyped(old=>[...old,letter])} style={[s.key,compactScreen&&s.compactKey,hint&&allowed.has(letter)&&s.keyHint,!enabled&&s.keyDisabled]}><Text style={[s.keyText,!enabled&&s.keyTextDisabled]}>{letter}</Text></TouchableOpacity>;})}{i===0&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={lang.remove} disabled={!typed.length||finished} onPress={()=>setTyped(old=>old.slice(0,-1))} style={[s.key,compactScreen&&s.compactKey,s.backspaceKey,(!typed.length||finished)&&s.dim]}><Text style={s.backspaceIcon}>⌫</Text></TouchableOpacity>}</View>)}</View>
    <TouchableOpacity disabled={!finished&&typed.length!==listOfLetters.length} onPress={finished?advance:check} style={[s.primary,compactScreen&&s.compactFooterButton,!finished&&typed.length!==listOfLetters.length&&s.dim]}><Text style={s.primaryText}>{finished?(index+1===deck.length?lang.finish:lang.next):lang.check}</Text></TouchableOpacity>
    </View>
   </>}
   {phase==='result'&&<View style={s.resultCenter}><View style={[s.panel,s.resultPanel]}><Text style={s.resultTitle}>{lang.score}</Text><Text style={s.resultNumber}>{Math.round(totalsRef.current.earned/deck.length)}%</Text><Text style={s.resultSub}>✓ {correct}     ✕ {wrong}     {correct+wrong} / {deck.length}</Text><TouchableOpacity onPress={begin} style={s.primary}><Text style={s.primaryText}>{lang.repeat}</Text></TouchableOpacity><TouchableOpacity onPress={goToMenu} style={s.secondary}><Text style={s.eraseText}>{lang.menu}</Text></TouchableOpacity></View></View>}
  </View>
  <Modal visible={listOpen} transparent animationType="fade" onRequestClose={()=>setListOpen(false)}>
   <View style={s.modalShade}><View style={s.modalCard}>
    <Text style={s.modalTitle}>{lang.verbList}</Text>
    <ScrollView style={s.modalList}>
     {all.filter(x=>settings.excluded.includes(x.id)||settings.pinned.includes(x.id)).map(x=><View key={x.id} style={s.modalEntry}>
       <View style={{flex:1,paddingRight:8}}>
         <Text style={s.modalVerb} writingDirection="rtl">{x.full}</Text>
         <Text style={{fontSize:13,color:'#526A86'}}>{x[LANG_FIELDS[language]]||x.russiantext||''}</Text>
         <Text style={{fontSize:12,color:'#71829B'}}>{x.infinitive} · {x.translit||''}</Text>
       </View>
       <View style={s.modalActions}>
        <TouchableOpacity accessibilityLabel={lang.excluded} onPress={()=>toggle('excluded',x.id)} style={[s.toolButton,settings.excluded.includes(x.id)&&s.toolActive]}><Image style={s.toolIcon} source={settings.excluded.includes(x.id)?ASSETS.hidden:ASSETS.hide}/></TouchableOpacity>
        <TouchableOpacity accessibilityLabel={lang.more} onPress={()=>toggle('pinned',x.id)} style={[s.toolButton,settings.pinned.includes(x.id)&&s.toolActive]}><Image style={s.toolIcon} source={settings.pinned.includes(x.id)?ASSETS.pinned:ASSETS.pin}/></TouchableOpacity>
       </View>
      </View>)}
     {!all.some(x=>settings.excluded.includes(x.id)||settings.pinned.includes(x.id))&&<Text style={{textAlign:'center',color:'#607590',padding:20}}>{lang.emptyList}</Text>}
    </ScrollView>
    <TouchableOpacity onPress={()=>setListOpen(false)} style={s.modalClose}><Text style={s.primaryText}>{lang.close}</Text></TouchableOpacity>
   </View></View>
  </Modal>
 </SafeAreaView>;
}
// Soft moving gradient similar to the cards in Exercise 9.
function DynamicCardBackdrop({motion,colors,reverse=false}){
 const direction=reverse?-1:1;
 return <View pointerEvents="none" style={StyleSheet.absoluteFillObject} accessible={false}>
  {colors.map((rgb,i)=><Animated.View key={i} style={{position:'absolute',width:'135%',height:'185%',top:i===0?'-78%':'-34%',left:i===0?'-48%':'8%',transform:[{translateX:motion.interpolate({inputRange:[0,1],outputRange:[(-28+i*15)*direction,(40-i*19)*direction]})},{translateY:motion.interpolate({inputRange:[0,1],outputRange:[i?-12:8,i?14:-9]})},{scale:motion.interpolate({inputRange:[0,1],outputRange:[1,1.17]})}]}}>
   <LinearGradient colors={[`rgba(${rgb},0)`,`rgba(${rgb},0.07)`,`rgba(${rgb},0.35)`,`rgba(${rgb},0.10)`,`rgba(${rgb},0)`]} start={{x:0,y:i}} end={{x:1,y:1-i}} style={StyleSheet.absoluteFillObject}/>
  </Animated.View>)}
 </View>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#AFC1D0'},scroll:{paddingHorizontal:12,paddingTop:4,paddingBottom:30},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},back:{fontSize:36,color:'#526D9D'},title:{fontSize:20,fontWeight:'700',color:'#263A5A'},sound:{fontSize:22},panel:{backgroundColor:'#FFFDEF',borderRadius:17,padding:18,marginBottom:14},label:{fontWeight:'700',color:'#435978',fontSize:15},choiceRow:{flexDirection:'row',gap:9,marginVertical:12},choice:{flex:1,padding:12,borderRadius:9,backgroundColor:'#EAF0FA',alignItems:'center'},choiceActive:{backgroundColor:'#91BFEF'},choiceText:{fontSize:16,fontWeight:'700',color:'#253C62'},detail:{color:'#6D7C94',fontSize:12},help:{color:'#445570',lineHeight:22,marginTop:20},primary:{backgroundColor:'#377ACB',borderRadius:13,paddingVertical:15,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontWeight:'800',fontSize:16},dim:{opacity:0.4},progress:{flexDirection:'row',justifyContent:'space-between',marginVertical:8},progressText:{fontWeight:'700',color:'#637797'},track:{height:5,backgroundColor:'#DCE5F2',borderRadius:4,overflow:'hidden',marginBottom:13},trackFill:{height:5,backgroundColor:'#3986D0'},topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',minHeight:74},logo:{width:74,height:74,resizeMode:'contain',marginLeft:8},topButtons:{flexDirection:'row',alignItems:'center',gap:8,marginRight:8},topIcon:{width:38,height:38,resizeMode:'contain'},progressBox:{flexDirection:'row',alignItems:'center',backgroundColor:'#6C8EBB',borderRadius:10,minHeight:48,marginTop:-7,marginBottom:8,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:4,elevation:5},progressLeft:{flex:1,justifyContent:'center',paddingLeft:14},progressLabel:{color:'#FFFFFF',fontSize:12,lineHeight:17},progressNumberWrap:{backgroundColor:'#83A3CD',marginRight:10,paddingHorizontal:8,borderRadius:10,minWidth:44,alignItems:'center'},progressNumber:{color:'#FFFFFF',fontSize:20,fontWeight:'bold'},progressPercentWrap:{backgroundColor:'#83A3CD',marginRight:10,paddingHorizontal:8,borderRadius:10,minWidth:68,alignItems:'center'},progressPercent:{color:'#FFFFFF',fontSize:20,fontWeight:'bold'},progressBarWrap:{marginBottom:8},speakerIcon:{width:26,height:26,resizeMode:'contain'},translitHint:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap'},backspaceKey:{backgroundColor:'#E0E9F5',borderColor:'#83A3CD'},backspaceIcon:{fontSize:28,color:'#375D90',fontWeight:'700'},card:{borderWidth:1,borderColor:'#CCD9E9',backgroundColor:'#EEF2F7',padding:15,borderRadius:16,alignItems:'center'},cardHeading:{fontSize:11,fontWeight:'700',letterSpacing:1,color:'#6A83A8'},infinitive:{fontSize:32,fontWeight:'700',color:'#2A4468',marginTop:7},meaning:{fontSize:14,fontWeight:'400',color:'#3E5475',marginVertical:6},meta:{fontSize:13,color:'#586F8D',marginTop:4},grid:{flexDirection:'row',gap:14,marginTop:7},listen:{padding:8,marginTop:6},listenText:{fontSize:13,color:'#3269AB',fontWeight:'700'},tools:{width:'100%',flexDirection:'row',justifyContent:'space-around',borderTopWidth:1,borderTopColor:'#C4D6F0',marginTop:8,paddingTop:8},toolText:{fontSize:12,color:'#53739E'},prompt:{minHeight:74,alignItems:'center',justifyContent:'center',padding:8},promptHint:{color:'#7890AF',fontSize:12},translation:{fontSize:21,fontWeight:'700',color:'#293B5E',textAlign:'center',marginTop:5},pronoun:{fontSize:21,color:'#2A436B',marginTop:4},phraseSlots:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:19,marginVertical:8,flexWrap:'wrap'},slots:{flexDirection:'row',justifyContent:'center',gap:3},fixedSlots:{flexDirection:'row',justifyContent:'center',gap:3},slotFixed:{backgroundColor:'#E2EAF6',borderColor:'#B9CBE3'},slot:{minWidth:34,height:43,borderRadius:8,borderWidth:1,borderColor:'#AEBED2',backgroundColor:'#FFF',justifyContent:'center',alignItems:'center',paddingHorizontal:3},slotText:{fontSize:22,fontWeight:'700',color:'#2E4061'},slotGood:{backgroundColor:'#E0F6E8',borderColor:'#4BA86C'},slotBad:{backgroundColor:'#FFF0EC',borderColor:'#D87269'},message:{minHeight:52,justifyContent:'center',alignItems:'center'},status:{fontSize:15,fontWeight:'700',textAlign:'center'},goodText:{color:'#238253',fontWeight:'700',textAlign:'center'},badText:{color:'#C2574C',fontWeight:'700',textAlign:'center'},keyboard:{gap:4,marginTop:5},keyRow:{flexDirection:'row',justifyContent:'center',gap:3},key:{flex:1,height:42,maxWidth:44,borderRadius:7,backgroundColor:'#FFF',borderWidth:1,borderColor:'#D5DBE7',justifyContent:'center',alignItems:'center'},keyHint:{backgroundColor:'#D7F1E0',borderColor:'#60B180'},keyDisabled:{backgroundColor:'#EAEDF3',opacity:0.28},keyText:{fontSize:20,fontWeight:'600',color:'#344764'},keyTextDisabled:{color:'#A4ADBE'},erase:{alignSelf:'flex-end',marginTop:10,borderRadius:8,borderWidth:1,borderColor:'#D4DEEB',paddingHorizontal:15,paddingVertical:9,backgroundColor:'#FFF'},eraseText:{fontSize:14,color:'#43648E',fontWeight:'700'},resultTitle:{textAlign:'center',fontSize:22,fontWeight:'700',color:'#2F4B70'},resultNumber:{fontSize:58,color:'#3786C6',fontWeight:'800',textAlign:'center',margin:20},resultSub:{color:'#556D8A',fontSize:18,textAlign:'center',marginBottom:16},secondary:{alignItems:'center',padding:16},
card:{borderWidth:1,borderColor:'#BDD1E7',backgroundColor:'#F0F5FB',paddingHorizontal:12,paddingTop:9,paddingBottom:8,borderRadius:15,alignItems:'center'},
cardHeading:{fontSize:10,fontWeight:'700',letterSpacing:0.6,color:'#6D83A1',marginBottom:2},
cardMainRow:{width:'100%',flexDirection:'row',justifyContent:'center',alignItems:'center',paddingHorizontal:12},
infinitiveBlock:{flex:1,alignItems:'center',paddingLeft:42},
infinitive:{fontSize:28,fontWeight:'700',color:'#254A79',marginTop:0},
meaning:{fontSize:14,fontWeight:'600',color:'#4C6688',marginVertical:0},
listen:{width:42,height:40,alignItems:'center',justifyContent:'center',marginTop:0,backgroundColor:'#DDEAF8',borderRadius:11},
infTranslitBox:{backgroundColor:'#E1ECF9',borderRadius:8,paddingHorizontal:12,paddingVertical:3,marginTop:4},
infTranslit:{color:'#316594',fontSize:13,fontWeight:'600'},
grid:{flexDirection:'row',gap:9,marginTop:6,width:'100%'},
metaPill:{flex:1,borderRadius:9,paddingVertical:5,paddingHorizontal:7,alignItems:'center'},
binyanPill:{backgroundColor:'#AFD0F4'},
rootPill:{backgroundColor:'#C8B9EB'},
metaTitle:{fontSize:10,color:'#667C9A',fontWeight:'600'},
metaValue:{fontSize:14,color:'#304F7C',fontWeight:'700'},
tools:{width:'100%',flexDirection:'row',justifyContent:'center',gap:18,marginTop:6,paddingTop:5,borderTopWidth:1,borderTopColor:'#D6E1EF'},
toolButton:{width:38,height:33,justifyContent:'center',alignItems:'center',borderRadius:9},
toolActive:{backgroundColor:'#D4E6F8'},
toolIcon:{width:27,height:27,resizeMode:'contain'},
prompt:{minHeight:80,alignItems:'center',justifyContent:'center',paddingVertical:5,paddingHorizontal:8},
promptTranslitRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:4,backgroundColor:'#E7F0FA',borderRadius:9,paddingLeft:13,paddingRight:5,minHeight:33},
promptTranslit:{fontSize:16,fontWeight:'600',color:'#376491'},
promptSpeaker:{padding:3},
phraseSlots:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:19,marginVertical:8,flexWrap:'wrap'}
,page:{flex:1,paddingHorizontal:12,paddingTop:4,paddingBottom:5},
taskContent:{flex:1},taskContentInner:{paddingBottom:8,flexGrow:0},
fixedFooter:{flexShrink:0,paddingBottom:0,paddingTop:0,marginBottom:0,backgroundColor:'transparent'},
card:{borderWidth:1,borderColor:'#BDD1E7',backgroundColor:'#F0F5FB',paddingHorizontal:12,paddingTop:8,paddingBottom:7,borderRadius:15,alignItems:'center'},
infinitive:{fontSize:35,fontWeight:'700',color:'#254A79',marginTop:0},
metaValue:{fontSize:18,color:'#304F7C',fontWeight:'700'},
cardBottomRow:{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:5},
listen:{width:32,height:32,alignItems:'center',justifyContent:'center',backgroundColor:'transparent',borderRadius:9},
cardSpeakerIcon:{width:20,height:20,resizeMode:'contain'},
tools:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:9,paddingTop:0,marginTop:0,borderTopWidth:0,width:'auto'},
toolButton:{width:34,height:32,justifyContent:'center',alignItems:'center',borderRadius:8},
toolIcon:{width:27,height:27,resizeMode:'contain'},
prompt:{height:114,minHeight:114,alignItems:'center',justifyContent:'center',paddingVertical:4,paddingHorizontal:8},
hintPlaceholder:{height:35,justifyContent:'center',alignItems:'center',width:'100%'},
promptTranslitRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,marginTop:0,minHeight:30,backgroundColor:'transparent',paddingHorizontal:0},
promptTranslit:{fontSize:15,fontWeight:'700',color:'#C65755'},
promptSpeaker:{padding:3,width:29,height:29,alignItems:'center',justifyContent:'center'},
hintSpeakerIcon:{width:19,height:19,resizeMode:'contain'},
phraseSlots:{flexDirection:'row',justifyContent:'center',alignItems:'center',columnGap:26,rowGap:5,marginVertical:7,flexWrap:'wrap'},
phraseArea:{height:99,minHeight:99,justifyContent:'center',marginVertical:4},
phraseLine:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'center'},
translationRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,maxWidth:'100%'},
genderIcon:{width:34,height:34,resizeMode:'contain'},
message:{height:48,minHeight:48,justifyContent:'center',alignItems:'center'},
keyboard:{gap:4,marginTop:0},
primary:{backgroundColor:'#377ACB',borderRadius:13,paddingVertical:14,alignItems:'center',marginTop:9}
,modalShade:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',padding:22},
modalCard:{backgroundColor:'#F2F6FC',borderRadius:16,padding:14,maxHeight:'82%'},
modalTitle:{fontSize:19,fontWeight:'700',color:'#24476C',textAlign:'center',marginBottom:9},
modalList:{flexGrow:0},modalEntry:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:1,borderBottomColor:'#DAE4F0'},
modalVerb:{fontSize:20,color:'#27496E',fontWeight:'700'},modalActions:{flexDirection:'row',gap:10},
modalClose:{marginTop:12,backgroundColor:'#377ACB',padding:12,borderRadius:10,alignItems:'center'},

// Exercise 11: compact, symmetric card and stable two-line task area.
infinitiveBlock:{flex:1,alignItems:'center',justifyContent:'center',paddingLeft:0,paddingRight:0},
cardMainRow:{width:'100%',flexDirection:'row',justifyContent:'center',alignItems:'center',paddingHorizontal:0},
infinitive:{fontSize:35,fontWeight:'700',color:'#204D86',marginTop:0,textAlign:'center',width:'100%'},
meaning:{fontSize:14,fontWeight:'700',color:'#8350A0',marginVertical:1,textAlign:'center',width:'100%'},
infTranslitBox:{backgroundColor:'#E1F0ED',borderRadius:8,paddingHorizontal:12,paddingVertical:3,marginTop:4,alignItems:'center',alignSelf:'center'},
infTranslit:{fontSize:14,fontWeight:'700',color:'#167A73',textAlign:'center'},
prompt:{height:114,minHeight:114,alignItems:'center',justifyContent:'flex-start',paddingTop:5,paddingBottom:3,paddingHorizontal:8,backgroundColor:'#EEF2F7',borderWidth:1,borderColor:'#CCD9E9',borderRadius:16,marginTop:8},
promptHint:{fontSize:16,lineHeight:22,fontWeight:'800',color:'#235E9B',textAlign:'center'},
translationRow:{width:'100%',minHeight:42,flexDirection:'row',justifyContent:'center',alignItems:'center',marginTop:11,paddingHorizontal:8,gap:5},
translation:{flexShrink:1,fontSize:24,lineHeight:30,fontWeight:'700',color:'#253C67',textAlign:'center',marginTop:0},
genderIcon:{width:25,height:25,resizeMode:'contain'},
hintPlaceholder:{height:35,justifyContent:'center',alignItems:'center',width:'100%'}
,
animatedCard:{overflow:'hidden',position:'relative',backgroundColor:'#EDF2FA'},
taskPromptTitle:{fontSize:18,lineHeight:25,fontFamily:'mt-bold',fontWeight:'800',textAlign:'center',color:'#255C98',marginTop:12,marginBottom:7},
answerCard:{backgroundColor:'#F3EFF9',borderWidth:1,borderColor:'#C4C7E2',borderRadius:15,overflow:'hidden',paddingVertical:6,paddingHorizontal:7,position:'relative'},
prompt:{height:109,minHeight:109,alignItems:'center',justifyContent:'center',paddingHorizontal:6,paddingVertical:0,backgroundColor:'transparent',borderWidth:0,marginTop:0,borderRadius:0},
phraseArea:{height:99,minHeight:99,justifyContent:'center',marginVertical:2},
message:{height:32,minHeight:32,justifyContent:'flex-start',alignItems:'center',paddingTop:5,marginTop:0},
// Keep task heading outside both animated cards and prevent a tall top toolbar.
topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',height:55,minHeight:55,marginTop:0,marginBottom:0},
logo:{width:56,height:56,resizeMode:'contain',marginLeft:8},
topButtons:{flexDirection:'row',alignItems:'center',gap:7,marginRight:8},
topIcon:{width:34,height:34,resizeMode:'contain'},
progressBox:{flexDirection:'row',alignItems:'center',backgroundColor:'#6C8EBB',borderRadius:10,minHeight:48,marginTop:1,marginBottom:8,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:4,elevation:5},
page:{flex:1,paddingHorizontal:12,paddingTop:0,paddingBottom:5,backgroundColor:'#AFC1D0'},
taskTitleOutsideCard:{width:'100%',alignItems:'center',justifyContent:'center',paddingTop:9,paddingBottom:9,backgroundColor:'transparent'},
taskPromptTitle:{fontSize:16,lineHeight:22,fontFamily:'mt-bold',fontWeight:'800',textAlign:'center',color:'#255C98',marginTop:0,marginBottom:0},
answerCard:{backgroundColor:'#F3EFF9',borderWidth:1,borderColor:'#C4C7E2',borderRadius:15,overflow:'hidden',paddingTop:4,paddingBottom:10,paddingHorizontal:7,position:'relative'},
// Compact task card, retaining two full rows of Hebrew cells and a permanent hint slot.
prompt:{height:74,minHeight:74,alignItems:'center',justifyContent:'center',paddingHorizontal:6,paddingVertical:0,backgroundColor:'transparent',borderWidth:0,marginTop:0,borderRadius:0},
translationRow:{width:'100%',minHeight:49,justifyContent:'center',alignItems:'center',marginTop:0,paddingHorizontal:0,position:'relative'},
centeredTranslationWrap:{width:'100%',paddingHorizontal:52,alignSelf:'center',alignItems:'center',justifyContent:'center'},
genderIconBesideText:{position:'absolute',left:2,width:40,height:40,resizeMode:'contain',top:'50%',transform:[{translateY:-20}],zIndex:2},
translation:{width:'100%',flexShrink:1,fontSize:23,lineHeight:28,fontWeight:'700',color:'#253C67',textAlign:'center',marginTop:0,includeFontPadding:false},
hintPlaceholder:{height:30,justifyContent:'center',alignItems:'center',width:'100%'},
phraseArea:{height:104,minHeight:104,justifyContent:'center',marginTop:3,marginBottom:2},
phraseLine:{height:46,flexDirection:'row',alignItems:'center',justifyContent:'center'},
// Horizontal verb card: compact grammatical column at left, word details at right.
card:{borderWidth:1,borderColor:'#BDD1E7',backgroundColor:'#F0F5FB',paddingHorizontal:10,paddingTop:7,paddingBottom:5,borderRadius:15,alignItems:'center'},
verbTwoColumns:{direction:'ltr',width:'100%',flexDirection:'row',alignItems:'stretch',columnGap:9,minHeight:91},
verbInfoColumn:{position:'absolute',right:0,width:'39%',width:'39%',justifyContent:'center',gap:5},
verbWordColumn:{position:'absolute',left:0,width:'58%',flex:1,minWidth:0,alignItems:'center',justifyContent:'center',gap:2,paddingHorizontal:3},
compactMetaPill:{minHeight:31,borderRadius:9,paddingVertical:2,paddingHorizontal:5,alignItems:'center',justifyContent:'center'},
compactMetaValue:{fontSize:16,lineHeight:19,color:'#304F7C',fontWeight:'700',textAlign:'center'},
compactInfinitive:{fontSize:30,lineHeight:37,fontWeight:'700',color:'#204D86',textAlign:'center',width:'100%'},
compactMeaning:{fontSize:15,lineHeight:18,fontWeight:'700',color:'#8350A0',textAlign:'center',width:'100%'},
compactTranslit:{fontSize:13,lineHeight:17,fontWeight:'700',color:'#167A73',textAlign:'center',width:'100%'},
cardBottomRow:{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:3},
// Use physical left/right positioning: RTL mirroring must not swap columns.
verbTwoColumns:{direction:'ltr',width:'100%',height:96,position:'relative',flexDirection:'row'},
verbWordColumn:{position:'absolute',left:0,top:0,bottom:0,width:'58%',justifyContent:'center',alignItems:'center'},
verbInfoColumn:{position:'absolute',right:0,top:0,bottom:0,width:'39%',justifyContent:'center',gap:5},
phraseLine:{direction:'ltr',width:'100%',height:49,flexDirection:'row',flexWrap:'nowrap',alignItems:'center',justifyContent:'center',overflow:'hidden'},
slots:{flexDirection:'row',flexShrink:0,flexWrap:'nowrap',justifyContent:'center',gap:3},
fixedSlots:{flexDirection:'row',flexShrink:0,flexWrap:'nowrap',justifyContent:'center',gap:3}

// Short displays (e.g. iPhone 16e): recover vertical space above the fixed keyboard.
// Preserve the two full Hebrew rows and the keyboard's touch targets.
,smallTopBar:{height:49,minHeight:49},
smallLogo:{width:50,height:50},
smallProgress:{minHeight:43,marginBottom:5},
smallProgressBarWrap:{marginBottom:8},
smallVerbCard:{paddingTop:4,paddingBottom:3},
smallVerbColumns:{height:77,minHeight:77},
smallInfinitive:{fontSize:27,lineHeight:31},
smallMeaning:{fontSize:14,lineHeight:17},
smallTranslit:{fontSize:12,lineHeight:15},
smallMetaPill:{minHeight:29,paddingVertical:2},
smallCardBottom:{marginTop:0},
smallTaskTitleOutside:{paddingTop:5,paddingBottom:5},
smallAnswerCard:{paddingTop:3,paddingBottom:7},
smallFooter: {
  paddingTop: 0,
  paddingBottom: 0,
  marginBottom: 0
},
androidFooter:{marginBottom:-38,paddingBottom:0},
androidProgressBox:{marginBottom:4},
androidProgressBarWrap:{marginBottom:12},
compactKeyboard:{gap:3,marginTop:0},
compactKey:{height:39},
compactFooterButton:{paddingVertical:11,marginTop:7},
// Android only: return the keyboard and CHECK closer to the previous bottom position
// and restore a little breathing room inside both cards. iOS is unchanged.
androidVerbCard:{paddingTop:5,paddingBottom:5},
androidVerbColumns:{height:72,minHeight:72},
androidTaskTitle:{paddingTop:5,paddingBottom:5},
androidAnswerCard:{paddingTop:5,paddingBottom:6},
androidPrompt:{height:88,minHeight:88},
androidPhraseArea:{height:100,minHeight:100,marginTop:2,marginBottom:2},
androidPhraseLine:{height:46},
androidMessage:{height:30,minHeight:30,paddingTop:3},
 resultCenter:{flex:1,justifyContent:'center',alignItems:'stretch',paddingHorizontal:7,paddingBottom:8},
 resultPanel:{marginBottom:0,width:'100%'}
});
