import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, AppState, Easing, FlatList, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { updateStatistics, getStatistics } from './stat';
import sentenceData from './sentences.json';
import conjugationData from './verbs6RU.json';
import { buildConjugationIndex, optionAudioKey, optionTransliteration } from './sentenceOptionTranslit';
import sentenceSounds from './sentenceSounds';
import soundsconj from './soundconj';
import useSentenceAudio from './useSentenceAudio';
import { createOptions, isRealSession, makeDeck, normalizeData, normalizeLanguage, shuffle, splitTarget } from './sentenceCore';
import { HELP, UI } from './sentenceUI';
import ProgressBar from './ProgressBar';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { SafeAreaView as ScreenSafeAreaView } from 'react-native-safe-area-context';
const COUNTS = [8, 12, 18, 24];
const TENSES = ['present', 'past', 'future'];
const DEFAULTS = { count: 12, tense: [...TENSES], sound: true, translit: true, showTranslation: true, excluded: [], pinned: [] };
const ICONS = { logo: require('./VERBIFY.png'), on: require('./SoundOn.png'), off: require('./SoundOff.png'), list: require('./spisok2.png'), rotation: require('./spisok.png'), stats: require('./stat.png'), help: require('./question.png'), speaker: require('./speaker3.png'), hide: require('./glaz1.png'), hidden: require('./glaz2.png'), pin: require('./gant1.png'), pinned: require('./gant2.png') };
const FEEDBACK = { yes: require('./assets/sounds/success_root.mp3'), no: require('./assets/sounds/failure_root.mp3') };
const EXERCISE_LABEL = { ru: 'Упражнение', en: 'Exercise', fr: 'Exercice', es: 'Ejercicio', pt: 'Exercício', ar: 'التمرين', am: 'ልምምድ' };
const EX10_HELP = {
    ru: 'Прослушайте предложение и выберите правильный перевод. После ответа откроются текст на иврите и транслитерация. Задания можно исключать из повторения или отмечать для более частого показа.',
    en: 'Listen to the sentence and choose the correct translation. Hebrew text and transliteration appear after answering. You can exclude tasks from review or mark them to appear more often.',
    fr: 'Écoutez la phrase et choisissez la bonne traduction. Le texte en hébreu et la translittération apparaissent après la réponse. Vous pouvez exclure certaines questions ou les faire apparaître plus souvent.',
    es: 'Escucha la oración y elige la traducción correcta. El texto en hebreo y la transliteración aparecen después de responder. Puedes excluir preguntas o marcarlas para que aparezcan con más frecuencia.',
    pt: 'Ouça a frase e escolha a tradução correta. O texto em hebraico e a transliteração aparecem depois da resposta. Você pode excluir questões ou marcá-las para aparecerem com mais frequência.',
    ar: 'استمع واختر الترجمة. يظهر النص بعد الإجابة.',
    am: 'አዳምጠው ትርጉሙን ይምረጡ። ጽሑፉ ከመልሱ በኋላ ይታያል።',
};
const MODAL_HELP = {
    9: {
        ru: `В этом упражнении нужно выбрать правильную форму глагола и подставить её в предложение.

Обращайте внимание на время, лицо, число и род — именно они определяют нужную форму глагола. Старайтесь использовать весь контекст предложения, а не ориентироваться только на отдельное слово.

Польза упражнения: оно помогает перейти от знания таблиц спряжения к быстрому использованию глаголов в реальных фразах. При регулярной практике правильные формы начинают узнаваться и вспоминаться быстрее и естественнее.

Совет: сначала прочитайте всё предложение целиком и выберите форму самостоятельно. После ответа проверьте правильный вариант и транслитерацию, а затем произнесите готовое предложение вслух. Хорошо знакомые задания можно исключить из повторения, а сложные отметить для более частого показа.`,
        en: `In this exercise, choose the correct verb form to complete the sentence.

Pay attention to tense, person, number and gender — these determine which verb form is needed. Try to use the whole sentence for context rather than focusing on a single word.

Why it helps: this exercise moves you from knowing conjugation tables to using Hebrew verbs quickly in real sentences. With regular practice, correct forms become easier and more natural to recognize and recall.

Tip: first read the entire sentence and choose the form on your own. After answering, check the correct form and transliteration, then say the completed sentence aloud. You can exclude tasks you already know well and mark difficult ones to appear more often.`,
        fr: `Dans cet exercice, choisissez la bonne forme du verbe pour compléter la phrase.

Faites attention au temps, à la personne, au nombre et au genre : ce sont eux qui déterminent la forme correcte. Essayez de vous appuyer sur le contexte de toute la phrase plutôt que sur un seul mot.

Pourquoi c’est utile : cet exercice aide à passer de la connaissance des tableaux de conjugaison à l’utilisation rapide des verbes dans de vraies phrases. Avec une pratique régulière, les formes correctes deviennent plus faciles et plus naturelles à reconnaître et à retrouver.

Conseil : lisez d’abord toute la phrase et choisissez la forme par vous-même. Après la réponse, vérifiez la bonne forme et la translittération, puis prononcez la phrase complète à voix haute. Vous pouvez exclure les questions déjà bien maîtrisées et faire apparaître plus souvent les plus difficiles.`,
        es: `En este ejercicio debes elegir la forma correcta del verbo para completar la oración.

Presta atención al tiempo, la persona, el número y el género, ya que determinan la forma que necesitas. Intenta utilizar el contexto de toda la oración en lugar de fijarte solo en una palabra.

Por qué es útil: este ejercicio ayuda a pasar de conocer las tablas de conjugación a usar los verbos con rapidez dentro de frases reales. Con la práctica, las formas correctas se reconocen y recuerdan de manera cada vez más natural.

Consejo: primero lee toda la oración y elige la forma por tu cuenta. Después de responder, comprueba la forma correcta y la transliteración, y luego pronuncia la oración completa en voz alta. Puedes excluir las preguntas que ya dominas y marcar las difíciles para que aparezcan con más frecuencia.`,
        pt: `Neste exercício, escolha a forma correta do verbo para completar a frase.

Preste atenção ao tempo, à pessoa, ao número e ao gênero, pois são eles que determinam a forma necessária. Tente usar o contexto da frase inteira em vez de se concentrar apenas em uma palavra.

Por que é útil: este exercício ajuda a passar do conhecimento das tabelas de conjugação para o uso rápido dos verbos em frases reais. Com a prática regular, as formas corretas ficam mais fáceis e naturais de reconhecer e lembrar.

Dica: primeiro leia a frase inteira e escolha a forma sozinho. Depois de responder, confira a forma correta e a transliteração e, em seguida, diga a frase completa em voz alta. Você pode excluir questões que já domina e marcar as mais difíceis para aparecerem com mais frequência.`,
        ar: `في هذا التمرين اختر صيغة الفعل الصحيحة لإكمال الجملة.

انتبه إلى الزمن والشخص والعدد والجنس، فهذه العناصر هي التي تحدد الصيغة المطلوبة. حاول الاعتماد على سياق الجملة كاملة بدل التركيز على كلمة واحدة فقط.

فائدة التمرين: يساعدك على الانتقال من معرفة جداول التصريف إلى استخدام الأفعال بسرعة داخل جمل حقيقية. ومع التدريب المنتظم تصبح الصيغ الصحيحة أسهل وأكثر طبيعية في التعرّف والتذكّر.

نصيحة: اقرأ الجملة كاملة أولًا واختر الصيغة بنفسك. بعد الإجابة، راجع الصيغة الصحيحة والكتابة الصوتية، ثم انطق الجملة كاملة بصوت عالٍ. يمكنك استبعاد الأسئلة التي تعرفها جيدًا ووضع علامة على الأسئلة الصعبة لتظهر بوتيرة أكبر.`,
        am: `በዚህ ልምምድ ዓረፍተ ነገሩን ለማሟላት ትክክለኛውን የግስ ቅርጽ ይምረጡ።

ጊዜን፣ ሰውን፣ ቁጥርን እና ጾታን ያስተውሉ፤ ትክክለኛውን ቅርጽ የሚወስኑት እነዚህ ናቸው። በአንድ ቃል ላይ ብቻ ከማተኮር ይልቅ የዓረፍተ ነገሩን ሙሉ አውድ ለመጠቀም ይሞክሩ።

የልምምዱ ጥቅም፦ የግስ ቅርጾችን በሰንጠረዥ ብቻ ከማወቅ ወደ እውነተኛ ዓረፍተ ነገሮች ውስጥ በፍጥነት መጠቀም እንዲሸጋገሩ ይረዳል። በመደበኛ ልምምድ ትክክለኛዎቹን ቅርጾች ማወቅና ማስታወስ ይበልጥ ቀላል እና ተፈጥሯዊ ይሆናል።

ምክር፦ መጀመሪያ ዓረፍተ ነገሩን ሙሉ በሙሉ ያንብቡና ቅርጹን በራስዎ ይምረጡ። ከመልሱ በኋላ ትክክለኛውን ቅርጽና ትራንስሊተሬሽኑን ይመልከቱ፣ ከዚያም ሙሉውን ዓረፍተ ነገር ጮክ ብለው ይናገሩ። በደንብ የሚያውቋቸውን ጥያቄዎች ከድገማ ማስወገድ እና ከባድ የሆኑትን ብዙ ጊዜ እንዲታዩ ምልክት ማድረግ ይችላሉ።`,
    },
    10: {
        ru: `В этом упражнении нужно прослушать предложение на иврите и выбрать правильный перевод.

Текст на иврите до ответа скрыт специально: задача — понять фразу именно на слух, а не прочитать её. После ответа откроются текст и транслитерация, а предложение можно прослушать ещё раз.

Польза упражнения: оно развивает понимание разговорного иврита, помогает быстрее узнавать знакомые глаголы и конструкции в речи и постепенно воспринимать смысл фразы целиком, без постоянного перевода каждого слова.

Совет: при первом прослушивании постарайтесь уловить общий смысл, знакомые слова, глагол и время. Не обязательно понимать всё сразу. После ответа прочитайте открывшийся текст и прослушайте предложение ещё раз, сопоставляя написание со звучанием. Сложные задания отмечайте для более частого повторения, а хорошо знакомые можно исключить из ротации.`,
        en: `In this exercise, listen to the Hebrew sentence and choose the correct translation.

The Hebrew text is intentionally hidden until you answer: the goal is to understand the sentence by listening rather than reading it. After answering, the Hebrew text and transliteration appear, and you can listen to the sentence again.

Why it helps: this exercise develops listening comprehension, helps you recognize familiar verbs and sentence patterns more quickly in spoken Hebrew, and gradually trains you to understand the sentence as a whole instead of translating every word.

Tip: on the first listen, try to catch the general meaning, familiar words, the verb and the tense. You do not need to understand everything immediately. After answering, read the revealed text and listen again while connecting the written form with what you hear. Mark difficult tasks to appear more often and exclude tasks you already know well.`,
        fr: `Dans cet exercice, écoutez la phrase en hébreu et choisissez la bonne traduction.

Le texte en hébreu est volontairement masqué jusqu’à votre réponse : le but est de comprendre la phrase à l’oreille plutôt que de la lire. Après la réponse, le texte hébreu et la translittération apparaissent et vous pouvez réécouter la phrase.

Pourquoi c’est utile : cet exercice développe la compréhension orale, aide à reconnaître plus rapidement les verbes et les structures familières dans l’hébreu parlé et apprend progressivement à comprendre la phrase dans son ensemble au lieu de traduire chaque mot.

Conseil : lors de la première écoute, essayez de saisir le sens général, les mots connus, le verbe et le temps. Il n’est pas nécessaire de tout comprendre immédiatement. Après la réponse, lisez le texte affiché et réécoutez la phrase en reliant l’écrit à ce que vous entendez. Faites revenir plus souvent les questions difficiles et excluez celles que vous maîtrisez déjà.`,
        es: `En este ejercicio debes escuchar una oración en hebreo y elegir la traducción correcta.

El texto en hebreo permanece oculto hasta que respondas a propósito: el objetivo es comprender la frase al escucharla y no al leerla. Después de responder aparecerán el texto en hebreo y la transliteración, y podrás escuchar la oración de nuevo.

Por qué es útil: este ejercicio desarrolla la comprensión auditiva, ayuda a reconocer más rápido verbos y estructuras conocidas en el hebreo hablado y enseña poco a poco a captar el sentido de la frase completa sin traducir cada palabra.

Consejo: en la primera escucha intenta captar el sentido general, las palabras conocidas, el verbo y el tiempo. No es necesario entenderlo todo de inmediato. Después de responder, lee el texto que aparece y escucha otra vez relacionando la escritura con el sonido. Marca las preguntas difíciles para que aparezcan con más frecuencia y excluye las que ya dominas.`,
        pt: `Neste exercício, ouça uma frase em hebraico e escolha a tradução correta.

O texto em hebraico fica propositalmente oculto até você responder: o objetivo é compreender a frase pelo som, e não pela leitura. Depois da resposta, aparecem o texto em hebraico e a transliteração, e você pode ouvir a frase novamente.

Por que é útil: este exercício desenvolve a compreensão auditiva, ajuda a reconhecer mais rapidamente verbos e estruturas conhecidas no hebraico falado e, aos poucos, ensina a entender o sentido da frase inteira sem traduzir cada palavra.

Dica: na primeira vez, tente captar o sentido geral, as palavras conhecidas, o verbo e o tempo. Não é necessário entender tudo imediatamente. Depois de responder, leia o texto revelado e ouça novamente, relacionando a escrita ao som. Marque as questões difíceis para aparecerem mais vezes e exclua as que você já domina.`,
        ar: `في هذا التمرين استمع إلى جملة بالعبرية واختر الترجمة الصحيحة.

يُخفى النص العبري عمدًا حتى تجيب: الهدف هو فهم الجملة من خلال الاستماع لا من خلال قراءتها. بعد الإجابة يظهر النص العبري والكتابة الصوتية، ويمكنك الاستماع إلى الجملة مرة أخرى.

فائدة التمرين: يطوّر فهم العبرية المسموعة، ويساعدك على التعرّف بسرعة أكبر على الأفعال والتراكيب المألوفة في الكلام، ويدرّبك تدريجيًا على فهم معنى الجملة كاملة بدل ترجمة كل كلمة على حدة.

نصيحة: في الاستماع الأول حاول التقاط المعنى العام والكلمات المألوفة والفعل والزمن. ليس من الضروري فهم كل شيء فورًا. بعد الإجابة اقرأ النص الذي ظهر واستمع مرة أخرى مع ربط الكتابة بما تسمعه. ضع علامة على الأسئلة الصعبة لتظهر بوتيرة أكبر، واستبعد الأسئلة التي أصبحت تعرفها جيدًا.`,
        am: `በዚህ ልምምድ የዕብራይስጥ ዓረፍተ ነገር ያዳምጡና ትክክለኛውን ትርጉም ይምረጡ።

እስኪመልሱ ድረስ የዕብራይስጥ ጽሑፉ በፍላጎት ይደበቃል፤ ዓላማው ዓረፍተ ነገሩን በማንበብ ሳይሆን በመስማት መረዳት ነው። ከመልሱ በኋላ የዕብራይስጥ ጽሑፉና ትራንስሊተሬሽኑ ይታያሉ፣ ዓረፍተ ነገሩንም እንደገና ማዳመጥ ይችላሉ።

የልምምዱ ጥቅም፦ የመስማት ግንዛቤን ያዳብራል፣ የሚያውቋቸውን ግሶችና የዓረፍተ ነገር አወቃቀሮች በንግግር ውስጥ በፍጥነት እንዲለዩ ይረዳል፣ እና እያንዳንዱን ቃል በተናጠል ከመተርጎም ይልቅ የሙሉውን ዓረፍተ ነገር ትርጉም እንዲረዱ ያለማምዳል።

ምክር፦ በመጀመሪያው ማዳመጥ አጠቃላይ ትርጉሙን፣ የሚያውቋቸውን ቃላት፣ ግሱን እና ጊዜውን ለመያዝ ይሞክሩ። ሁሉንም ወዲያውኑ መረዳት አያስፈልግም። ከመልሱ በኋላ የታየውን ጽሑፍ ያንብቡና ከሚሰማው ድምፅ ጋር እያገናኙ እንደገና ያዳምጡ። ከባድ የሆኑትን ብዙ ጊዜ እንዲታዩ ምልክት ያድርጉ፣ በደንብ የሚያውቋቸውንም ከድገማ ያስወግዱ።`,
    },
};
const T = ({ style, ...props }) => <Text {...props} maxFontSizeMultiplier={1.2} style={[s.text, style]}/>;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
function Button({ label, onPress, disabled, secondary = false, style }) { return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} activeOpacity={0.8} disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && s.disabled, style]}><T style={[s.buttonText, secondary && s.secondaryText]}>{label}</T></TouchableOpacity>; }
function Icon({ source, label, onPress, disabled, active, iconStyle, }) {
    return (<TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{
            disabled: !!disabled,
            selected: !!active,
        }} onPress={onPress} disabled={disabled} style={[
            s.iconButton,
            active && s.activeIcon,
            disabled && s.disabled,
        ]}>
      <Image source={source} style={[s.icon, iconStyle]}/>
    </TouchableOpacity>);
}
function sanitizeSettings(value) {
    const x = value && typeof value === 'object' ? value : {};
    const savedTense = Array.isArray(x.tense) ? x.tense : x.tense === 'all' || !x.tense ? TENSES : [x.tense];
    const tense = TENSES.filter(item => savedTense.includes(item));
    return { count: COUNTS.includes(x.count) ? x.count : 12, tense: tense.length ? tense : [...TENSES], sound: x.sound !== false, translit: x.translit !== false, showTranslation: x.showTranslation !== false, excluded: Array.isArray(x.excluded) ? x.excluded.map(String) : [], pinned: Array.isArray(x.pinned) ? x.pinned.map(String) : [] };
}
export default function SentenceExercise({ navigation, route, mode = 9 }) {
    const conjugationIndex = useMemo(() => buildConjugationIndex(conjugationData), []);
    const parsed = useMemo(() => normalizeData(sentenceData), []);
    const storageKey = `exercise${mode}_settings_v1`, exerciseId = `exercise${mode}`;
    const [language, setLanguage] = useState('en'), [loaded, setLoaded] = useState(false);
    const [settings, setSettings] = useState(DEFAULTS), settingsRef = useRef(DEFAULTS), writeQueue = useRef(Promise.resolve());
    const [phase, setPhase] = useState('settings'), [deck, setDeck] = useState([]), [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null), [answered, setAnswered] = useState(false), [ready, setReady] = useState(false);
    const [correct, setCorrect] = useState(0), [wrong, setWrong] = useState(0), [heard, setHeard] = useState(false);
    const [playing, setPlaying] = useState(false), [sentencePlaying, setSentencePlaying] = useState(false);
    const [audioError, setAudioError] = useState(false), [saveError, setSaveError] = useState(false);
    const [rotationFilter, setRotationFilter] = useState('all');
    const [modal, setModal] = useState(null), [stats, setStats] = useState(null), [statsError, setStatsError] = useState(false);
    const alive = useRef(true), phaseRef = useRef(phase), answeredRef = useRef(false), finishedRef = useRef(false), countsRef = useRef({ correct: 0, wrong: 0 });
    const leavingRef = useRef(false), timer = useRef(null), epoch = useRef(0), scrollRef = useRef(null);
    const { play, stop } = useSentenceAudio();
    const { height, width } = useWindowDimensions();
    const compact = height < 720;
    const cardMotion = useRef(new Animated.Value(0)).current;
    const optionReadyAnim = useRef(new Animated.Value(0)).current;
    const motionEnabled = phase === 'task' && !modal;
    useFocusEffect(useCallback(() => {
        if (!motionEnabled)
            return;
        let loop;
        const stopMotion = () => { loop?.stop(); loop = null; };
        const startMotion = () => {
            stopMotion();
            cardMotion.setValue(0);
            loop = Animated.loop(Animated.sequence([
                Animated.timing(cardMotion, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
                Animated.timing(cardMotion, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
            ]));
            loop.start();
        };
        if (AppState.currentState === 'active')
            startMotion();
        const subscription = AppState.addEventListener('change', state => state === 'active' ? startMotion() : stopMotion());
        return () => { stopMotion(); subscription.remove(); };
    }, [motionEnabled, cardMotion]));
    const topStyles = useMemo(() => createTopStyles(compact), [compact]);
    const ui = UI[language] || UI.en, rtl = language === 'ar';
    const title = ui[`title${mode}`];
    const exerciseHelp = mode === 10 ? (EX10_HELP[language] || EX10_HELP.en) : (HELP[language]?.[0] || HELP.en[0]);
    const modalHelp = MODAL_HELP[mode]?.[language] || MODAL_HELP[mode]?.en || exerciseHelp;
    const item = deck[index] || null;
    useEffect(() => {
        if (mode !== 10)
            return;
        optionReadyAnim.stopAnimation();
        optionReadyAnim.setValue(0);
    }, [mode, item?.id, optionReadyAnim]);
    useEffect(() => {
        if (mode !== 10 || answered || !heard || sentencePlaying)
            return;
        optionReadyAnim.stopAnimation();
        Animated.timing(optionReadyAnim, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            isInteraction: false,
        }).start();
    }, [mode, answered, heard, sentencePlaying, optionReadyAnim]);
    const eligible = useMemo(() => parsed.items.filter(x => createOptions(x, mode, language, parsed.byId)), [parsed, mode, language]);
    const pool = useMemo(() => eligible.filter(x => settings.tense.includes(x.tense) && !settings.excluded.includes(x.id) && (mode === 9 || !!sentenceSounds[x.audio])), [eligible, settings.tense, settings.excluded, mode]);
    const rawOptions = useMemo(() => item ? createOptions(item, mode, language, parsed.byId) : null, [item, mode, language, parsed]);
    const options = useMemo(() => shuffle(rawOptions || []), [rawOptions]);
    const split = useMemo(() => item ? splitTarget(item) : null, [item]);
    const attempts = correct + wrong, score = attempts ? Math.round(correct / attempts * 100) : 0;
    phaseRef.current = phase;
    const stopAll = useCallback(() => { epoch.current += 1; stop(); if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
    } if (alive.current) {
        setPlaying(false);
        setSentencePlaying(false);
        if (answeredRef.current)
            setReady(true);
    } }, [stop]);
    useEffect(() => { alive.current = true; return () => { alive.current = false; stopAll(); }; }, [stopAll]);
    useFocusEffect(useCallback(() => () => stopAll(), [stopAll]));
    useEffect(() => {
        let active = true;
        setLoaded(false);
        stopAll();
        setPhase('settings');
        (async () => {
            let saved = null, lang = 'en';
            try {
                const values = await AsyncStorage.multiGet([storageKey, 'language']);
                saved = values[0][1] ? JSON.parse(values[0][1]) : null;
                lang = values[1][1] || 'en';
            }
            catch (e) {
                console.warn('[SentenceExercise] settings load', e);
            }
            if (!active)
                return;
            const next = sanitizeSettings(saved);
            settingsRef.current = next;
            setSettings(next);
            setLanguage(normalizeLanguage(route?.params?.language || lang));
            setLoaded(true);
        })();
        return () => { active = false; };
    }, [storageKey, route?.params?.language, stopAll]);
    const changeSettings = useCallback(patch => {
        const next = { ...settingsRef.current, ...patch };
        settingsRef.current = next;
        setSettings(next);
        writeQueue.current = writeQueue.current.catch(() => { }).then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next))).catch(e => console.warn('[SentenceExercise] settings save', e));
    }, [storageKey]);
    const toggleRotation = (id, type) => {
        const values = settingsRef.current[type];
        changeSettings({ [type]: values.includes(id) ? values.filter(x => x !== id) : [...values, id] });
    };
    const requestLeave = useCallback(action => {
        if (phaseRef.current !== 'task') {
            stopAll();
            action();
            return;
        }
        Alert.alert(ui.exitTitle, ui.exitBody, [{ text: ui.cancel, style: 'cancel' }, { text: ui.leave, style: 'destructive', onPress: () => { stopAll(); phaseRef.current = 'settings'; action(); } }]);
    }, [ui, stopAll]);
    useEffect(() => navigation?.addListener?.('beforeRemove', event => {
        if (leavingRef.current || phaseRef.current !== 'task')
            return;
        event.preventDefault();
        requestLeave(() => { leavingRef.current = true; navigation.dispatch(event.data.action); });
    }), [navigation, requestLeave]);
    const goMenu = () => requestLeave(() => { leavingRef.current = true; if (navigation?.canGoBack?.())
        navigation.goBack();
    else
        navigation?.navigate?.('Menu'); });
    const goSettings = () => requestLeave(() => { setModal(null); setPhase('settings'); });
    useEffect(() => {
        if (!modal)
            return;
        stopAll();
        if (modal !== 'stats')
            return;
        let active = true;
        setStats(null);
        setStatsError(false);
        Promise.resolve().then(() => getStatistics(exerciseId)).then(x => { if (active)
            setStats(x || {}); }).catch(() => { if (active) {
            setStatsError(true);
            setStats({});
        } });
        return () => { active = false; };
    }, [modal, exerciseId, stopAll]);
    useEffect(() => {
        if (phase === 'task')
            scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [item?.id, phase]);
    const start = () => {
        stopAll();
        leavingRef.current = false;
        finishedRef.current = false;
        countsRef.current = { correct: 0, wrong: 0 };
        answeredRef.current = false;
        const next = makeDeck(pool, settings.count, settings.excluded, settings.pinned);
        if (!next.length)
            return;
        if (mode === 10 && !settings.sound)
            changeSettings({ sound: true });
        setDeck(next);
        setIndex(0);
        setCorrect(0);
        setWrong(0);
        setSelected(null);
        setAnswered(false);
        setReady(false);
        setHeard(false);
        setAudioError(false);
        setSaveError(false);
        setPhase('task');
    };
    const playSentence = useCallback(async () => {
        if (!item || !sentenceSounds[item.audio] || !settingsRef.current.sound)
            return;
        stopAll();
        const token = epoch.current;
        if (mode === 10 && !answeredRef.current) {
            optionReadyAnim.stopAnimation();
            optionReadyAnim.setValue(0);
            Animated.timing(optionReadyAnim, {
                toValue: 0.82,
                duration: 1350,
                delay: 80,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
                isInteraction: false,
            }).start();
        }
        setPlaying(true);
        setSentencePlaying(true);
        setAudioError(false);
        try {
            const ok = await play(sentenceSounds[item.audio]);
            if (!alive.current || token !== epoch.current)
                return;
            if (ok)
                setHeard(true);
            else
                setAudioError(true);
        }
        catch {
            if (alive.current && token === epoch.current)
                setAudioError(true);
        }
        finally {
            if (alive.current && token === epoch.current) {
                setPlaying(false);
                setSentencePlaying(false);
            }
        }
    }, [item?.id, item?.audio, mode, play, stopAll, optionReadyAnim]);
    const isFocused = useIsFocused();
    useEffect(() => {
        if (mode === 10 && phase === 'task' && isFocused && settings.sound && !answeredRef.current) {
            void playSentence();
        }
    }, [mode, phase, isFocused, settings.sound, playSentence]);
    const answer = async (option) => {
        if (answeredRef.current || !item || (mode === 10 && !heard))
            return;
        answeredRef.current = true;
        stopAll();
        const token = epoch.current;
        setSelected(option.id);
        setAnswered(true);
        setReady(false);
        setAudioError(false);
        const key = option.correct ? 'correct' : 'wrong';
        countsRef.current[key] += 1;
        setCorrect(countsRef.current.correct);
        setWrong(countsRef.current.wrong);
        if (!settingsRef.current.sound) {
            timer.current = setTimeout(() => {
                if (alive.current && token === epoch.current)
                    setReady(true);
                timer.current = null;
            }, 350);
            return;
        }
        const correctOption = mode === 9
            ? options.find(candidate => candidate.correct)
            : null;
        const correctAudioKey = correctOption
            ? optionAudioKey(conjugationIndex, item, correctOption.label)
            : '';
        const correctAudioSource = correctAudioKey ? soundsconj[correctAudioKey] : null;

        setPlaying(true);
        try {
            const feedbackOK = await play(option.correct ? FEEDBACK.yes : FEEDBACK.no, 8000);
            if (!alive.current || token !== epoch.current || !settingsRef.current.sound)
                return;
            if (!feedbackOK)
                setAudioError(true);

            // Exercise 9: after success/failure, pronounce the correct conjugated form.
            // The audio key comes from the matching verbs6RU row; no form numbering is assumed.
            if (mode === 9 && correctAudioSource) {
                setSentencePlaying(true);
                try {
                    const formOK = await play(correctAudioSource, 8000);
                    if (!alive.current || token !== epoch.current || !settingsRef.current.sound)
                        return;
                    if (!formOK)
                        setAudioError(true);
                }
                finally {
                    if (alive.current && token === epoch.current)
                        setSentencePlaying(false);
                }
            }
        }
        catch {
            if (alive.current && token === epoch.current)
                setAudioError(true);
        }
        finally {
            if (alive.current && token === epoch.current) {
                setSentencePlaying(false);
                setPlaying(false);
                setReady(true);
            }
        }
    };
    const next = async () => {
        if (!answeredRef.current || !ready || finishedRef.current)
            return;
        stopAll();
        if (index + 1 < deck.length) {
            answeredRef.current = false;
            setIndex(x => x + 1);
            setSelected(null);
            setAnswered(false);
            setReady(false);
            setHeard(false);
                setAudioError(false);
            return;
        }
        finishedRef.current = true;
        setPhase('result');
        if (isRealSession(mode, false)) {
            const c = countsRef.current;
            const result = (100 * c.correct / (c.correct + c.wrong)).toFixed(2);
            try {
                await updateStatistics(exerciseId, result);
            }
            catch (e) {
                console.warn('[SentenceExercise] statistics', e);
                if (alive.current)
                    setSaveError(true);
            }
        }
    };
    const setSound = () => { const enabled = !settingsRef.current.sound; if (!enabled)
        stopAll(); changeSettings({ sound: enabled }); };
    const header = (<View style={topStyles.topBar}>
      <TouchableOpacity onPress={goMenu} accessibilityRole="button" accessibilityLabel={ui.menu} activeOpacity={0.7}>
        <Image source={ICONS.logo} style={[topStyles.logo, mode === 9 && { width: Math.min(compact ? 90 : 130, Math.max(56, width - 258)) }]}/>
      </TouchableOpacity>
      <View style={topStyles.topButtons}>
        {[
            ...(mode === 9 ? [{ key: 'translation', source: settings.showTranslation !== false ? require('./translit1.png') : require('./translit2.png'), label: TRANSLATION_LABEL[language] || TRANSLATION_LABEL.en, onPress: () => changeSettings({ showTranslation: settings.showTranslation === false }), selected: settings.showTranslation !== false }] : []),
            { key: 'sound', source: settings.sound ? ICONS.on : ICONS.off, label: ui.sound, onPress: setSound },
            { key: 'list', source: ICONS.list, label: ui.settings, onPress: goSettings },
            { key: 'stats', source: ICONS.stats, label: ui.stats, onPress: () => setModal('stats') },
            { key: 'help', source: ICONS.help, label: ui.help, onPress: () => setModal('help') },
        ].map(button => (<TouchableOpacity key={button.key} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={button.label} accessibilityState={{ disabled: !!button.disabled, ...(button.key === 'translation' ? { selected: button.selected } : {}) }} disabled={button.disabled} onPress={button.onPress} style={button.disabled ? s.disabled : null}>
            <Image source={button.source} style={topStyles.topButtonIcon}/>
          </TouchableOpacity>))}
      </View>
    </View>);
    const progress = Math.min(index + (answered ? 1 : 0), deck.length);
    const remaining = Math.max(deck.length - progress, 0);
    const chip = (label, value) => {
        const selectedValue = settings.count === value;
        return <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: selectedValue }} onPress={() => changeSettings({ count: value })} activeOpacity={0.8} style={[settingsModal.choiceButton, settingsModal.countChoice, selectedValue && settingsModal.choiceSelected]}>
      <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[settingsModal.choiceText, selectedValue && settingsModal.choiceTextSelected]}>{label}</T>
    </TouchableOpacity>;
    };
    const allTensesSelected = TENSES.every(value => settings.tense.includes(value));
    const toggleTense = value => {
        if (value === 'all') { changeSettings({ tense: [...TENSES] }); return; }
        const current = Array.isArray(settings.tense) ? settings.tense : [...TENSES];
        if (current.includes(value) && current.length === 1) return;
        const selected = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
        changeSettings({ tense: TENSES.filter(item => selected.includes(item)) });
    };
    const tenseChip = value => {
        const selectedValue = value === 'all' ? allTensesSelected : settings.tense.includes(value);
        return <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: selectedValue }} onPress={() => toggleTense(value)} activeOpacity={0.8} style={[settingsModal.choiceButton, value === 'all' ? settingsModal.tenseAllChoice : settingsModal.tenseChoice, selectedValue && settingsModal.choiceSelected]}>
      <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[settingsModal.choiceText, selectedValue && settingsModal.choiceTextSelected]}>{ui[value]}</T>
    </TouchableOpacity>;
    };
    const isExcludedFromRotation = x => settings.excluded.includes(x.id);
    const isPinnedForRotation = x => settings.pinned.includes(x.id);
    const rotationMatches = (x, filter = rotationFilter) => {
        if (filter === 'excluded')
            return isExcludedFromRotation(x);
        if (filter === 'pinned')
            return isPinnedForRotation(x);
        return isExcludedFromRotation(x) || isPinnedForRotation(x);
    };
    const rotationItems = parsed.items.filter(x => rotationMatches(x));
    const rotationCount = filter => parsed.items.filter(x => rotationMatches(x, filter)).length;
    const reveal = answered;
    const optionHeight = mode === 9 ? 84 : (compact ? 54 : 60);
