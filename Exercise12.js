import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {Audio} from 'expo-av';
import {updateStatistics, getStatistics} from './stat';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';
import ProgressBar from './ProgressBar';
import sentenceData from './sentences.json';
import sentenceSounds from './sentenceSounds';
import {normalizeData} from './sentenceCore';

// Exercise 12: a contextual verb-writing task. No transliteration is ever shown.
const KEYS = ['קראטוןםפ', 'שדגכעיחלךף', 'זסבהנמצתץ'];
const COUNTS = [8, 12, 18, 24];
const TENSES = ['present', 'past', 'future'];
const NIKKUD = /[\u0591-\u05C7]/g;
const SCORE = [100, 70, 40];
const SOUND_OK = require('./assets/sounds/success_root.mp3');
const SOUND_NO = require('./assets/sounds/failure_root.mp3');
const ICONS = {
  logo: require('./VERBIFY.png'), on: require('./SoundOn.png'), off: require('./SoundOff.png'),
  speaker: require('./speaker3.png'), list: require('./spisok2.png'), stats: require('./stat.png'), help: require('./question.png'),
  hide: require('./glaz1.png'), hidden: require('./glaz2.png'), pin: require('./gant1.png'),
  pinned: require('./gant2.png'),
};
const GENDER_ICONS = {man:require('./man1.png'),woman:require('./woman1.png'),men:require('./men1.png'),women:require('./women1.png')};
const I18N = {
  ru: {title:'Напиши глагол в предложении',start:'НАЧАТЬ',check:'ПРОВЕРИТЬ',next:'ДАЛЕЕ',finish:'ЗАВЕРШИТЬ',again:'ЕЩЁ РАЗ',menu:'В МЕНЮ',count:'Количество заданий',tense:'Времена',present:'Настоящее',past:'Прошедшее',future:'Будущее',write:'Напишите пропущенный глагол',inf:'Инфинитив',listen:'Прослушать',hint:'Теперь можно прослушать предложение',wrong:'Неверно. Нужные буквы подсвечены.',last:'Попробуйте ещё раз. Доступна озвучка.',right:'Правильно!',answer:'Правильный ответ:',correct:'Верно',mistakes:'Неверно',score:'Результат',available:'Доступно',empty:'Нет подходящих предложений',exit:'Выйти из упражнения?',exitBody:'Текущий прогресс не будет сохранён.',cancel:'Отмена',leave:'Выйти',excluded:'Исключить',pinned:'Чаще',stats:'Статистика упражнения 12',completed:'Завершено',average:'Средний результат',help:'Заполните пропуск в предложении на иврите, набирая форму глагола по буквам. Перевод поможет понять контекст. Первая попытка — 100%, вторая — 70% (нужные буквы подсвечены), третья — 40% (можно прослушать полное предложение). Транслитерации нет.'},
  en: {title:'Write the Verb in the Sentence',start:'START',check:'CHECK',next:'NEXT',finish:'FINISH',again:'TRY AGAIN',menu:'MENU',count:'Number of questions',tense:'Tenses',present:'Present',past:'Past',future:'Future',write:'Write the missing verb',inf:'Infinitive',listen:'Listen',hint:'You can now listen to the sentence',wrong:'Not quite. Required letters are highlighted.',last:'Try again. Sentence audio is available.',right:'Correct!',answer:'Correct answer:',correct:'Right',mistakes:'Wrong',score:'Result',available:'Available',empty:'No available sentences',exit:'Leave exercise?',exitBody:'Your current progress will not be saved.',cancel:'Cancel',leave:'Leave',excluded:'Exclude',pinned:'More often',stats:'Exercise 12 statistics',completed:'Completed',average:'Average result',help:'Complete the Hebrew sentence by typing the missing verb letter by letter. Use the translation for context. First try: 100%; second: 70% (required letters highlighted); third: 40% (full sentence audio available). No transliteration.'},
  fr: {title:'Écrivez le verbe dans la phrase',start:'COMMENCER',check:'VÉRIFIER',next:'SUIVANT',finish:'TERMINER',again:'RECOMMENCER',menu:'MENU',count:'Nombre de questions',tense:'Temps',present:'Présent',past:'Passé',future:'Futur',write:'Écrivez le verbe manquant',inf:'Infinitif',listen:'Écouter',hint:'Vous pouvez écouter la phrase',wrong:'Incorrect. Les lettres nécessaires sont surlignées.',last:'Réessayez. L’audio est disponible.',right:'Correct !',answer:'Bonne réponse :',correct:'Juste',mistakes:'Faux',score:'Résultat',available:'Disponibles',empty:'Aucune phrase disponible',exit:'Quitter l’exercice ?',exitBody:'La progression ne sera pas enregistrée.',cancel:'Annuler',leave:'Quitter',excluded:'Exclure',pinned:'Plus souvent',stats:'Statistiques de l’exercice 12',completed:'Terminés',average:'Résultat moyen',help:'Complétez la phrase hébraïque en saisissant les lettres du verbe. 1er essai : 100 %. 2e : 70 %, lettres surlignées. 3e : 40 %, écoute de la phrase. Aucune translittération.'},
  es: {title:'Escribe el verbo en la oración',start:'EMPEZAR',check:'COMPROBAR',next:'SIGUIENTE',finish:'FINALIZAR',again:'REPETIR',menu:'MENÚ',count:'Número de preguntas',tense:'Tiempos',present:'Presente',past:'Pasado',future:'Futuro',write:'Escribe el verbo que falta',inf:'Infinitivo',listen:'Escuchar',hint:'Ya puedes escuchar la oración',wrong:'Incorrecto. Las letras necesarias están resaltadas.',last:'Inténtalo de nuevo. Puedes escuchar la oración.',right:'¡Correcto!',answer:'Respuesta correcta:',correct:'Bien',mistakes:'Mal',score:'Resultado',available:'Disponibles',empty:'No hay oraciones disponibles',exit:'¿Salir del ejercicio?',exitBody:'No se guardará el progreso actual.',cancel:'Cancelar',leave:'Salir',excluded:'Excluir',pinned:'Más a menudo',stats:'Estadísticas del ejercicio 12',completed:'Completados',average:'Resultado medio',help:'Completa la oración hebrea escribiendo el verbo letra por letra. Primer intento: 100 %. Segundo: 70 %, letras destacadas. Tercero: 40 %, audio disponible. Sin transliteración.'},
  pt: {title:'Escreva o verbo na frase',start:'COMEÇAR',check:'VERIFICAR',next:'PRÓXIMO',finish:'CONCLUIR',again:'TENTAR DE NOVO',menu:'MENU',count:'Número de questões',tense:'Tempos',present:'Presente',past:'Passado',future:'Futuro',write:'Escreva o verbo em falta',inf:'Infinitivo',listen:'Ouvir',hint:'Agora pode ouvir a frase',wrong:'Incorreto. As letras necessárias estão destacadas.',last:'Tente novamente. Pode ouvir a frase.',right:'Correto!',answer:'Resposta correta:',correct:'Certo',mistakes:'Errado',score:'Resultado',available:'Disponíveis',empty:'Sem frases disponíveis',exit:'Sair do exercício?',exitBody:'O progresso atual não será guardado.',cancel:'Cancelar',leave:'Sair',excluded:'Excluir',pinned:'Mais vezes',stats:'Estatísticas do exercício 12',completed:'Concluídos',average:'Resultado médio',help:'Complete a frase em hebraico escrevendo o verbo letra a letra. Primeira tentativa: 100%. Segunda: 70%, letras destacadas. Terceira: 40%, áudio disponível. Sem transliteração.'},
  ar: {title:'اكتب الفعل في الجملة',start:'ابدأ',check:'تحقّق',next:'التالي',finish:'إنهاء',again:'حاول مجددًا',menu:'القائمة',count:'عدد الأسئلة',tense:'الأزمنة',present:'الحاضر',past:'الماضي',future:'المستقبل',write:'اكتب الفعل الناقص',inf:'المصدر',listen:'استمع',hint:'يمكنك الآن الاستماع إلى الجملة',wrong:'غير صحيح. تم تمييز الحروف المطلوبة.',last:'حاول مجددًا. يمكنك الاستماع الآن.',right:'صحيح!',answer:'الإجابة الصحيحة:',correct:'صحيح',mistakes:'خطأ',score:'النتيجة',available:'المتاح',empty:'لا توجد جمل متاحة',exit:'مغادرة التمرين؟',exitBody:'لن يتم حفظ التقدم الحالي.',cancel:'إلغاء',leave:'خروج',excluded:'استبعاد',pinned:'تكرار أكثر',stats:'إحصاءات التمرين 12',completed:'المكتمل',average:'متوسط النتيجة',help:'أكمل الجملة العبرية بكتابة الفعل حرفًا حرفًا. المحاولة الأولى 100٪، الثانية 70٪ مع تمييز الحروف، والثالثة 40٪ مع إمكانية الاستماع. بدون كتابة صوتية.'},
  am: {title:'በዓረፍተ ነገሩ ውስጥ ግሱን ይጻፉ',start:'ጀምር',check:'አረጋግጥ',next:'ቀጣይ',finish:'ጨርስ',again:'እንደገና ሞክር',menu:'ምናሌ',count:'የጥያቄዎች ብዛት',tense:'ጊዜዎች',present:'የአሁን',past:'ያለፈ',future:'የወደፊት',write:'የጎደለውን ግስ ይጻፉ',inf:'የግስ መነሻ',listen:'አዳምጥ',hint:'አሁን ዓረፍተ ነገሩን ማዳመጥ ይችላሉ',wrong:'ትክክል አይደለም። አስፈላጊ ፊደላት ተለይተዋል።',last:'እንደገና ይሞክሩ። ድምፅ አለ።',right:'ትክክል!',answer:'ትክክለኛው መልስ:',correct:'ትክክል',mistakes:'ስህተት',score:'ውጤት',available:'የሚገኙ',empty:'የሚገኙ ዓረፍተ ነገሮች የሉም',exit:'ከልምምዱ ይውጡ?',exitBody:'የአሁኑ እድገት አይቀመጥም።',cancel:'ሰርዝ',leave:'ውጣ',excluded:'አስወግድ',pinned:'በብዛት',stats:'የ12ኛው ልምምድ ስታቲስቲክስ',completed:'ተጠናቋል',average:'አማካይ ውጤት',help:'በዕብራይስጥ ዓረፍተ ነገር ውስጥ የጎደለውን ግስ በፊደላት ይሙሉ። መጀመሪያ 100%፣ ሁለተኛ 70%፣ ሦስተኛ 40% እና ድምፅ። ትራንስሊተሬሽን የለም።'},
};
const EX12_UI = {
  ru: {introTitle:"Как выполнять упражнение",introBody:"Напишите пропущенную форму глагола, выбирая буквы на клавиатуре. Перевод предложения помогает определить смысл, время и лицо.",stepsTitle:"Как начисляются баллы",stepsBody:"1-я попытка — 100% без подсказок.\n2-я — 70%: нужные буквы подсвечены.\n3-я — 40%: можно прослушать всё предложение.",benefitsTitle:"Чем полезна такая практика",benefitsBody:"Вы не узнаёте готовый ответ, а самостоятельно вспоминаете и строите форму глагола в реальном контексте. Это укрепляет память, орфографию и навык выбора правильного спряжения в речи.",tipTitle:"Совет",tipBody:"Сложные предложения отмечайте «Чаще», а освоенные исключайте из ротации. Транслитерации нет — тренируйте чтение на иврите.",close:"ЗАКРЫТЬ",settingsLabel:"К настройкам",resultPraise:"Отличная работа!",resultNote:"Продолжайте практиковаться — каждый ответ укрепляет навык.",accuracy:"Точность выполнения"},
  en: {introTitle:"How to practise",introBody:"Write the missing verb form by tapping the Hebrew letters. The translation helps identify the meaning, tense and person.",stepsTitle:"Scoring",stepsBody:"1st attempt — 100%, no hints.\n2nd — 70%, required letters highlighted.\n3rd — 40%, full-sentence audio available.",benefitsTitle:"Why it helps",benefitsBody:"Instead of recognizing a ready-made answer, you actively recall and build the verb in context. This strengthens memory, spelling and conjugation skills for real conversations.",tipTitle:"Tip",tipBody:"Pin challenging sentences for extra practice and exclude mastered ones. No transliteration: practise reading Hebrew directly.",close:"CLOSE",settingsLabel:"Settings",resultPraise:"Well done!",resultNote:"Keep practising — each answer builds fluency.",accuracy:"Accuracy"},
  fr: {introTitle:"Comment s’entraîner",introBody:"Écrivez la forme verbale manquante en touchant les lettres hébraïques. La traduction aide à identifier le sens, le temps et la personne.",stepsTitle:"Points",stepsBody:"1er essai — 100 %, sans aide.\n2e — 70 %, lettres nécessaires surlignées.\n3e — 40 %, écoute de la phrase complète.",benefitsTitle:"Pourquoi cet exercice est utile",benefitsBody:"Vous retrouvez et construisez vous-même le verbe dans son contexte. Cela renforce la mémoire, l’orthographe et la maîtrise des conjugaisons à l’oral.",tipTitle:"Conseil",tipBody:"Épinglez les phrases difficiles et excluez celles déjà maîtrisées. Sans translittération : entraînez-vous à lire l’hébreu.",close:"FERMER",settingsLabel:"Paramètres",resultPraise:"Bravo !",resultNote:"Continuez à vous entraîner pour progresser.",accuracy:"Précision"},
  es: {introTitle:"Cómo practicar",introBody:"Escribe la forma verbal que falta tocando las letras hebreas. La traducción ayuda a reconocer el significado, el tiempo y la persona.",stepsTitle:"Puntuación",stepsBody:"1.er intento — 100 %, sin pistas.\n2.º — 70 %, letras necesarias resaltadas.\n3.º — 40 %, audio de la oración completa.",benefitsTitle:"Por qué es útil",benefitsBody:"En vez de reconocer una respuesta, recuperas y construyes el verbo en contexto. Así mejoras la memoria, la ortografía y el uso de las conjugaciones al hablar.",tipTitle:"Consejo",tipBody:"Marca las oraciones difíciles para repasarlas y excluye las dominadas. Sin transliteración: practica la lectura directa en hebreo.",close:"CERRAR",settingsLabel:"Configuración",resultPraise:"¡Buen trabajo!",resultNote:"Sigue practicando: cada respuesta cuenta.",accuracy:"Precisión"},
  pt: {introTitle:"Como praticar",introBody:"Escreva a forma verbal em falta tocando nas letras hebraicas. A tradução ajuda a identificar o significado, o tempo e a pessoa.",stepsTitle:"Pontuação",stepsBody:"1.ª tentativa — 100%, sem dicas.\n2.ª — 70%, letras necessárias destacadas.\n3.ª — 40%, áudio da frase completa.",benefitsTitle:"Por que é útil",benefitsBody:"Em vez de reconhecer uma resposta, recorda e constrói o verbo em contexto. Isso melhora a memória, a ortografia e o uso das conjugações na fala.",tipTitle:"Dica",tipBody:"Assinale frases difíceis para repetir mais e exclua as já dominadas. Sem transliteração: pratique a leitura em hebraico.",close:"FECHAR",settingsLabel:"Definições",resultPraise:"Bom trabalho!",resultNote:"Continue a praticar para melhorar.",accuracy:"Precisão"},
  ar: {introTitle:"طريقة التمرين",introBody:"اكتب صيغة الفعل الناقصة باختيار الحروف العبرية. تساعدك الترجمة على تحديد المعنى والزمن والشخص.",stepsTitle:"النقاط",stepsBody:"المحاولة الأولى — 100٪ دون تلميحات.\nالثانية — 70٪ مع تمييز الحروف المطلوبة.\nالثالثة — 40٪ مع إمكانية سماع الجملة كاملة.",benefitsTitle:"فائدة التمرين",benefitsBody:"بدلاً من التعرّف على إجابة جاهزة، تسترجع صيغة الفعل وتكوّنها بنفسك في سياق حقيقي، مما يقوّي الذاكرة والتهجئة واستخدام التصريفات في الكلام.",tipTitle:"نصيحة",tipBody:"ثبّت الجمل الصعبة لتكرارها واستبعد ما أتقنته. لا يوجد نقل صوتي، لتتدرّب على قراءة العبرية مباشرة.",close:"إغلاق",settingsLabel:"الإعدادات",resultPraise:"أحسنت!",resultNote:"واصل التدريب لتحسين مستواك.",accuracy:"الدقة"},
  am: {introTitle:"የልምምዱ መመሪያ",introBody:"የጎደለውን የግስ ቅርጽ የዕብራይስጥ ፊደላትን በመምረጥ ይጻፉ። ትርጉሙ ትርጉምን፣ ጊዜን እና ሰውን ለመለየት ይረዳል።",stepsTitle:"የነጥብ አሰጣጥ",stepsBody:"መጀመሪያ — 100% ያለ ፍንጭ።\nሁለተኛ — 70% አስፈላጊ ፊደላት ይደምቃሉ።\nሦስተኛ — 40% ሙሉ ዓረፍተ ነገሩን ማዳመጥ ይቻላል።",benefitsTitle:"የልምምዱ ጥቅም",benefitsBody:"ዝግጁ መልስ ከመለየት ይልቅ የግሱን ቅርጽ በአውድ ውስጥ ራስዎ ያስታውሳሉ እና ይገነባሉ። ይህ ማስታወስን፣ አጻጻፍንና ሰዋሰውን ያጠናክራል።",tipTitle:"ምክር",tipBody:"አስቸጋሪ ዓረፍተ ነገሮችን ለተደጋጋሚ ልምምድ ይምረጡ፣ የተማሩትንም ያስወግዱ። ትራንስሊተሬሽን የለም።",close:"ዝጋ",settingsLabel:"ቅንብሮች",resultPraise:"ጥሩ ሥራ!",resultNote:"ልምምድዎን ይቀጥሉ።",accuracy:"ትክክለኛነት"},
};

