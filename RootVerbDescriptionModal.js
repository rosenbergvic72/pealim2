import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  normalizeRootLanguage,
} from './RootVerbRotationModal';

const CONTENT = {
  ru: {
    title: 'СЕМЕЙСТВА КОРНЯ',
    lead: 'Один корень. Разные биньяны. Разные значения.',
    intro:
      'Однокоренные глаголы легко перепутать: знакомые буквы создают ощущение, что значение уже понятно. Это упражнение помогает замечать различия и выбирать именно тот глагол, который выражает вашу мысль.',
    benefitTitle: 'ПОЧЕМУ ЭТО ПОЛЕЗНО',
    benefits: [
      'Учитесь различать похожие глаголы. Варианты ответа принадлежат одному семейству, поэтому приходится обращать внимание на форму и значение.',
      'Связываете корень, биньян и перевод. Слова запоминаются через сравнение с родственными глаголами.',
      'Тренируете важные для речи различия: учиться или учить, открывать или открываться, развивать или развиваться.',
      'Проверяете, можете ли самостоятельно вспомнить значение, а не только узнать знакомое слово.',
    ],
    exampleTitle: 'ОДИН КОРЕНЬ — РАЗНЫЕ ДЕЙСТВИЯ',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'учиться' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'учить кого-либо' },
    ],
    exampleNote:
      'Корень ל-מ-ד связан с учёбой. Но в одном случае человек учится сам, а в другом помогает учиться кому-то ещё. Для точной речи эта разница принципиальна.',
    howTitle: 'КАК ВЫПОЛНЯТЬ',
    steps: [
      'Посмотрите на глагол, его корень, биньян и транслитерацию.',
      'Выберите перевод из 2, 3 или 4 вариантов одного семейства.',
      'После ответа сравните глаголы и биньяны, которые появятся рядом со всеми переводами.',
      'Прослушайте произношение, если для глагола доступна запись и включён звук.',
    ],
    tipTitle: 'КАК ПОЛУЧИТЬ БОЛЬШЕ ПОЛЬЗЫ',
    tip:
      'Сначала попробуйте вспомнить перевод, затем смотрите на варианты. После ошибки сравните выбранный глагол с правильным и придумайте короткую фразу с каждым. Закрепляйте трудные глаголы, чтобы встречать их чаще.',
    noteTitle: 'БИНЬЯН — ПОДСКАЗКА К ЗНАЧЕНИЮ',
    note:
      'Биньяны помогают замечать закономерности, но не работают как формула перевода. Значение каждого глагола нужно запоминать отдельно. В упражнении для него выбрано одно значение; в других контекстах возможны и другие.',
    close: 'ПОНЯТНО',
  },
  en: {
    title: 'ROOT FAMILIES',
    lead: 'One root. Different binyanim. Different meanings.',
    intro:
      'Verbs with the same root are easy to confuse: familiar letters can make you feel that you already know the meaning. This exercise helps you notice the differences and choose the verb that expresses what you mean.',
    benefitTitle: 'WHY THIS HELPS',
    benefits: [
      'Learn to distinguish similar verbs. All answer choices come from one family, so you need to pay attention to both form and meaning.',
      'Connect the root, binyan and translation. Compare related verbs to build connections between words.',
      'Practice distinctions that matter in speech: learning or teaching, opening something or opening up, developing something or developing.',
      'Check whether you can recall a meaning yourself, rather than simply recognize a familiar word.',
    ],
    exampleTitle: 'ONE ROOT, DIFFERENT ACTIONS',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'to learn' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'to teach someone' },
    ],
    exampleNote:
      'The root ל-מ-ד is connected with learning. In one verb, a person learns; in the other, they teach someone else. This difference matters when expressing yourself accurately.',
    howTitle: 'HOW TO PRACTICE',
    steps: [
      'Look at the verb, its root, binyan and transliteration.',
      'Choose its translation from 2, 3 or 4 options within the same family.',
      'After answering, compare the verbs and binyanim shown beside all translations.',
      'Listen to the pronunciation when a recording is available and sound is enabled.',
    ],
    tipTitle: 'GET MORE FROM YOUR PRACTICE',
    tip:
      'Try to recall the translation before looking at the choices. After a mistake, compare the verb you chose with the correct one and think of a short sentence for each. Pin difficult verbs to see them more often.',
    noteTitle: 'A BINYAN IS A CLUE TO MEANING',
    note:
      'Binyanim help you notice patterns, but they are not a translation formula. Learn the meaning of each verb individually. This exercise uses one selected meaning per verb; other contexts may bring other meanings.',
    close: 'GOT IT',
  },
  fr: {
    title: 'FAMILLES DE RACINES',
    lead: 'Une racine. Plusieurs binyanim. Des sens différents.',
    intro:
      'Les verbes de même racine se confondent facilement : des lettres familières peuvent donner l’impression de déjà comprendre le mot. Cet exercice vous aide à repérer les différences et à choisir le verbe qui exprime votre pensée.',
    benefitTitle: 'POURQUOI CET EXERCICE EST UTILE',
    benefits: [
      'Distinguez les verbes qui se ressemblent. Toutes les réponses appartiennent à une même famille : la forme et le sens comptent.',
      'Reliez la racine, le binyan et la traduction. La comparaison vous aide à établir des liens entre les mots.',
      'Travaillez des différences essentielles à l’oral : apprendre ou enseigner, ouvrir ou s’ouvrir, développer ou se développer.',
      'Vérifiez si vous pouvez retrouver le sens vous-même, au-delà de la simple reconnaissance d’un mot familier.',
    ],
    exampleTitle: 'UNE RACINE, DES ACTIONS DIFFÉRENTES',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'apprendre' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'enseigner à quelqu’un' },
    ],
    exampleNote:
      'La racine ל-מ-ד est liée à l’apprentissage. Dans un cas, une personne apprend ; dans l’autre, elle enseigne à quelqu’un. Cette différence est essentielle pour s’exprimer avec précision.',
    howTitle: 'COMMENT S’EXERCER',
    steps: [
      'Observez le verbe, sa racine, son binyan et sa translittération.',
      'Choisissez sa traduction parmi 2, 3 ou 4 propositions de la même famille.',
      'Après votre réponse, comparez les verbes et les binyanim affichés avec toutes les traductions.',
      'Écoutez la prononciation si un enregistrement est disponible et si le son est activé.',
    ],
    tipTitle: 'POUR MIEUX PROFITER DE L’EXERCICE',
    tip:
      'Essayez de retrouver la traduction avant de lire les propositions. Après une erreur, comparez le verbe choisi au bon verbe et imaginez une courte phrase avec chacun. Épinglez les verbes difficiles pour les revoir plus souvent.',
    noteTitle: 'LE BINYAN DONNE UN INDICE',
    note:
      'Les binyanim permettent de repérer des régularités, mais ne constituent pas une formule de traduction. Le sens de chaque verbe doit être appris séparément. L’exercice retient un seul sens par verbe ; d’autres contextes peuvent en faire apparaître d’autres.',
    close: 'COMPRIS',
  },
  es: {
    title: 'FAMILIAS DE RAÍCES',
    lead: 'Una raíz. Distintos binyanim. Distintos significados.',
    intro:
      'Los verbos de la misma raíz se confunden fácilmente: las letras conocidas pueden hacerte creer que ya entiendes el significado. Este ejercicio te ayuda a notar las diferencias y elegir el verbo que expresa lo que quieres decir.',
    benefitTitle: 'POR QUÉ ES ÚTIL',
    benefits: [
      'Aprende a distinguir verbos parecidos. Todas las opciones pertenecen a una misma familia, así que debes fijarte en la forma y el significado.',
      'Relaciona la raíz, el binyan y la traducción. La comparación ayuda a establecer conexiones entre palabras.',
      'Practica diferencias importantes al hablar: aprender o enseñar, abrir o abrirse, desarrollar o desarrollarse.',
      'Comprueba si puedes recordar el significado por tu cuenta, además de reconocer una palabra conocida.',
    ],
    exampleTitle: 'UNA RAÍZ, ACCIONES DIFERENTES',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'aprender' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'enseñar a alguien' },
    ],
    exampleNote:
      'La raíz ל-מ-ד está relacionada con el aprendizaje. En un caso, una persona aprende; en el otro, enseña a alguien. Esta diferencia es esencial para expresarse con precisión.',
    howTitle: 'CÓMO PRACTICAR',
    steps: [
      'Observa el verbo, su raíz, su binyan y su transliteración.',
      'Elige su traducción entre 2, 3 o 4 opciones de la misma familia.',
      'Después de responder, compara los verbos y binyanim que aparecen junto a todas las traducciones.',
      'Escucha la pronunciación si hay una grabación disponible y el sonido está activado.',
    ],
    tipTitle: 'APROVECHA MEJOR LA PRÁCTICA',
    tip:
      'Intenta recordar la traducción antes de mirar las opciones. Después de un error, compara el verbo elegido con el correcto e inventa una frase corta con cada uno. Fija los verbos difíciles para verlos más a menudo.',
    noteTitle: 'EL BINYAN ES UNA PISTA',
    note:
      'Los binyanim ayudan a reconocer patrones, pero no son una fórmula de traducción. Hay que aprender el significado de cada verbo por separado. El ejercicio utiliza un significado por verbo; en otros contextos puede tener otros.',
    close: 'ENTENDIDO',
  },
  pt: {
    title: 'FAMÍLIAS DE RAÍZES',
    lead: 'Uma raiz. Diferentes binyanim. Diferentes significados.',
    intro:
      'É fácil confundir verbos da mesma raiz: letras familiares podem dar a sensação de que já conhece o significado. Este exercício ajuda a perceber as diferenças e a escolher o verbo que expressa o que pretende dizer.',
    benefitTitle: 'PORQUE É ÚTIL',
    benefits: [
      'Aprenda a distinguir verbos semelhantes. Todas as opções pertencem à mesma família, por isso é necessário observar a forma e o significado.',
      'Relacione a raiz, o binyan e a tradução. A comparação ajuda a criar ligações entre as palavras.',
      'Pratique diferenças importantes na fala: aprender ou ensinar, abrir ou abrir-se, desenvolver ou desenvolver-se.',
      'Verifique se consegue recordar o significado por si, além de reconhecer uma palavra familiar.',
    ],
    exampleTitle: 'UMA RAIZ, AÇÕES DIFERENTES',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'aprender' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'ensinar alguém' },
    ],
    exampleNote:
      'A raiz ל-מ-ד está ligada à aprendizagem. Num caso, uma pessoa aprende; no outro, ensina alguém. Esta diferença é essencial para se expressar com precisão.',
    howTitle: 'COMO PRATICAR',
    steps: [
      'Observe o verbo, a sua raiz, o binyan e a transliteração.',
      'Escolha a tradução entre 2, 3 ou 4 opções da mesma família.',
      'Depois de responder, compare os verbos e os binyanim apresentados junto de todas as traduções.',
      'Ouça a pronúncia se existir uma gravação e o som estiver ativado.',
    ],
    tipTitle: 'TIRE MAIS PROVEITO DA PRÁTICA',
    tip:
      'Tente recordar a tradução antes de olhar para as opções. Depois de um erro, compare o verbo escolhido com o correto e imagine uma frase curta com cada um. Fixe os verbos difíceis para os ver com mais frequência.',
    noteTitle: 'O BINYAN É UMA PISTA',
    note:
      'Os binyanim ajudam a reconhecer padrões, mas não são uma fórmula de tradução. É necessário aprender o significado de cada verbo individualmente. O exercício apresenta um significado por verbo; noutros contextos pode ter outros.',
    close: 'ENTENDIDO',
  },
  ar: {
    title: 'عائلات الجذور',
    lead: 'جذر واحد. أوزان مختلفة. معانٍ مختلفة.',
    intro:
      'يسهل الخلط بين الأفعال التي تشترك في الجذر نفسه، فالحروف المألوفة قد توحي بأن المعنى معروف بالفعل. يساعدك هذا التمرين على ملاحظة الفروق واختيار الفعل الذي يعبّر عما تقصده.',
    benefitTitle: 'لماذا هذا التمرين مفيد؟',
    benefits: [
      'تتعلّم التمييز بين الأفعال المتشابهة. جميع الخيارات من عائلة واحدة، لذا تحتاج إلى الانتباه إلى الصيغة والمعنى.',
      'تربط بين الجذر والوزن والترجمة، وتبني روابط بين الكلمات من خلال المقارنة.',
      'تتدرّب على فروق مهمة في الكلام، مثل أن تتعلّم أو تعلّم شخصًا آخر، وأن تفتح شيئًا أو ينفتح، وأن تطوّر شيئًا أو يتطوّر.',
      'تختبر قدرتك على تذكّر المعنى بنفسك، إلى جانب التعرّف على كلمة مألوفة.',
    ],
    exampleTitle: 'جذر واحد وأفعال مختلفة',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'أن تتعلّم' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'أن تعلّم شخصًا آخر' },
    ],
    exampleNote:
      'يرتبط الجذر ל-מ-ד بالتعلّم. في الحالة الأولى يتعلّم الشخص، وفي الثانية يعلّم شخصًا آخر. هذا الفرق أساسي للتعبير بدقة.',
    howTitle: 'كيف تتدرّب؟',
    steps: [
      'انظر إلى الفعل وجذره ووزنه وكتابته الصوتية.',
      'اختر ترجمته من خيارين أو ثلاثة أو أربعة من العائلة نفسها.',
      'بعد الإجابة، قارن الأفعال والأوزان التي تظهر بجانب جميع الترجمات.',
      'استمع إلى النطق إذا كان التسجيل متاحًا والصوت مفعّلًا.',
    ],
    tipTitle: 'للاستفادة أكثر من التدريب',
    tip:
      'حاول تذكّر الترجمة قبل النظر إلى الخيارات. بعد الخطأ، قارن الفعل الذي اخترته بالفعل الصحيح، وفكّر في جملة قصيرة لكل منهما. ثبّت الأفعال الصعبة لتظهر لك أكثر.',
    noteTitle: 'الوزن دليل على المعنى',
    note:
      'تساعد الأوزان على ملاحظة الأنماط، لكنها ليست قاعدة آلية للترجمة. يجب تعلّم معنى كل فعل على حدة. يستخدم التمرين معنى واحدًا لكل فعل، وقد تكون له معانٍ أخرى في سياقات مختلفة.',
    close: 'فهمت',
  },
  am: {
    title: 'የሥር ቤተሰቦች',
    lead: 'አንድ ሥር። የተለያዩ ቢንያኖች። የተለያዩ ትርጉሞች።',
    intro:
      'ተመሳሳይ ሥር ያላቸውን ግሶች መቀላቀል ቀላል ነው። የሚታወቁ ፊደላት ትርጉሙን አስቀድመው እንደሚያውቁ ሊያስመስሉ ይችላሉ። ይህ ልምምድ ልዩነቶቹን እንዲያስተውሉና ሐሳብዎን የሚገልጸውን ግስ እንዲመርጡ ይረዳል።',
    benefitTitle: 'ይህ ልምምድ ለምን ይጠቅማል?',
    benefits: [
      'ተመሳሳይ የሚመስሉ ግሶችን መለየት ይማራሉ። ሁሉም ምርጫዎች ከአንድ ቤተሰብ ስለሆኑ ለቅርጹና ለትርጉሙ ትኩረት መስጠት ያስፈልጋል።',
      'ሥሩን፣ ቢንያኑንና ትርጉሙን ያገናኛሉ። ግሶችን ማነጻጸር በቃላት መካከል ግንኙነት እንዲፈጥሩ ይረዳል።',
      'ለንግግር አስፈላጊ የሆኑ ልዩነቶችን ይለማመዳሉ፤ ለምሳሌ መማርና ማስተማር፣ መክፈትና መከፈት።',
      'የሚታወቅ ቃል ከመለየት በተጨማሪ ትርጉሙን በራስዎ ማስታወስ እንደሚችሉ ይፈትሻሉ።',
    ],
    exampleTitle: 'አንድ ሥር፣ የተለያዩ ድርጊቶች',
    examples: [
      { verb: 'ללמוד', bin: "PA'AL", translation: 'መማር' },
      { verb: 'ללמד', bin: "PI'EL", translation: 'ማስተማር' },
    ],
    exampleNote:
      'ל-מ-ד የሚለው ሥር ከትምህርት ጋር ይያያዛል። በአንዱ ሰውየው ይማራል፤ በሌላው ሌላ ሰው ያስተምራል። ሐሳብን በትክክል ለመግለጽ ይህ ልዩነት አስፈላጊ ነው።',
    howTitle: 'እንዴት ይለማመዱ?',
    steps: [
      'ግሱን፣ ሥሩን፣ ቢንያኑንና በላቲን ፊደላት የተጻፈውን አጠራር ይመልከቱ።',
      'ከተመሳሳይ ቤተሰብ ከቀረቡ 2፣ 3 ወይም 4 ምርጫዎች ትርጉሙን ይምረጡ።',
      'ከመለሱ በኋላ ከሁሉም ትርጉሞች ጋር የሚታዩትን ግሶችና ቢንያኖች ያነጻጽሩ።',
      'የድምፅ ቅጂ ካለና ድምፁ ከበራ አጠራሩን ያዳምጡ።',
    ],
    tipTitle: 'ከልምምዱ የበለጠ ለመጠቀም',
    tip:
      'ምርጫዎቹን ከማየትዎ በፊት ትርጉሙን ለማስታወስ ይሞክሩ። ከተሳሳቱ በኋላ የመረጡትን ግስ ከትክክለኛው ጋር ያነጻጽሩና በእያንዳንዱ አጭር ዓረፍተ ነገር ያስቡ። አስቸጋሪ ግሶችን ብዙ ጊዜ ለማየት ይሰኩ።',
    noteTitle: 'ቢንያን ለትርጉሙ ፍንጭ ይሰጣል',
    note:
      'ቢንያኖች ተደጋጋሚ ቅርጾችን ለማስተዋል ይረዳሉ፤ ነገር ግን ቀጥተኛ የትርጉም ቀመር አይደሉም። የእያንዳንዱን ግስ ትርጉም ለብቻው መማር ያስፈልጋል። በልምምዱ ለእያንዳንዱ ግስ አንድ ትርጉም ተመርጧል፤ በሌሎች አውዶች ሌሎች ትርጉሞች ሊኖሩት ይችላሉ።',
    close: 'ገባኝ',
  },
};