const optionWaitingAnimatedStyle =
    mode === 10 && !answered
        ? {
            backgroundColor: optionReadyAnim.interpolate({
                inputRange: [0, 0.82, 1],
                outputRange: [
                    '#F1F3F6',
                    '#FAFBFC',
                    '#FFFFFF',
                ],
            }),

            borderColor: optionReadyAnim.interpolate({
                inputRange: [0, 0.35, 0.82, 1],
                outputRange: [
                    '#ECEFF3',
                    '#D7DCE3',
                    '#AEB9C7',
                    '#6C8EBB',
                ],
            }),

        }
        : null;
    const optionTextOpacity = optionReadyAnim.interpolate({
        inputRange: [0, 0.35, 0.82, 1],
        outputRange: [0.16, 0.38, 0.78, 1],
    });
    if (!loaded)
        return <ScreenSafeAreaView style={s.screen} edges={['top', 'left', 'right']}><ActivityIndicator style={{ flex: 1 }} color="#FFFDEF" accessibilityLabel={ui.loading}/></ScreenSafeAreaView>;
    return <ScreenSafeAreaView style={s.screen} edges={['top', 'left', 'right']}><View style={phase === 'settings' ? settingsModal.root : [s.container, width > 650 && s.wide]}>
    {phase !== 'settings' && header}
    {phase === 'settings' && <>
      <View style={settingsModal.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={ui.close} onPress={goMenu} activeOpacity={0.75} style={settingsModal.closeButton}>
          <Text maxFontSizeMultiplier={1.2} style={settingsModal.closeButtonIcon}>‹</Text>
        </TouchableOpacity>
        <View style={settingsModal.headerTextWrap}>
          <T style={settingsModal.exerciseLabel}>{EXERCISE_LABEL[language] || EXERCISE_LABEL.en} {mode}</T>
          <T numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75} style={settingsModal.title}>{title}</T>
        </View>
      </View>
      <ScrollView style={settingsModal.scroll} contentContainerStyle={settingsModal.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={settingsModal.settingsCard}>
          <T style={[settingsModal.sectionTitle, rtl && s.rtl]}>{ui.tense}</T>
          <View style={settingsModal.choicesWrap}>{['all', ...TENSES].map(tenseChip)}</View>
          <View style={settingsModal.divider}/>
          <T style={[settingsModal.sectionTitle, rtl && s.rtl]}>{ui.count}</T>
          <View style={settingsModal.choicesWrap}>{COUNTS.map(x => chip(String(x), x))}</View>
        </View>
        <View style={settingsModal.infoCard}>
          <View style={settingsModal.availableRow}>
            <T style={settingsModal.availableLabel}>{ui.available}</T>
            <View style={settingsModal.availableBadge}><T style={settingsModal.availableBadgeText}>{pool.length} / {eligible.length}</T></View>
          </View>
          <T style={[settingsModal.helpText, rtl && s.rtl]}>{exerciseHelp}</T>
        </View>
        {!pool.length && <View style={settingsModal.emptyCard}><T style={[settingsModal.emptyText, rtl && s.rtl]}>{ui.empty}</T></View>}
      </ScrollView>
      <View style={settingsModal.bottomBar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={ui.start} accessibilityState={{ disabled: !pool.length }} disabled={!pool.length} onPress={start} activeOpacity={0.85} style={[settingsModal.startButton, !pool.length && settingsModal.startButtonDisabled]}>
          <T style={settingsModal.startButtonText}>{ui.start}</T>
        </TouchableOpacity>
      </View>
    </>}
    {phase === 'task' && item && <>
      <View style={topStyles.progressContainer}>
        <View style={topStyles.progressTextContainer}>
          <Text style={topStyles.progressStatText} maxFontSizeMultiplier={1.2}>
            {ui.correct}: {correct}
          </Text>
          <Text style={topStyles.progressStatText} maxFontSizeMultiplier={1.2}>
            {ui.wrong}: {wrong}
          </Text>
        </View>
        <View style={topStyles.remainingTasksContainer}>
          <Text style={topStyles.remainingTasksText} maxFontSizeMultiplier={1.2}>
            {remaining}
          </Text>
        </View>
        <View style={topStyles.percentContainer}>
          <Text style={topStyles.percentText} maxFontSizeMultiplier={1.2}>
            {Math.round(Number(score))}%
          </Text>
        </View>
      </View>
      <View style={topStyles.progressBarContainer}>
        <ProgressBar progress={progress} totalExercises={deck.length}/>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
        <T style={s.taskTitle}>{ui[`choose${mode}`]}</T>
        <View>
         <View style={[
                s.card,
                compact && { padding: 12 },
                mode === 10 && { paddingTop: 10, paddingBottom: 3 },
            ]}>
            {mode === 9 ? (<>
                <View style={card9.hebrewBox}>
                  <MovingBackdrop motion={cardMotion} colors={['126,177,226', '144,201,210']}/>
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false}>
                    <SentenceWithVerbSlot key={item.id} split={split} answered={answered} compact={compact}/>
                  </ScrollView>
                </View>
          <View style={card9.translationBox}>
  <MovingBackdrop motion={cardMotion} colors={['185,155,218', '216,169,198']} reverse/>
  <ScrollView style={card9.translationScroll} contentContainerStyle={card9.translationContent} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false}>
    <TranslationText text={item[language]} rtl={rtl}/>
  </ScrollView>
            </View>
                <View style={card9.translitBox}>
                    <MovingBackdrop motion={cardMotion} colors={['230,179,121', '226,151,167']}/>
                    <ScrollView style={{ flex: 1, alignSelf: 'stretch', zIndex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10 }} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false} accessibilityElementsHidden={!answered} importantForAccessibility={!answered ? 'no-hide-descendants' : 'auto'}>
                      <T style={[s.translit, card9.front, { flex: 0, fontSize: 15, lineHeight: 20 }, !answered && { opacity: 0 }]}>{item.translit}</T>
                    </ScrollView>
                </View>
              </>) : (<>
                <View style={card9.hebrewBox}>
                  <MovingBackdrop motion={cardMotion} vivid colors={['89,158,230', '85,204,184']}/>
                  {!reveal && sentencePlaying ? (
                    <LottieView
                      source={require('./assets/Animation - 1718430107767.json')}
                      autoPlay
                      loop
                      pointerEvents="none"
                      style={card9.audioLottie}
                    />
                  ) : reveal ? (
                    <ScrollView style={{ flex: 1, width: '100%', zIndex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false}>
                      <AnswerTextEntrance key={item.id} distance={3}>
                        <T style={[s.hebrew, { fontSize: compact ? 19 : 20, lineHeight: compact ? 25 : 27 }]}>{item.hebrew}</T>
                      </AnswerTextEntrance>
                    </ScrollView>
                  ) : (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      <TouchableOpacity accessibilityRole="button" accessibilityLabel={heard ? (LISTEN_AGAIN[language] || LISTEN_AGAIN.en) : ui.listen} disabled={!sentenceSounds[item.audio] || !settings.sound} onPress={playSentence} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 1, padding: 8, opacity: !sentenceSounds[item.audio] || !settings.sound ? 0.4 : 1 }}>
                        <Image source={ICONS.speaker} style={{ width: 24, height: 24, resizeMode: 'contain' }}/>
                        <T style={[s.note, { flexShrink: 1, marginHorizontal: 8 }]}>{!sentenceSounds[item.audio] ? ui.missing : heard ? (LISTEN_AGAIN[language] || LISTEN_AGAIN.en) : ui.listen}</T>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={[card9.translitBox, { paddingHorizontal: 10 }]}>
                  <MovingBackdrop motion={cardMotion} colors={['230,179,121', '226,151,167']}/>
                  <ScrollView style={{ flex: 1, alignSelf: 'stretch', zIndex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false} accessibilityElementsHidden={!reveal} importantForAccessibility={!reveal ? 'no-hide-descendants' : 'auto'}>
                    <T style={[s.translit, { flex: 0, fontSize: 15, lineHeight: 20 }, (!reveal) && { opacity: 0 }]}>{reveal ? item.translit : ''}</T>
                  </ScrollView>
                </View>
              </>)}
            {audioError && <T style={s.error}>{ui.audioError}</T>}
            <View style={s.rotation}>
              {mode === 9 && answered && (
                <View style={card9.replayControls}>
                  <Icon
                    source={ICONS.speaker}
                    iconStyle={{ width: 24, height: 24 }}
                    label={LISTEN_AGAIN[language] || LISTEN_AGAIN.en}
                    disabled={!sentenceSounds[item.audio] || !settings.sound || playing}
                    onPress={playSentence}
                  />
                  {sentencePlaying && (
                    <View pointerEvents="none" style={card9.replayLottieWrap}>
                      <LottieView
                        source={require('./assets/Animation - 1718430107767.json')}
                        autoPlay
                        loop
                        pointerEvents="none"
                        style={card9.replayLottie}
                      />
                    </View>
                  )}
                </View>
              )}
              {mode === 10 && reveal && (
                <View style={card9.replayControls}>
                  <Icon
                    source={ICONS.speaker}
                    iconStyle={{ width: 24, height: 24 }}
                    label={LISTEN_AGAIN[language] || LISTEN_AGAIN.en}
                    disabled={!sentenceSounds[item.audio] || !settings.sound || playing}
                    onPress={playSentence}
                  />
                  {sentencePlaying && (
                    <View pointerEvents="none" style={card9.replayLottieWrap}>
                      <LottieView
                        source={require('./assets/Animation - 1718430107767.json')}
                        autoPlay
                        loop
                        pointerEvents="none"
                        style={card9.replayLottie}
                      />
                    </View>
                  )}
                </View>
              )}
              <Icon label={settings.excluded.includes(item.id) ? ui.restore : ui.hidden} source={settings.excluded.includes(item.id) ? ICONS.hidden : ICONS.hide} active={settings.excluded.includes(item.id)} onPress={() => toggleRotation(item.id, 'excluded')}/>
              <Icon label={ui.pinned} source={settings.pinned.includes(item.id) ? ICONS.pinned : ICONS.pin} active={settings.pinned.includes(item.id)} onPress={() => toggleRotation(item.id, 'pinned')}/>
              <Icon label={ui.list} source={ICONS.rotation} onPress={() => { setRotationFilter('all'); setModal('list'); }}/>
            </View>
          </View>
          <View style={[s.options, mode === 10 && { flexDirection: 'column', flexWrap: 'nowrap' }]}>{options.map((option, optionIndex) => {
                const good = answered && option.correct, bad = answered && selected === option.id && !option.correct;
                const waitingForAudio = mode === 10 && !answered && !heard;
                const disabled = answered || waitingForAudio || sentencePlaying;
                return <AnimatedTouchableOpacity key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ disabled }} disabled={disabled} onPress={() => answer(option)} activeOpacity={0.8} style={[s.option, { minHeight: optionHeight }, mode === 10 && { width: '100%', height: optionHeight, maxHeight: optionHeight, paddingVertical: 4, marginBottom: 7, borderWidth: 2 }, mode === 9 && { overflow: 'hidden', height: optionHeight, maxHeight: optionHeight, paddingVertical: 4 }, optionWaitingAnimatedStyle, good && s.good, bad && s.bad, answered && !good && !bad && s.inactive]}>
              <Animated.View
                style={[
                  {
                    width: '100%',
                    alignSelf: 'stretch',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: mode === 10 && !answered ? optionTextOpacity : 1,
                  },
                  mode === 10 && { flex: 1 },
                ]}
              >
                {mode === 10 ? (
                  <T
                    numberOfLines={2}
                    textBreakStrategy="simple"
                    style={[
                      s.optionTranslation,
                      {
                        width: '100%',
                        height: '100%',
                        alignSelf: 'stretch',
                        flexShrink: 0,
                        fontSize: compact ? 14 : 15,
                        lineHeight: compact ? 18 : 20,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        includeFontPadding: false,
                        paddingVertical: 0,
                        writingDirection: rtl ? 'rtl' : 'ltr',
                      },
                      rtl && s.rtl,
                    ]}
                  >
                    {option.label}
                  </T>
                ) : (
                  <AnswerTextEntrance
                    key={`${item.id}-${option.id}`}
                    delay={optionIndex * 90}
                    distance={10}
                    duration={430}
                    startOpacity={0.08}
                    startScale={0.96}
                  >
                    <T
                      style={[
                        card9.front,
                        s.optionHebrew,
                        { fontSize: 24, lineHeight: 30 },
                      ]}
                    >
                      {option.label}
                    </T>
                    {settings.showTranslation !== false && <View style={{ width: '100%', minHeight: 32, justifyContent: 'center', zIndex: 1 }} accessibilityElementsHidden={settings.showTranslation === false} importantForAccessibility={settings.showTranslation === false ? 'no-hide-descendants' : 'auto'}>
                      <T style={{ fontSize: 14, lineHeight: 16, fontWeight: '700', color: '#CE6857', textAlign: 'center', writingDirection: 'ltr' }}>{optionTransliteration(conjugationIndex, item, option.label) || ' '}</T>
                    </View>}
                  </AnswerTextEntrance>
                )}
              </Animated.View>
            </AnimatedTouchableOpacity>;
            })}</View>
        </View>
      </ScrollView>
      <Button disabled={!answered || !ready || sentencePlaying} label={index + 1 === deck.length ? ui.finish : ui.next} onPress={next}/>
    </>}
    {phase === 'result' && <ScrollView contentContainerStyle={s.scrollBody}><View style={s.card}><T style={s.section}>{ui.completed}</T><T style={s.note}>{ui.result}</T><T style={s.score}>{score}%</T><T style={s.translation}>{ui.correct}: {correct}   {ui.wrong}: {wrong}</T>{saveError && <T style={s.error}>{ui.saveError}</T>}</View><Button label={ui.again} onPress={() => setPhase('settings')}/><Button secondary label={ui.menu} onPress={goMenu}/></ScrollView>}
    <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}><SafeAreaView style={s.overlay}><View style={[s.modalCard, modal === 'list' && { height: '88%' }]}><T style={s.section}>{ui[modal] || ui.list}</T>
      {modal === 'help' && <ScrollView><T style={[s.helpText, rtl && s.rtl]}>{modalHelp}</T></ScrollView>}
      {modal === 'stats' && (!stats ? <ActivityIndicator color="#CE6857"/> : <View><T style={s.translation}>{title}</T>{statsError ? <T style={s.error}>{ui.empty}</T> : <><T style={s.helpText}>{ui.sessions}: {Number(stats.timesCompleted) || 0}</T><T style={s.helpText}>{ui.best}: {Number(stats.bestScore || 0).toFixed(1)}%</T><T style={s.helpText}>{ui.average}: {Number(stats.averageScore ?? stats.averageCompletionRate ?? 0).toFixed(1)}%</T></>}</View>)}
      {modal === 'list' && <>
        <View style={s.wrap}>
          {['all', 'excluded', 'pinned'].map((filter, i) => {
                const count = rotationCount(filter);
                return <TouchableOpacity key={filter} accessibilityRole="button" accessibilityState={{ selected: rotationFilter === filter }} onPress={() => setRotationFilter(filter)} style={[s.chip, rotationFilter === filter && s.chipSelected, { paddingHorizontal: 8, paddingVertical: 6 }]}>
              <T style={[{ fontSize: 13 }, rotationFilter === filter && s.white]}>{(ROTATION_FILTERS[language] || ROTATION_FILTERS.en)[i]}: {count}</T>
            </TouchableOpacity>;
            })}
        </View>
        <FlatList style={{ flex: 1 }} data={rotationItems} extraData={settings} keyExtractor={x => x.id} ListEmptyComponent={null} renderItem={({ item: x }) => <View style={s.listRow}>
            <View style={{ flex: 1 }}><T style={s.listHebrew}>{x.hebrew}</T><T style={[s.note, rtl && s.rtl]}>{x[language]}</T></View>
            <Icon label={settings.excluded.includes(x.id) ? ui.restore : ui.hidden} source={settings.excluded.includes(x.id) ? ICONS.hidden : ICONS.hide} active={settings.excluded.includes(x.id)} onPress={() => toggleRotation(x.id, 'excluded')}/>
            <Icon label={settings.pinned.includes(x.id) ? ui.unpin : ui.pinned} source={settings.pinned.includes(x.id) ? ICONS.pinned : ICONS.pin} active={settings.pinned.includes(x.id)} onPress={() => toggleRotation(x.id, 'pinned')}/>
          </View>}/>
      </>}
      <Button label={ui.close} onPress={() => setModal(null)}/>
    </View></SafeAreaView></Modal>
  </View></ScreenSafeAreaView>;
}
const settingsModal = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#83A3CD' },
    header: { minHeight: 82, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4, position: 'relative' },
    closeButton: { position: 'absolute', left: 16, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    closeButtonIcon: { color: '#FFFDEF', fontSize: 38, lineHeight: 40, fontWeight: '500', marginTop: -3 },
    headerTextWrap: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60 },
    exerciseLabel: { color: 'rgba(255,253,239,0.82)', fontSize: 13, lineHeight: 16, fontWeight: '800', textAlign: 'center', marginTop: 3, marginBottom: 2 },
    title: { marginTop: 0, marginBottom: 4, color: '#FFFDEF', fontSize: 20, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 18 },
    settingsCard: { backgroundColor: '#FFFDEF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 4 },
    sectionTitle: { color: '#333652', fontSize: 15, lineHeight: 18, fontWeight: '900', marginBottom: 10 },
    choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choiceButton: { minHeight: 40, paddingHorizontal: 10, borderWidth: 2, borderColor: '#D7DCE6', borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    tenseAllChoice: { flexGrow: 1, flexBasis: '100%' },
    tenseChoice: { flexGrow: 1, flexBasis: '28%' },
    countChoice: { flexGrow: 1, flexBasis: '20%' },
    choiceSelected: { borderColor: '#CE6857', backgroundColor: '#CE6857' },
    choiceText: { color: '#333652', fontSize: 13, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
    choiceTextSelected: { color: '#FFFDEF' },
    divider: { height: 1, marginVertical: 14, backgroundColor: 'rgba(51,54,82,0.1)' },
    infoCard: { marginTop: 10, backgroundColor: '#FFFDEF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    availableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    availableLabel: { color: '#333652', fontSize: 15, lineHeight: 20, fontWeight: '900' },
    availableBadge: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#83A3CD' },
    availableBadgeText: { color: '#FFFDEF', fontSize: 13, fontWeight: '900' },
    helpText: { marginTop: 9, color: '#73788F', fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
    emptyCard: { marginTop: 10, minHeight: 80, borderRadius: 16, backgroundColor: '#FFFDEF', alignItems: 'center', justifyContent: 'center', padding: 14 },
    emptyText: { color: '#A82E3F', fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
    bottomBar: { flexShrink: 0, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#83A3CD', shadowColor: '#000000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 8 },
    startButton: { minHeight: 52, borderRadius: 26, backgroundColor: '#CE6857', alignItems: 'center', justifyContent: 'center' },
    startButtonDisabled: { opacity: 0.4 },
    startButtonText: { color: '#FFFDEF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
});
const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#83A3CD' }, container: { flex: 1, paddingHorizontal: 16 }, wide: { width: 650, alignSelf: 'center' }, text: { color: '#333652', fontSize: 16, includeFontPadding: false }, white: { color: '#FFFDEF' }, row: { flexDirection: 'row', alignItems: 'center' }, header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, logo: { width: 112, height: 60, resizeMode: 'contain' }, iconButton: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, icon: { width: 30, height: 30, resizeMode: 'contain' }, activeIcon: { backgroundColor: '#F8E7ED' }, disabled: { opacity: 0.4 }, scrollBody: { flexGrow: 1, paddingBottom: 10 }, title: { color: '#FFFDEF', fontSize: 25, fontWeight: '800', textAlign: 'center', marginVertical: 16 }, taskTitle: { color: '#FFFDEF', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 10 }, card: { backgroundColor: '#FFFDEF', borderRadius: 24, padding: 17, marginBottom: 12, shadowColor: '#333652', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 }, section: { fontSize: 20, fontWeight: '800', marginVertical: 10, textAlign: 'center' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }, wrapCenter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 5 }, chip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#83A3CD', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, margin: 4 }, chipSelected: { backgroundColor: '#CE6857', borderColor: '#CE6857' }, badge: { backgroundColor: '#E6EEF8', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8, margin: 3, fontSize: 14, textAlign: 'center' }, button: { backgroundColor: '#CE6857', minHeight: 50, borderRadius: 26, justifyContent: 'center', alignItems: 'center', padding: 10, marginVertical: 6 }, buttonText: { color: '#FFFDEF', fontSize: 18, fontWeight: '800', textAlign: 'center' }, secondary: { backgroundColor: '#FFFDEF', borderWidth: 1, borderColor: '#D6DDE8' }, secondaryText: { color: '#333652' }, note: { fontSize: 14, color: '#687084', textAlign: 'center', marginVertical: 6, lineHeight: 20 }, whiteNote: { color: '#FFFDEF', fontSize: 14, textAlign: 'center', margin: 8 }, switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 }, progressBox: { backgroundColor: '#6C8EBB', borderRadius: 12, padding: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }, progressNumber: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' }, track: { height: 6, backgroundColor: '#B6C9E2', borderRadius: 4, overflow: 'hidden', marginVertical: 9 }, fill: { height: 6, backgroundColor: '#CE6857' }, sentenceBox: { backgroundColor: '#EEF2F7', borderWidth: 1, borderColor: '#CDD9E9', borderRadius: 18, padding: 12, alignItems: 'center', justifyContent: 'center' }, hebrew: { fontSize: 29, lineHeight: 42, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' }, highlight: { color: '#A84F70' }, blank: { color: '#CE6857' }, translationSlot: { minHeight: 54, justifyContent: 'center', paddingVertical: 5 }, translation: { fontSize: 17, lineHeight: 24, textAlign: 'center' }, rtl: { writingDirection: 'rtl', textAlign: 'right' }, translitBox: { minHeight: 58, backgroundColor: '#F6F0E6', borderColor: '#D8C09F', borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 5 }, translit: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '600', color: '#CE6857', textAlign: 'center', writingDirection: 'ltr' }, abc: { width: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, abcText: { fontSize: 13, fontWeight: '800', color: '#CE6857' }, bigSpeaker: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#F6F0E6', alignItems: 'center', justifyContent: 'center' }, rotation: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }, options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, option: { width: '48.7%', borderRadius: 18, borderWidth: 2, borderColor: '#83A3CD', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 10, marginBottom: 9 }, optionHebrew: { fontSize: 27, lineHeight: 37, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' }, optionTranslation: { width: '100%', alignSelf: 'stretch', flexShrink: 0, fontSize: 16, lineHeight: 23, fontWeight: '600', textAlign: 'center', includeFontPadding: false }, optionWaiting: { backgroundColor: '#F3F5F8', borderColor: '#D5DCE5' }, optionTextWaiting: { color: '#AEB5C1' }, good: { backgroundColor: '#AFFFCA', borderColor: '#62B57D' }, bad: { backgroundColor: '#FFBCBC', borderColor: '#D86F6F' }, inactive: { backgroundColor: '#E4E7ED', borderColor: '#C9CED7' }, footerLink: { alignItems: 'center', paddingBottom: 8, paddingTop: 2 }, previewBanner: { backgroundColor: '#FFF0C8', color: '#71531B', padding: 8, borderRadius: 10, textAlign: 'center', fontSize: 14, marginBottom: 10 }, error: { color: '#A82E3F', textAlign: 'center', fontSize: 14, margin: 8 }, score: { fontSize: 52, fontWeight: '900', textAlign: 'center', color: '#CE6857', margin: 16 }, overlay: { flex: 1, backgroundColor: 'rgba(30,38,58,0.5)', justifyContent: 'center', padding: 18 }, modalCard: { backgroundColor: '#FFFDEF', borderRadius: 24, padding: 18, maxHeight: '88%' }, helpText: { fontSize: 17, lineHeight: 26, marginVertical: 10 }, listRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DFE8', paddingVertical: 10 }, listHebrew: { fontSize: 19, textAlign: 'right', writingDirection: 'rtl' },
});
// Header and session summary use the styles of PrepositionVerbExercise.
const createTopStyles = compact => StyleSheet.create({
    topBar: {
        flexShrink: 0,
        minHeight: compact ? 44 : 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        width: compact ? 90 : 130,
        height: compact ? 44 : 84,
        resizeMode: 'contain',
    },
    topButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    topButtonIcon: {
        width: 38,
        height: 38,
        resizeMode: 'contain',
    },
    progressContainer: {
        width: '100%',
        minHeight: compact ? 42 : 54,
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C8EBB',
        borderRadius: 10,
        marginTop: 0,
        marginBottom: compact ? 4 : 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    progressTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    progressStatText: {
        color: '#FFFFFF',
        fontSize: 12,
        lineHeight: 17,
        textAlign: 'left',
        marginLeft: 14,
    },
    remainingTasksContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    remainingTasksText: {
        minWidth: 44,
        paddingHorizontal: 8,
        paddingVertical: 1,
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 27,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#83A3CD',
        borderRadius: 10,
    },
    percentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    percentText: {
        minWidth: 68,
        paddingHorizontal: 8,
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#83A3CD',
        borderRadius: 10,
    },
    progressBarContainer: {
        width: '100%',
        flexShrink: 0,
        marginBottom: compact ? 6 : 14,
    },
});
const LISTEN_AGAIN = { ru: 'Прослушать ещё раз', en: 'Listen again', fr: 'Écouter à nouveau', es: 'Escuchar de nuevo', pt: 'Ouvir novamente', ar: 'استمع مرة أخرى', am: 'እንደገና አዳምጥ' };
const TRANSLATION_LABEL = { ru: 'Показать или скрыть перевод и транслитерацию вариантов', en: 'Show or hide translation and answer transliterations', fr: 'Afficher ou masquer la traduction', es: 'Mostrar u ocultar la traducción', pt: 'Mostrar ou ocultar a tradução', ar: 'إظهار الترجمة أو إخفاؤها', am: 'ትርጉሙን አሳይ ወይም ደብቅ' };
function MovingBackdrop({ motion, colors, reverse = false, vivid = false }) {
    const direction = reverse ? -1 : 1;
    return <View pointerEvents="none" accessible={false} style={card9.backdrop}>
    {colors.map((color, i) => <Animated.View key={color} style={[card9.field, {
                    top: i === 0 ? '-60%' : '-20%', left: i === 0 ? '-40%' : '10%',
                    transform: [
                        { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [(vivid ? -85 : -30) * direction * (i ? -1 : 1), (vivid ? 95 : 40) * direction * (i ? -1 : 1)] }) },
                        { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [i ? -10 : 8, i ? 14 : -8] }) },
                        { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, vivid ? 1.35 : 1.16] }) },
                    ],
                }]}>
      <LinearGradient colors={[
                `rgba(${color},0)`, `rgba(${color},0.10)`, `rgba(${color},${vivid ? 0.65 : 0.34})`,
                `rgba(${color},0.20)`, `rgba(${color},0)`,
            ]} start={{ x: 0, y: i }} end={{ x: 1, y: 1 - i }} style={StyleSheet.absoluteFillObject}/>
    </Animated.View>)}
  </View>;
}
const card9 = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 16 },
    field: { position: 'absolute', width: '140%', height: '240%' },
    front: { zIndex: 1 },
    hebrewBox: { height: 84, minHeight: 84, maxHeight: 84, flexGrow: 0, flexShrink: 0, borderWidth: 1, borderColor: '#AABFD7', backgroundColor: '#EAF1F8', borderRadius: 18, overflow: 'hidden', padding: 6, justifyContent: 'center' },
    questionCloud: { borderRadius: 10, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: 5 }] },
    questionMark: { transform: [{ translateY: 3 }], fontSize: 19, lineHeight: 24, fontWeight: '700', color: '#8C492C', textAlign: 'center', includeFontPadding: false },
    translationScroll: { flex: 1, width: '100%', zIndex: 1 },
    translationContent: { flexGrow: 1, justifyContent: 'center' },
    hebrewText: { width: '100%', zIndex: 1, paddingBottom: 4 },
    translationBox: { height: 60, minHeight: 60, maxHeight: 60, flexGrow: 0, flexShrink: 0, marginTop: 7, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#C8B5D6', backgroundColor: '#F2EDF7', borderRadius: 16, overflow: 'hidden', justifyContent: 'center' },
    translitBox: { height: 60, minHeight: 60, maxHeight: 60, flexGrow: 0, flexShrink: 0, marginTop: 7, paddingVertical: 4, paddingHorizontal: 4, borderWidth: 1, borderColor: '#D8C09F', backgroundColor: '#F6F0E6', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
    speakerButton: { position: 'absolute', right: 3, bottom: 3, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    speakerIcon: { width: 18, height: 18, resizeMode: 'contain' },
    audioLottie: { position: 'absolute', top: '50%', left: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -25, zIndex: 5 },
    replayControls: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible' },
    replayLottieWrap: { width: 36, height: 42, alignItems: 'center', justifyContent: 'center', marginLeft: 0, overflow: 'visible' },
    replayLottie: { width: 36, height: 36, transform: [{ scale: 0.66 }] },
});
function TranslationText({ text, rtl }) {
    return <T
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.68}
      style={[
          s.translation,
          {
              width: '100%',
              alignSelf: 'stretch',
              fontSize: 16,
              lineHeight: 22,
              textAlign: 'center',
          },
          card9.front,
          rtl && s.rtl,
      ]}>
      {text}
    </T>;
}