const EX12_RESULT_FEEDBACK = {
  ru: [{'title': 'Прекрасный результат!', 'note': 'Вы уверенно используете формы глаголов в контексте. Продолжайте в том же духе!'}, {'title': 'Очень хорошо!', 'note': 'Большинство форм вам уже знакомо. Ещё немного практики — и будет ещё лучше.'}, {'title': 'Хорошее начало!', 'note': 'Часть форм уже получается. Повторите сложные предложения — результат вырастет.'}, {'title': 'Главное — вы тренируетесь!', 'note': 'Некоторые формы пока сложны, и это нормально. Попробуйте ещё раз, используя подсказки.'}],
  en: [{'title': 'Excellent result!', 'note': 'You use verb forms confidently in context. Keep it up!'}, {'title': 'Very well done!', 'note': 'You already know most forms. A little more practice will take you further.'}, {'title': 'A good start!', 'note': 'Some forms are coming together. Review the tricky sentences and you will improve.'}, {'title': 'Every attempt counts!', 'note': 'Some forms are challenging for now. Try again and use the hints to build confidence.'}],
  fr: [{'title': 'Excellent résultat !', 'note': 'Vous maîtrisez bien les formes verbales en contexte. Continuez ainsi !'}, {'title': 'Très bien !', 'note': 'Vous connaissez déjà la plupart des formes. Un peu de pratique et vous progresserez encore.'}, {'title': 'Bon début !', 'note': 'Certaines formes sont acquises. Révisez les phrases difficiles pour progresser.'}, {'title': 'Chaque essai compte !', 'note': 'Certaines formes demandent encore du travail. Réessayez en utilisant les indices.'}],
  es: [{'title': '¡Excelente resultado!', 'note': 'Usas las formas verbales con seguridad en contexto. ¡Sigue así!'}, {'title': '¡Muy bien!', 'note': 'Ya conoces la mayoría de las formas. Con un poco más de práctica mejorarás aún más.'}, {'title': '¡Buen comienzo!', 'note': 'Algunas formas ya te salen bien. Repasa las frases difíciles para avanzar.'}, {'title': '¡Cada intento cuenta!', 'note': 'Algunas formas todavía cuestan. Vuelve a intentarlo y aprovecha las pistas.'}],
  pt: [{'title': 'Excelente resultado!', 'note': 'Usa as formas verbais com confiança no contexto. Continue assim!'}, {'title': 'Muito bem!', 'note': 'Já conhece a maioria das formas. Com mais um pouco de prática irá ainda mais longe.'}, {'title': 'Bom começo!', 'note': 'Algumas formas já estão dominadas. Reveja as frases difíceis para melhorar.'}, {'title': 'Cada tentativa conta!', 'note': 'Algumas formas ainda são difíceis. Tente novamente e aproveite as dicas.'}],
  ar: [{'title': 'نتيجة ممتازة!', 'note': 'أنت تستخدم صيغ الأفعال بثقة في السياق. واصل التقدم!'}, {'title': 'أحسنت كثيرًا!', 'note': 'لقد أتقنت معظم الصيغ. القليل من التدريب سيجعلك أفضل.'}, {'title': 'بداية جيدة!', 'note': 'أصبحت بعض الصيغ أسهل عليك. راجع الجمل الصعبة وستتقدم.'}, {'title': 'كل محاولة مفيدة!', 'note': 'بعض الصيغ لا تزال صعبة. حاول مجددًا واستفد من التلميحات.'}],
  am: [{'title': 'እጅግ በጣም ጥሩ ውጤት!', 'note': 'የግስ ቅርጾችን በአውድ ውስጥ በልበ ሙሉነት ይጠቀማሉ። ይቀጥሉ!'}, {'title': 'በጣም ጥሩ!', 'note': 'አብዛኞቹን ቅርጾች ያውቃሉ። ተጨማሪ ልምምድ ያሻሽልዎታል።'}, {'title': 'ጥሩ ጅምር!', 'note': 'አንዳንድ ቅርጾችን ተምረዋል። አስቸጋሪ ዓረፍተ ነገሮችን ይድገሙ።'}, {'title': 'እያንዳንዱ ሙከራ ይጠቅማል!', 'note': 'አንዳንድ ቅርጾች አሁንም አስቸጋሪ ናቸው። ፍንጮችን ተጠቅመው እንደገና ይሞክሩ።'}]
};