const RootVerbDescriptionModal = ({
  visible = false,
  language = 'en',
  onToggle,
  onClose,
}) => {
  const lang = normalizeRootLanguage(language);
  const text = CONTENT[lang];
  const isRtl = lang === 'ar';
  const close = onClose || onToggle;

  const paragraphStyle = [
    styles.paragraph,
    isRtl && styles.rtl,
  ];

  const renderSectionTitle = title => (
    <Text
      style={[styles.sectionTitle, isRtl && styles.rtl]}
      maxFontSizeMultiplier={1.2}
    >
      {title}
    </Text>
  );

  const renderList = (entries, numbered = false) =>
    entries.map((entry, index) => (
      <View
        key={index}
        style={[styles.listRow, isRtl && styles.listRowRtl]}
      >
        <View
          style={[
            styles.marker,
            !numbered && styles.benefitMarker,
          ]}
        >
          <Text style={styles.markerText}>
            {numbered ? index + 1 : '✓'}
          </Text>
        </View>

        <Text
          style={[
            styles.paragraph,
            styles.listText,
            isRtl && styles.rtl,
          ]}
          maxFontSizeMultiplier={1.2}
        >
          {entry}
        </Text>
      </View>
    ));

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal} accessibilityViewIsModal>
          <Text
            style={styles.title}
            maxFontSizeMultiplier={1.2}
          >
            {text.title}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <View style={styles.introBox}>
              <Text
                style={[styles.lead, isRtl && styles.rtl]}
                maxFontSizeMultiplier={1.2}
              >
                {text.lead}
              </Text>

              <Text
                style={paragraphStyle}
                maxFontSizeMultiplier={1.2}
              >
                {text.intro}
              </Text>
            </View>

            {renderSectionTitle(text.benefitTitle)}
            {renderList(text.benefits)}

            {renderSectionTitle(text.exampleTitle)}

            <View style={styles.exampleBox}>
              {text.examples.map((example, index) => (
                <View
                  key={example.verb}
                  style={[
                    styles.exampleRow,
                    index > 0 && styles.exampleRowBorder,
                  ]}
                >
                  <View style={styles.exampleMeta}>
                    <View
                      style={[
                        styles.binyanBadge,
                        index === 1 && styles.binyanBadgePink,
                      ]}
                    >
                      <Text
                        style={styles.binyanText}
                        maxFontSizeMultiplier={1.1}
                      >
                        {example.bin}
                      </Text>
                    </View>

                    <Text
                      style={styles.hebrew}
                      maxFontSizeMultiplier={1.2}
                    >
                      {example.verb}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.exampleTranslation,
                      isRtl && styles.rtl,
                    ]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {example.translation}
                  </Text>
                </View>
              ))}

              <Text
                style={[
                  styles.paragraph,
                  styles.exampleNote,
                  isRtl && styles.rtl,
                ]}
                maxFontSizeMultiplier={1.2}
              >
                {text.exampleNote}
              </Text>
            </View>

            {renderSectionTitle(text.howTitle)}
            {renderList(text.steps, true)}

            <View style={styles.tipBox}>
              {renderSectionTitle(text.tipTitle)}

              <Text
                style={paragraphStyle}
                maxFontSizeMultiplier={1.2}
              >
                {text.tip}
              </Text>
            </View>

            <View style={styles.noteBox}>
              {renderSectionTitle(text.noteTitle)}

              <Text
                style={paragraphStyle}
                maxFontSizeMultiplier={1.2}
              >
                {text.note}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            style={styles.closeButton}
            onPress={close}
          >
            <Text
              style={styles.closeText}
              maxFontSizeMultiplier={1.2}
            >
              {text.close}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFDEF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    color: '#2D4769',
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  introBox: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B8CCDF',
    backgroundColor: '#EAF0F8',
    marginBottom: 8,
  },
  lead: {
    color: '#2D4769',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '900',
    marginBottom: 10,
  },
  paragraph: {
    color: '#505A70',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'left',
  },
  sectionTitle: {
    color: '#A84F70',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  listRowRtl: {
    flexDirection: 'row-reverse',
  },
  listText: {
    flex: 1,
    minWidth: 0,
  },
  marker: {
    width: 28,
    minHeight: 28,
    borderRadius: 9,
    backgroundColor: '#E4EAF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitMarker: {
    backgroundColor: '#DDEFE5',
  },
  markerText: {
    color: '#2D4769',
    fontSize: 14,
    fontWeight: '900',
  },
  exampleBox: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#8FC9B4',
    backgroundColor: '#E8F2EE',
  },
  exampleRow: {
    paddingVertical: 8,
  },
  exampleRowBorder: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#A8C7B8',
  },
  exampleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  binyanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#DDECF9',
  },
  binyanBadgePink: {
    backgroundColor: '#F8E0EA',
  },
  binyanText: {
    color: '#2D4769',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    writingDirection: 'ltr',
  },
  hebrew: {
    color: '#333652',
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '900',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  exampleTranslation: {
    color: '#333652',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: 5,
  },
  exampleNote: {
    marginTop: 12,
  },
  tipBox: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderRadius: 17,
    backgroundColor: '#F9EBCF',
  },
  noteBox: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D5DDEA',
    backgroundColor: '#F7F9FC',
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  closeButton: {
    alignSelf: 'center',
    minWidth: '52%',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#CE6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFDEF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default RootVerbDescriptionModal;