// Measure the actual Hebrew word with the same font and system scaling as the sentence.
// Both states use this exact inline box, preserving wrapping and neighbouring word positions.
function SentenceWithVerbSlot({ split, answered, compact }) {
    const fontSize = compact ? 21 : 22;
    const lineHeight = compact ? 28 : 30;
    const textStyle = { fontSize, lineHeight, fontWeight: '700', includeFontPadding: false,
        writingDirection: 'rtl', textAlign: 'center', color: '#333652' };
    const words = value => String(value || '').trim().split(/\s+/).filter(Boolean);
    const parts = [
        ...words(split?.before).map(word => ({ word, target: false })),
        { word: split?.word || '', target: true },
        ...words(split?.after).map(word => ({ word, target: false })),
    ];
    const spokenText = parts.map(part => part.target && !answered ? '?' : part.word).join(' ');
    return <AnswerTextEntrance distance={3}>
    <View accessible accessibilityLabel={spokenText} style={{ width: '100%', flexDirection: 'row-reverse', direction: 'ltr', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center', paddingVertical: 2 }}>
      {parts.map((part, index) => <View key={index} style={{ position: 'relative', marginHorizontal: 2, marginVertical: 1, paddingHorizontal: part.target ? 4 : 0, flexShrink: 0 }}>
        {/* The full word always occupies its natural width and height. */}
        <Text accessible={false} maxFontSizeMultiplier={1.2} style={[textStyle, part.target && { color: answered ? '#A84F70' : 'transparent' }]}>
          {part.word}
        </Text>
        {part.target && !answered && <View pointerEvents="none" accessible={false} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 9,
                    borderWidth: 1, borderColor: '#B5744D', backgroundColor: '#F2CAA8',
                    alignItems: 'center', justifyContent: 'center' }}>
          <Text accessible={false} maxFontSizeMultiplier={1.2} style={{ fontSize: 19, lineHeight: 24, fontWeight: '700', color: '#8C492C', includeFontPadding: false, textAlign: 'center' }}>?</Text>
        </View>}
      </View>)}
    </View>
  </AnswerTextEntrance>;
}
const ROTATION_FILTERS = {
    ru: ['Отмеченные', 'Исключены', 'Чаще'],
    en: ['Marked', 'Excluded', 'More often'],
    fr: ['Marqués', 'Exclus', 'Plus souvent'],
    es: ['Marcados', 'Excluidos', 'Más a menudo'],
    pt: ['Marcados', 'Excluídos', 'Mais vezes'],
    ar: ['المحددة', 'المستبعدة', 'بتكرار أكثر'],
    am: ['ምልክት የተደረጉ', 'የተወገዱ', 'በተደጋጋሚ'],
};
// Backgrounds and button dimensions stay fixed; only content animates.
function AnswerTextEntrance({
    children,
    active = true,
    delay = 0,
    distance = 5,
    duration = 320,
    startOpacity = 0.3,
    startScale = 1,
}) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        progress.stopAnimation();

        if (!active) {
            progress.setValue(0);
            return;
        }

        progress.setValue(0);

        const animation = Animated.timing(progress, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
            isInteraction: false,
        });

        animation.start();

        return () => animation.stop();
    }, [active, delay, duration, progress]);

    return (
        <Animated.View
            style={{
                width: '100%',

                opacity: active
                    ? progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [startOpacity, 1],
                    })
                    : 0,

                transform: [
                    {
                        translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [distance, 0],
                        }),
                    },
                    {
                        scale: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [startScale, 1],
                        }),
                    },
                ],
            }}
        >
            {children}
        </Animated.View>
    );
}
   