const LANGS = ['ru','en','fr','es','pt','ar','am'];
const normLang = x => {const a=String(x||'en').toLowerCase().split(/[-_]/)[0];return LANGS.includes(a)?a:'en';};
const settingsDefault = {count:12,tense:[...TENSES],sound:true,excluded:[],pinned:[]};
const shuffle = src => {const out=[...src];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
// Split by word boundaries, retaining spaces and punctuation. If the same target
// occurs more than once, reject the item rather than hiding an arbitrary occurrence.
function prepare(row) {
  if (!row || !row.id || !row.infinitive || !row.hebrew || !row.answer) return null;
  const answer=String(row.answer).replace(NIKKUD,'').trim();
  if(!/^[\u05D0-\u05EA]+$/.test(answer)) return null;
  const hebrew=String(row.hebrew).replace(NIKKUD,'');
  const tokens=hebrew.split(/([\s.,!?;:،؛־]+|[״׳"'()\[\]])/);
  const matches=tokens.reduce((n,t)=>n+(t===answer?1:0),0);
  if(matches!==1) return null;
  const at=tokens.findIndex(t=>t===answer);
  return {...row,id:String(row.id),answer,parts:[tokens.slice(0,at).join(''),tokens.slice(at+1).join('')]};
}
const SOURCE = normalizeData(sentenceData).items.map(prepare).filter(Boolean);
const canTranslate=(row,language)=>Boolean(String(row?.[language]||'').trim());
function makeDeck(pool,count,pinned) {
  const result=[],used=new Set();
  const poolPinned=shuffle(pool.filter(x=>pinned.includes(x.id)));
  for(const x of poolPinned.slice(0,Math.floor(count/4))){result.push(x);used.add(x.id);}
  const groups=new Map();
  for(const x of shuffle(pool)){if(!groups.has(x.infinitive))groups.set(x.infinitive,[]);groups.get(x.infinitive).push(x);}
  for(const forms of shuffle([...groups.values()])){if(result.length>=count)break;const x=forms.find(f=>!used.has(f.id));if(x){result.push(x);used.add(x.id);}}
  for(const x of shuffle(pool)){if(result.length>=count)break;if(!used.has(x.id)){result.push(x);used.add(x.id);}}
  return shuffle(result);
}
export default function Exercise12({navigation,route}) {
  const {height,width}=useWindowDimensions();
  const insets=useSafeAreaInsets();
  const compact=height<850;
  const [language,setLanguage]=useState(null);
  const [helpOpen,setHelpOpen]=useState(false);
  const [translationFontSize,setTranslationFontSize]=useState(16);
  const [mistakeAnimating,setMistakeAnimating]=useState(false);
   const [listOpen,setListOpen]=useState(false);
  const [settings,setSettings]=useState(settingsDefault);
  const [phase,setPhase]=useState('settings');
  const [deck,setDeck]=useState([]),[index,setIndex]=useState(0);
  const [typed,setTyped]=useState([]),[attempt,setAttempt]=useState(0),[finished,setFinished]=useState(false),[points,setPoints]=useState(0);
  const [correct,setCorrect]=useState(0),[wrong,setWrong]=useState(0),[earned,setEarned]=useState(0),[playing,setPlaying]=useState(false);
  // The final incorrect entry stays red for one second before the answer is revealed.
  const [revealCorrect,setRevealCorrect]=useState(false);
  const [revealing,setRevealing]=useState(false);
  const [correctAnimating,setCorrectAnimating]=useState(false);
  const revealOpacity=useRef(new Animated.Value(1)).current;
  const revealOffset=useRef(new Animated.Value(0)).current;
  const revealScale=useRef(new Animated.Value(1)).current;
  const revealTimer=useRef(null);
  const revealGeneration=useRef(0);
  const resetReveal=useCallback(()=>{
    revealGeneration.current+=1;
    if(revealTimer.current!==null){clearTimeout(revealTimer.current);revealTimer.current=null;}
    revealOpacity.stopAnimation();revealOffset.stopAnimation();revealScale.stopAnimation();
    revealOpacity.setValue(1);revealOffset.setValue(0);revealScale.setValue(1);
    setRevealCorrect(false);setRevealing(false);setMistakeAnimating(false);setCorrectAnimating(false);
  },[revealOpacity,revealOffset,revealScale]);
  useEffect(()=>()=>{
    revealGeneration.current+=1;
    if(revealTimer.current!==null)clearTimeout(revealTimer.current);
    revealOpacity.stopAnimation();revealOffset.stopAnimation();revealScale.stopAnimation();
  },[revealOpacity,revealOffset,revealScale]);
  // Gentle success pulse. Keep NEXT disabled until the green cells settle.
  const animateCorrectAnswer=()=>{
    const generation=++revealGeneration.current;
    setCorrectAnimating(true);
    revealOpacity.setValue(1);
    revealOffset.setValue(0);
    revealScale.setValue(1);
    Animated.sequence([
      Animated.timing(revealScale,{toValue:1.075,duration:180,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.spring(revealScale,{toValue:1,friction:6,tension:85,useNativeDriver:true}),
    ]).start(()=>{
      if(generation===revealGeneration.current)setCorrectAnimating(false);
    });
  };
  const animateFinalMistake=()=>{
    const generation=++revealGeneration.current;
    setRevealCorrect(false);setRevealing(true);
    revealOpacity.setValue(1);revealScale.setValue(1);revealOffset.setValue(0);
    Animated.sequence([
      Animated.timing(revealOffset,{toValue:-4,duration:65,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:4,duration:90,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:-3,duration:85,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:0,duration:65,useNativeDriver:true}),
    ]).start();
    revealTimer.current=setTimeout(()=>{
      revealTimer.current=null;
      if(generation!==revealGeneration.current)return;
      Animated.timing(revealOpacity,{toValue:0,duration:160,easing:Easing.out(Easing.quad),useNativeDriver:true}).start(({finished:ok})=>{
        if(!ok||generation!==revealGeneration.current)return;
        setRevealCorrect(true);
        revealScale.setValue(1.055);
        Animated.parallel([
          Animated.timing(revealOpacity,{toValue:1,duration:240,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
          Animated.spring(revealScale,{toValue:1,friction:6,tension:90,useNativeDriver:true}),
        ]).start(({finished:shown})=>{
          if(shown&&generation===revealGeneration.current)setRevealing(false);
        });
      });
    },1000);
  };
  const animateRetryMistake=()=>{
    const generation=++revealGeneration.current;
    setMistakeAnimating(true);
    revealOffset.setValue(0);
    Animated.sequence([
      Animated.timing(revealOffset,{toValue:-5,duration:75,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:5,duration:85,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:-3,duration:80,useNativeDriver:true}),
      Animated.timing(revealOffset,{toValue:0,duration:80,useNativeDriver:true}),
    ]).start();
    revealTimer.current=setTimeout(()=>{
      revealTimer.current=null;
      if(generation!==revealGeneration.current)return;
      setTyped([]);
      setAttempt(a=>a+1);
      setMistakeAnimating(false);
      revealOffset.setValue(0);
      locking.current=false;
    },550);
  };
  const totals=useRef({correct:0,wrong:0,earned:0});
  const audio=useRef(null),locking=useRef(false),alive=useRef(true);
  const soundEnabledRef=useRef(settings.sound);
  soundEnabledRef.current=settings.sound;
  const audioGeneration=useRef(0);
  const lang=I18N[language]||I18N.en;
  const ui=EX12_UI[language]||EX12_UI.en;
  const item=deck[index]||null;
  const translationValue=String(item?.[language]||'');
  useEffect(()=>{setTranslationFontSize(16);},[item?.id,language]);
  const target=item?.answer||'';
  const letters=[...target];
  const pool=useMemo(()=>SOURCE.filter(x=>settings.tense.includes(x.tense)&&!settings.excluded.includes(x.id)&&canTranslate(x,language||'en')),[settings,language]);
  const stopAudio=useCallback(async()=>{
    audioGeneration.current+=1;
    const sound=audio.current;audio.current=null;
    if(sound){try{sound.setOnPlaybackStatusUpdate(null);await sound.stopAsync();await sound.unloadAsync();}catch(e){}}
    if(alive.current)setPlaying(false);
  },[]);
  // onFinish is used only for the second wrong answer: error cue -> sentence.
  const playAudio=useCallback(async(source,onFinish)=>{
    if(!soundEnabledRef.current||!source)return false;
    await stopAudio();
    if(!soundEnabledRef.current||!alive.current)return false;
    const generation=audioGeneration.current;
    try{
      const {sound}=await Audio.Sound.createAsync(source,{shouldPlay:false});
      if(!alive.current||!soundEnabledRef.current||generation!==audioGeneration.current){await sound.unloadAsync();return false;}
      audio.current=sound;setPlaying(true);
      sound.setOnPlaybackStatusUpdate(status=>{
        if(status.isLoaded&&status.didJustFinish&&audio.current===sound){
          audio.current=null;
          sound.setOnPlaybackStatusUpdate(null);
          sound.unloadAsync().catch(()=>{});
          if(alive.current)setPlaying(false);
          if(typeof onFinish==='function'&&soundEnabledRef.current&&alive.current&&generation===audioGeneration.current){onFinish();}
        }
      });
      await sound.playAsync();
      return true;
    }catch(e){console.warn('[Exercise12] audio',e);if(alive.current)setPlaying(false);return false;}
  },[stopAudio]);
  const sentenceAudio=item?sentenceSounds[item.audio]:null;
  const changeSettings=patch=>setSettings(old=>{const next={...old,...patch};AsyncStorage.setItem('exercise12_settings_v1',JSON.stringify(next)).catch(()=>{});return next;});
  const toggleSound=()=>{
    const enabled=!soundEnabledRef.current;
    soundEnabledRef.current=enabled;
    changeSettings({sound:enabled});
    if(!enabled)stopAudio();
  };
  useEffect(()=>{
    let active=true;alive.current=true;
    (async()=>{
      try{
        const values=await AsyncStorage.multiGet(['language','exercise12_settings_v1']);
        if(!active)return;
        setLanguage(normLang(route?.params?.language||values[0][1]||'en'));
        if(values[1][1]){
          const raw=JSON.parse(values[1][1]);
          const valid=new Set(SOURCE.map(x=>x.id));
          setSettings({...settingsDefault,...raw,count:COUNTS.includes(raw.count)?raw.count:12,tense:Array.isArray(raw.tense)?TENSES.filter(x=>raw.tense.includes(x)):TENSES,excluded:(Array.isArray(raw.excluded)?raw.excluded:[]).map(String).filter(x=>valid.has(x)),pinned:(Array.isArray(raw.pinned)?raw.pinned:[]).map(String).filter(x=>valid.has(x))});
        }
      }catch(e){console.warn('[Exercise12] settings',e);setLanguage(normLang(route?.params?.language));}
    })();
    return()=>{active=false;alive.current=false;stopAudio();};
  },[route?.params?.language,stopAudio]);
  useFocusEffect(useCallback(()=>{
    if(!language)return undefined;
    const name=`exercise12${language}`;
    FirebaseAnalytics.logFirebaseEvent(name,{screen:name});
    return()=>{stopAudio();};
  },[language,stopAudio]));
  const begin=()=>{
    const next=makeDeck(pool,settings.count,settings.pinned);
    if(!next.length){Alert.alert(lang.title,lang.empty);return;}
    resetReveal();
    totals.current={correct:0,wrong:0,earned:0};setCorrect(0);setWrong(0);setEarned(0);
    setDeck(next);setIndex(0);setTyped([]);setAttempt(0);setFinished(false);setPoints(0);setPhase('task');locking.current=false;
  };
  const next=async()=>{
    if(revealing||correctAnimating||mistakeAnimating)return;
    await stopAudio();
    // Reset correction together with switching the question. Otherwise the old
    // incorrect input flashes briefly before the next item is rendered.
    if(index+1<deck.length){
      resetReveal();setIndex(i=>i+1);setTyped([]);setAttempt(0);setFinished(false);setPoints(0);locking.current=false;
    }else{
      setPhase('result');resetReveal();
      try{await updateStatistics('exercise12',(totals.current.earned/deck.length).toFixed(2));}catch(e){console.warn('[Exercise12] statistics',e);}
    }
  };
  const check=async()=>{
    if(locking.current||finished||typed.length!==letters.length)return;
    locking.current=true;
    if(typed.join('')===target){
      const score=SCORE[attempt];totals.current.earned+=score;totals.current.correct++;
      setCorrect(totals.current.correct);setEarned(totals.current.earned);setPoints(score);setFinished(true);
      animateCorrectAnswer();
      if(settings.sound){await playAudio(SOUND_OK); /* user can replay sentence after feedback */}
    }else if(attempt>=2){
      totals.current.wrong++;setWrong(totals.current.wrong);setPoints(0);setFinished(true);
      animateFinalMistake();
      if(settings.sound)await playAudio(SOUND_NO);
    }else{
      // On the second mistake, introduce the third hint by playing the sentence
      // automatically after the error cue (never overlap two sounds).
      const isSecondMistake=attempt===1;
      animateRetryMistake();
      if(settings.sound)playAudio(SOUND_NO,isSecondMistake&&sentenceAudio?()=>playAudio(sentenceAudio):undefined);
      return;
    }
    locking.current=false;
  };
  const toggle=(field)=>{
    if(!item)return;const values=settings[field]||[];
    const present=values.includes(item.id);
    const other=field==='pinned'?'excluded':'pinned';
    changeSettings({[field]:present?values.filter(id=>id!==item.id):[...values,item.id],[other]:(settings[other]||[]).filter(id=>id!==item.id)});
  };
  const requestExit=()=>Alert.alert(lang.exit,lang.exitBody,[{text:lang.cancel,style:'cancel'},{text:lang.leave,style:'destructive',onPress:async()=>{resetReveal();await stopAudio();setPhase('settings');}}]);
  useEffect(()=>navigation?.addListener?.('beforeRemove',e=>{if(phase!=='task')return;e.preventDefault();Alert.alert(lang.exit,lang.exitBody,[{text:lang.cancel,style:'cancel'},{text:lang.leave,style:'destructive',onPress:()=>{stopAudio();navigation.dispatch(e.data.action);}}]);}),[navigation,phase,language,stopAudio]);
  const openStats=async()=>{try{const s=await getStatistics('exercise12');Alert.alert(lang.stats,`${lang.completed}: ${s?.timesCompleted??0}\n${lang.average}: ${Number(s?.averageCompletionRate??0).toFixed(2)}%`);}catch(e){Alert.alert(lang.stats,lang.empty);}};
  const slotWidth=Math.max(17,Math.min(29,(width-64)/Math.max(1,letters.length)-3));
  // Render Hebrew word-by-word so the editable verb remains inside the sentence,
  // and a line can wrap only at a word boundary (not in the middle of the verb).
  const beforeWords=item?.parts[0].trim().split(/\s+/).filter(Boolean)||[];
  const afterWords=item?.parts[1].trim().split(/\s+/).filter(Boolean)||[];
  const done=finished;
  const finalPercent=Math.round(totals.current.earned/Math.max(1,deck.length));
  const feedbackTier=finalPercent>=90?0:finalPercent>=70?1:finalPercent>=40?2:3;
  const resultFeedback=(EX12_RESULT_FEEDBACK[language]||EX12_RESULT_FEEDBACK.en)[feedbackTier];
  const showCorrect=done&&points===0&&revealCorrect;
  return <SafeAreaView style={s.screen} edges={['left','right']}>
    <View style={[s.page,{
       // Keep the bottom button near the system safe area, without letting it
       // slip beneath gesture navigation or manufacturer-specific Android bars.
       paddingBottom: phase==='task'
         ? (Platform.OS==='ios'
             ? Math.max(20,insets.bottom-6)
             : Math.max(14,insets.bottom-4))
         : Math.max(4,insets.bottom),
     }]}>
      {phase==='task'&&<View style={[s.header,compact&&s.headerSmall]}>
        <TouchableOpacity onPress={phase==='task'?requestExit:()=>navigation?.goBack?.()}><Image source={ICONS.logo} style={s.logo}/></TouchableOpacity>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={toggleSound}><Image source={settings.sound?ICONS.on:ICONS.off} style={s.headerIcon}/></TouchableOpacity>
          <TouchableOpacity accessibilityLabel={ui.settingsLabel} onPress={phase==='task'?requestExit:()=>setPhase('settings')}><Image source={ICONS.list} style={s.headerIcon}/></TouchableOpacity>
          <TouchableOpacity onPress={openStats}><Image source={ICONS.stats} style={s.headerIcon}/></TouchableOpacity>
          <TouchableOpacity onPress={()=>setHelpOpen(true)}><Image source={ICONS.help} style={s.headerIcon}/></TouchableOpacity>
        </View>
      </View>}
      {phase==='settings'&&<ScrollView contentContainerStyle={s.settings}>
        <Text style={s.settingsTitle}>{lang.title}</Text>
        <Text style={s.label}>{lang.count}</Text>
        <View style={s.choiceRow}>{COUNTS.map(n=><TouchableOpacity key={n} onPress={()=>changeSettings({count:n})} style={[s.choice,settings.count===n&&s.selectedChoice]}><Text style={s.choiceText}>{n}</Text></TouchableOpacity>)}</View>
        <Text style={s.label}>{lang.tense}</Text>
        <View style={s.choiceRow}>{TENSES.map(t=><TouchableOpacity key={t} onPress={()=>changeSettings({tense:settings.tense.includes(t)?(settings.tense.length===1?settings.tense:settings.tense.filter(x=>x!==t)):[...settings.tense,t]})} style={[s.choice,settings.tense.includes(t)&&s.selectedChoice]}><Text style={s.choiceText}>{lang[t]}</Text></TouchableOpacity>)}</View>
        <Text style={s.helper}>{lang.available}: {pool.length}</Text>
        <Text style={s.helpText}>{lang.help}</Text>
        <TouchableOpacity onPress={begin} disabled={!pool.length} style={[s.mainButton,!pool.length&&s.disabled]}><Text style={s.mainButtonText}>{lang.start}</Text></TouchableOpacity>
      </ScrollView>}
      {phase==='task'&&item&&<>
        <ScrollView style={s.taskScroll} contentContainerStyle={s.taskBody} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={s.progressRow}>
            <View style={s.progressLeft}>
              <Text style={s.progressLabel}>{lang.correct}: {correct}</Text>
              <Text style={s.progressLabel}>{lang.mistakes}: {wrong}</Text>
            </View>
            <View style={s.progressNumberWrap}>
              <Text style={s.progressNumber}>{Math.max(0,deck.length-index-(finished?1:0))}</Text>
            </View>
            <View style={s.progressPercentWrap}>
              <Text style={s.progressPercent}>{Math.round(earned/Math.max(1,(index+(finished?1:0))*100)*100)}%</Text>
            </View>
          </View>
          <View style={s.progressBar}><ProgressBar progress={index+(finished?1:0)} totalExercises={deck.length}/></View>
                     <Text style={s.taskTitle}>{lang.write}</Text>
           <View style={s.sentenceCard}>
             <View style={s.sentenceLine}>
               <View style={s.sentenceWords}>
                 {beforeWords.map((word,i)=><Text key={`before-${i}`} style={s.hebrewWord}>{word}</Text>)}
                  <Animated.View style={[s.inlineSlots,{opacity:revealOpacity,transform:[{translateX:revealOffset},{scale:revealScale}]}]}>
                   {letters.map((_,i)=><View key={i} style={[s.inlineSlot,{width:slotWidth},((done&&(points>0||showCorrect))?s.goodSlot:(done||mistakeAnimating)?s.badSlot:null)]}>
                     <Text style={[s.slotText,slotWidth<23&&{fontSize:16},showCorrect&&s.goodText,((done&&!showCorrect&&points===0)||mistakeAnimating)&&s.badText]}>{showCorrect?letters[i]:typed[i]||' '}</Text>
                   </View>)}
                  </Animated.View>
                 {afterWords.map((word,i)=><Text key={`after-${i}`} style={s.hebrewWord}>{word}</Text>)}
               </View>
             </View>
             <View style={s.translationBox}>
               {!!GENDER_ICONS[item.gender]&&<Image source={GENDER_ICONS[item.gender]} style={s.genderIcon} accessibilityLabel={item.gender}/>}
               <View style={s.translationContent}>
                 <Text
                   numberOfLines={3}
                   onTextLayout={({nativeEvent})=>{
                     // Use an explicit font size instead of native auto-fitting:
                     // on some iOS versions adjustFontSizeToFit changes alignment.
                     if(nativeEvent.lines.length>2&&translationFontSize>12){
                       setTranslationFontSize(size=>Math.max(12,size-1));
                     }
                   }}
                   style={[s.translation,{fontSize:translationFontSize},language==='ar'&&{writingDirection:'rtl'}]}
                 >{translationValue}</Text>
               </View>
             </View>
             <View style={s.cardBottomRow}>
               <TouchableOpacity
                 accessibilityRole="button"
                 accessibilityLabel={lang.listen}
                 disabled={(attempt<2&&!done)||!sentenceAudio||!settings.sound||playing}
                 onPress={()=>playAudio(sentenceAudio)}
                 style={[s.audioAction,((attempt<2&&!done)||!sentenceAudio||!settings.sound||playing)&&s.disabled]}
               >
                 <Image source={ICONS.speaker} style={s.speaker}/>
                 {(attempt===2||done)&&<Text style={s.listenText}>{lang.listen}</Text>}
               </TouchableOpacity>
               <View style={s.tools}>
                 <TouchableOpacity accessibilityLabel={lang.menu} onPress={()=>setListOpen(true)} style={s.toolButton}><Image source={ICONS.list} style={s.toolIcon}/></TouchableOpacity>
                 <TouchableOpacity accessibilityLabel={lang.excluded} onPress={()=>toggle('excluded')} style={[s.toolButton,settings.excluded.includes(item.id)&&s.toolActive]}><Image source={settings.excluded.includes(item.id)?ICONS.hidden:ICONS.hide} style={s.toolIcon}/></TouchableOpacity>
                 <TouchableOpacity accessibilityLabel={lang.pinned} onPress={()=>toggle('pinned')} style={[s.toolButton,settings.pinned.includes(item.id)&&s.toolActive]}><Image source={settings.pinned.includes(item.id)?ICONS.pinned:ICONS.pin} style={s.toolIcon}/></TouchableOpacity>
               </View>
             </View>
           </View>
<View style={s.feedback}><Text style={done?(points>0||showCorrect?s.goodText:s.badText):attempt>0?s.badText:s.helper}>{done?(points>0?`${lang.right} +${points}%`:showCorrect?`${lang.answer} ${target}`:lang.wrong):attempt===0?'1 / 3 · 100%':attempt===1?lang.wrong:lang.last}</Text></View>
        </ScrollView>
        <View style={s.footer}>
          <View style={[s.keyboard,done&&s.keyboardInactive]} pointerEvents={done?"none":"auto"}>{KEYS.map((r,i)=><View key={i} style={s.keyRow}>{[...r].map((letter,j)=>{const allowed=attempt===0||letters.includes(letter);return <TouchableOpacity key={j} disabled={done||mistakeAnimating||typed.length>=letters.length||!allowed} onPress={()=>setTyped(a=>[...a,letter])} style={[s.key,attempt>0&&letters.includes(letter)&&s.keyHint,!allowed&&s.disabled]}><Text style={s.keyText}>{letter}</Text></TouchableOpacity>;})}{i===0&&<TouchableOpacity disabled={!typed.length||done||mistakeAnimating} onPress={()=>setTyped(a=>a.slice(0,-1))} style={[s.key,s.backspace]}><Text style={s.backspaceText}>⌫</Text></TouchableOpacity>}</View>)}</View>
          <TouchableOpacity disabled={revealing||mistakeAnimating||correctAnimating||(!done&&typed.length!==letters.length)} onPress={done?next:check} style={[s.mainButton,s.bottomButton,(revealing||mistakeAnimating||correctAnimating||(!done&&typed.length!==letters.length))&&s.disabled]}><Text style={s.mainButtonText}>{done?(index+1===deck.length?lang.finish:lang.next):lang.check}</Text></TouchableOpacity>
        </View>
      </>}
      {phase==='result'&&<ScrollView style={s.resultScroll} contentContainerStyle={s.resultScrollBody}>
        <View style={s.results}>
          <Text style={s.resultEyebrow}>{lang.completed}</Text>
          <Text style={s.resultHeading}>{lang.score}</Text>
          <View style={s.resultScoreCircle}><Text style={s.resultPercent}>{Math.round(totals.current.earned/Math.max(1,deck.length))}%</Text><Text style={s.resultScoreCaption}>{ui.accuracy}</Text></View>
          <View style={s.resultBarTrack}><View style={[s.resultBarFill,{width:`${Math.min(100,Math.max(0,Math.round(totals.current.earned/Math.max(1,deck.length))))}%`}]}/></View>
          <View style={s.resultStatsRow}>
            <View style={s.resultStatBox}><Text style={s.resultStatValue}>{correct}</Text><Text style={s.resultStatLabel}>{lang.correct}</Text></View>
            <View style={s.resultStatBox}><Text style={[s.resultStatValue,s.resultWrong]}>{wrong}</Text><Text style={s.resultStatLabel}>{lang.mistakes}</Text></View>
          </View>
          <Text style={s.resultPraise}>{resultFeedback.title}</Text>
          <Text style={s.resultNote}>{resultFeedback.note}</Text>
          <TouchableOpacity onPress={begin} style={[s.mainButton,s.resultPrimary]}><Text style={s.mainButtonText}>{lang.again}</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setPhase('settings')} style={s.resultSecondary}><Text style={s.resultSecondaryText}>{ui.settingsLabel}</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>{if(navigation?.canGoBack?.())navigation.goBack();else navigation?.navigate?.(({ru:'Menu',en:'MenuEn',fr:'MenuFr',es:'MenuEs',pt:'MenuPt',ar:'MenuAr',am:'MenuAm'})[language]||'Menu');}} style={[s.resultSecondary,s.resultMenuButton]}><Text style={s.resultSecondaryText}>{lang.menu}</Text></TouchableOpacity>
        </View>
      </ScrollView>}
      <Modal visible={helpOpen} transparent animationType="fade" onRequestClose={()=>setHelpOpen(false)}>
        <View style={s.modalShade}><View style={s.helpModalCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.helpModalContent}>
            <Text style={s.helpModalEyebrow}>{lang.title}</Text>
            <Text style={s.helpModalHeading}>{ui.introTitle}</Text>
            <Text style={s.helpModalBody}>{ui.introBody}</Text>
            <View style={s.helpSection}><Text style={s.helpSectionTitle}>①  {ui.stepsTitle}</Text><Text style={s.helpModalBody}>{ui.stepsBody}</Text></View>
            <View style={s.helpSection}><Text style={s.helpSectionTitle}>②  {ui.benefitsTitle}</Text><Text style={s.helpModalBody}>{ui.benefitsBody}</Text></View>
            <View style={s.helpSection}><Text style={s.helpSectionTitle}>✦  {ui.tipTitle}</Text><Text style={s.helpModalBody}>{ui.tipBody}</Text></View>
          </ScrollView>
          <TouchableOpacity onPress={()=>setHelpOpen(false)} style={[s.mainButton,s.helpClose]}><Text style={s.mainButtonText}>{ui.close}</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={listOpen} transparent animationType="fade" onRequestClose={()=>setListOpen(false)}>
        <View style={s.modalShade}><View style={s.modalCard}>
          <Text style={s.modalTitle}>{lang.excluded} / {lang.pinned}</Text>
          <ScrollView style={{flexGrow:0}}>
            {SOURCE.filter(x=>settings.excluded.includes(x.id)||settings.pinned.includes(x.id)).map(x=><View key={x.id} style={s.modalRow}>
              <View style={{flex:1}}><Text style={s.modalVerb}>{x.answer}</Text><Text style={s.modalDescription}>{x[language]||''}</Text></View>
              <TouchableOpacity accessibilityLabel={lang.excluded} onPress={()=>{const ids=settings.excluded;changeSettings({excluded:ids.includes(x.id)?ids.filter(id=>id!==x.id):[...ids,x.id],pinned:settings.pinned.filter(id=>id!==x.id)});}} style={s.toolButton}><Image source={settings.excluded.includes(x.id)?ICONS.hidden:ICONS.hide} style={s.toolIcon}/></TouchableOpacity>
              <TouchableOpacity accessibilityLabel={lang.pinned} onPress={()=>{const ids=settings.pinned;changeSettings({pinned:ids.includes(x.id)?ids.filter(id=>id!==x.id):[...ids,x.id],excluded:settings.excluded.filter(id=>id!==x.id)});}} style={s.toolButton}><Image source={settings.pinned.includes(x.id)?ICONS.pinned:ICONS.pin} style={s.toolIcon}/></TouchableOpacity>
            </View>)}
            {!SOURCE.some(x=>settings.excluded.includes(x.id)||settings.pinned.includes(x.id))&&<Text style={s.helper}>—</Text>}
          </ScrollView>
          <TouchableOpacity onPress={()=>setListOpen(false)} style={s.mainButton}><Text style={s.mainButtonText}>{ui.close}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  </SafeAreaView>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#AFC1D0'},page:{flex:1,paddingHorizontal:12},
  header:{height:60,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},headerSmall:{height:56},logo:{width:56,height:56,resizeMode:'contain'},headerTitle:{fontSize:16,fontWeight:'700',color:'#263F67',flex:1,textAlign:'center'},headerActions:{flexDirection:'row',gap:8},headerIcon:{width:32,height:32,resizeMode:'contain'},
  settings:{backgroundColor:'#F4F6FD',borderRadius:16,padding:18,gap:12,marginTop:12},settingsTitle:{fontSize:21,fontWeight:'800',color:'#27476F',textAlign:'center',marginBottom:8,lineHeight:28},label:{fontSize:16,fontWeight:'700',color:'#344D71',marginTop:8},choiceRow:{flexDirection:'row',gap:7},choice:{flex:1,paddingVertical:12,paddingHorizontal:3,borderRadius:9,backgroundColor:'#E2E9F5',alignItems:'center',justifyContent:'center'},selectedChoice:{backgroundColor:'#95C1EF'},choiceText:{color:'#27476F',fontWeight:'700',fontSize:13,textAlign:'center'},helper:{color:'#627895',fontSize:13,textAlign:'center'},helpText:{fontSize:14,lineHeight:21,color:'#425877',marginTop:8},
   progressRow:{flexDirection:'row',alignItems:'center',backgroundColor:'#6C8EBB',borderRadius:10,minHeight:48,marginTop:1,marginBottom:8,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:4,elevation:5},
   progressLeft:{flex:1,justifyContent:'center',paddingLeft:14},
   progressLabel:{color:'#FFFFFF',fontSize:12,lineHeight:17},
   progressNumberWrap:{backgroundColor:'#83A3CD',marginRight:10,paddingHorizontal:8,borderRadius:10,minWidth:44,alignItems:'center'},
   progressNumber:{color:'#FFFFFF',fontSize:20,fontWeight:'bold'},
   progressPercentWrap:{backgroundColor:'#83A3CD',marginRight:10,paddingHorizontal:8,borderRadius:10,minWidth:68,alignItems:'center'},
   progressPercent:{color:'#FFFFFF',fontSize:20,fontWeight:'bold'},
   progressBar:{marginBottom:8},
   taskScroll:{flex:1},taskBody:{paddingBottom:16},taskTitle:{fontSize:17,color:'#255C98',fontWeight:'800',textAlign:'center',marginTop:4,marginBottom:12},
   sentenceCard:{backgroundColor:'#EBDFF5',borderWidth:1,borderColor:'#C4C7E2',borderRadius:16,paddingHorizontal:11,paddingTop:10,paddingBottom:5},sentenceLine:{height:136,minHeight:136,maxHeight:136,justifyContent:'center',alignItems:'center'},sentenceWords:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',direction:'rtl',columnGap:6,rowGap:4,width:'100%'},hebrewWord:{fontSize:23,lineHeight:31,color:'#352A55',fontWeight:'600',writingDirection:'rtl',textAlign:'center'},inlineSlots:{flexDirection:'row',direction:'rtl',alignItems:'center',justifyContent:'center',columnGap:2,flexWrap:'nowrap'},inlineSlot:{height:38,backgroundColor:'#FFF',borderRadius:6,borderWidth:1,borderColor:'#B3A4CF',alignItems:'center',justifyContent:'center'},slotText:{fontSize:20,fontWeight:'700',color:'#344868'},goodSlot:{backgroundColor:'#E3F5E8',borderColor:'#49AA77'},badSlot:{backgroundColor:'#FBE8E6',borderColor:'#DB7B75'},
   translationBox:{backgroundColor:'rgba(255,255,255,0.76)',borderRadius:11,marginTop:9,height:82,justifyContent:'center',position:'relative'},translationContent:{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:40,paddingVertical:8,width:'100%'},genderIcon:{position:'absolute',left:8,top:26.5,width:29,height:29,resizeMode:'contain',zIndex:1},translation:{width:'100%',alignSelf:'stretch',fontSize:16,color:'#3B3B59',textAlign:'center',textAlignVertical:'center',lineHeight:22,fontWeight:'500',includeFontPadding:false},
   audioAction:{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:6,minHeight:34,flex:1},speaker:{width:20,height:20,resizeMode:'contain'},listenText:{fontSize:13,color:'#396A9D',fontWeight:'700'},cardBottomRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:36,marginTop:5},tools:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:9},toolButton:{width:34,height:33,borderRadius:8,alignItems:'center',justifyContent:'center'},toolActive:{backgroundColor:'transparent'},toolIcon:{width:27,height:27,resizeMode:'contain'},
   feedback:{minHeight:35,justifyContent:'center',alignItems:'center',paddingHorizontal:6},goodText:{color:'#27875A',fontWeight:'700',textAlign:'center'},badText:{color:'#B94F47',fontWeight:'700',textAlign:'center'},
   modalShade:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',padding:22},modalCard:{backgroundColor:'#F2F6FC',borderRadius:16,padding:15,maxHeight:'80%'},modalTitle:{fontSize:18,fontWeight:'800',color:'#24476C',textAlign:'center',marginBottom:12},modalRow:{flexDirection:'row',alignItems:'center',paddingVertical:7,borderBottomWidth:1,borderBottomColor:'#DAE4F0',gap:6},modalVerb:{fontSize:21,fontWeight:'700',color:'#27496E',textAlign:'right'},modalDescription:{fontSize:12,color:'#607590'},
footer:{paddingTop:4,backgroundColor:'#AFC1D0',flexShrink:0},keyboard:{gap:4},keyboardInactive:{opacity:0.35},keyRow:{flexDirection:'row',justifyContent:'center',gap:3},key:{flex:1,height:40,maxWidth:45,borderRadius:7,backgroundColor:'#FFF',borderColor:'#CFD8E6',borderWidth:1,alignItems:'center',justifyContent:'center'},keyHint:{backgroundColor:'#BEE8CF',borderColor:'#51A676'},keyText:{fontSize:20,color:'#304669',fontWeight:'700'},backspace:{backgroundColor:'#E3EAF5'},backspaceText:{fontSize:25,color:'#406596'},disabled:{opacity:0.35},mainButton:{backgroundColor:'#377ACB',paddingVertical:13,borderRadius:12,alignItems:'center',marginTop:12},bottomButton:{marginTop:7},mainButtonText:{color:'#fff',fontWeight:'800',fontSize:16},secondButton:{marginTop:16,alignItems:'center',padding:12},
  results:{justifyContent:'center',alignItems:'center',backgroundColor:'#EFF4FB',borderRadius:18,padding:20},resultHeading:{fontSize:24,color:'#385779',fontWeight:'700'},resultPercent:{fontSize:48,color:'#317EBB',fontWeight:'800'},resultDetail:{fontSize:17,color:'#486181',marginBottom:18},
  helpModalCard:{width:'100%',maxHeight:'82%',backgroundColor:'#F4F7FD',borderRadius:18,padding:16,borderWidth:1,borderColor:'#BDD0E6'},
  helpModalContent:{paddingBottom:8},helpModalEyebrow:{fontSize:12,color:'#5479A1',fontWeight:'800',letterSpacing:1,textAlign:'center',marginBottom:4},
  helpModalHeading:{fontSize:19,fontWeight:'800',color:'#24476C',textAlign:'center',marginBottom:12},
  helpModalBody:{fontSize:14,lineHeight:21,color:'#394E69',textAlign:'left'},
  helpSection:{backgroundColor:'#FFFFFF',borderRadius:12,padding:12,marginTop:11,borderWidth:1,borderColor:'#DFE8F3'},
  helpSectionTitle:{fontSize:15,fontWeight:'800',color:'#245E9C',marginBottom:7},helpClose:{marginTop:10},
  resultScroll:{flex:1},resultScrollBody:{flexGrow:1,justifyContent:'center',paddingVertical:12},
  resultEyebrow:{fontSize:12,fontWeight:'800',color:'#4B7CA7',letterSpacing:1.2,textAlign:'center'},
  resultScoreCircle:{width:158,height:158,borderRadius:79,borderWidth:8,borderColor:'#BBD8F1',backgroundColor:'#E8F4FF',alignSelf:'center',alignItems:'center',justifyContent:'center',marginTop:12,marginBottom:14},
  resultScoreCaption:{fontSize:13,color:'#4B7095',fontWeight:'700',textAlign:'center'},
  resultBarTrack:{width:'100%',height:10,backgroundColor:'#DBE8F4',borderRadius:6,overflow:'hidden',marginBottom:16},
  resultBarFill:{height:'100%',backgroundColor:'#3B8FCA',borderRadius:6},
  resultStatsRow:{flexDirection:'row',gap:12,width:'100%'},
  resultStatBox:{flex:1,backgroundColor:'#FFFFFF',borderRadius:12,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:'#D6E3F1'},
  resultStatValue:{fontSize:25,fontWeight:'800',color:'#26845F'},resultWrong:{color:'#BE655F'},resultStatLabel:{fontSize:12,color:'#516A86',fontWeight:'700',marginTop:3,textAlign:'center'},
  resultPraise:{fontSize:18,fontWeight:'800',color:'#2C5782',marginTop:16,textAlign:'center'},
  resultNote:{fontSize:13,lineHeight:19,color:'#58708E',textAlign:'center',marginTop:6},
  resultMenuButton:{backgroundColor:'#EAF1FA'},
  resultPrimary:{width:'100%',marginTop:20},resultSecondary:{marginTop:10,paddingVertical:13,width:'100%',borderWidth:1,borderColor:'#8DB4D5',borderRadius:12,alignItems:'center'},resultSecondaryText:{color:'#2D6595',fontWeight:'800',fontSize:15},

});
