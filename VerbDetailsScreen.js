import React,{useEffect,useMemo,useRef,useState}from'react';
import{BackHandler,Image,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View}from'react-native';
import{Audio}from'expo-av';

import verbs1 from'./verbs1.json';
import verbs11RU from'./verbs11RU.json';
import prepo2 from'./prepo2.json';
import vebimperRus from'./verbimperRus.json';
import vebimperArAm from'./verbimperArAm.json';

import sounds from'./Soundss';
import soundsConj from'./soundconj';
import prepositionSounds from'./preposition2Sounds';
import soundsimper from'./soundsimper';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const UI_TEXT={

ru:{
root:'КОРЕНЬ',
binyan:'БИНЬЯН',
sameRoot:'ГЛАГОЛЫ ЭТОГО КОРНЯ',
conjugations:'СПРЯЖЕНИЯ',
imperative:'ПОВЕЛИТЕЛЬНОЕ НАКЛОНЕНИЕ',
prepositionExamples:'ПРИМЕРЫ С ПРЕДЛОГАМИ',
preposition:'ПРЕДЛОГ',
prefixPreposition:'ПРЕДЛОГ-ПРИСТАВКА',
practice:'ГДЕ ТРЕНИРОВАТЬ',
practiceMain:'Упражнения 1, 2 и 3',
practiceConjugations:'Упражнения 5, 6, 7 и 8',
practiceImperative:'Упражнение 4',
practicePrepositions:'Упражнение «Предлоги 2»',
showAll:'ПОКАЗАТЬ ВСЕ',
collapse:'СВЕРНУТЬ',
back:'НАЗАД',
list:'СПИСОК',
next:'ВПЕРЁД',
close:'ЗАКРЫТЬ',
notFound:'Глагол не найден'
},

en:{
root:'ROOT',
binyan:'BINYAN',
sameRoot:'VERBS WITH THE SAME ROOT',
conjugations:'CONJUGATIONS',
imperative:'IMPERATIVE',
prepositionExamples:'EXAMPLES WITH PREPOSITIONS',
preposition:'PREPOSITION',
prefixPreposition:'PREFIXED PREPOSITION',
practice:'WHERE TO PRACTICE',
practiceMain:'Exercises 1, 2 and 3',
practiceConjugations:'Exercises 5, 6, 7 and 8',
practiceImperative:'Exercise 4',
practicePrepositions:'Exercise “Prepositions 2”',
showAll:'SHOW ALL',
collapse:'COLLAPSE',
back:'BACK',
list:'LIST',
next:'NEXT',
close:'CLOSE',
notFound:'Verb not found'
},

fr:{
root:'RACINE',
binyan:'BINYAN',
sameRoot:'VERBES DE LA MÊME RACINE',
conjugations:'CONJUGAISONS',
imperative:'IMPÉRATIF',
prepositionExamples:'EXEMPLES AVEC PRÉPOSITIONS',
preposition:'PRÉPOSITION',
prefixPreposition:'PRÉPOSITION-PRÉFIXE',
practice:'OÙ S’ENTRAÎNER',
practiceMain:'Exercices 1, 2 et 3',
practiceConjugations:'Exercices 5, 6, 7 et 8',
practiceImperative:'Exercice 4',
practicePrepositions:'Exercice « Prépositions 2 »',
showAll:'TOUT AFFICHER',
collapse:'RÉDUIRE',
back:'RETOUR',
list:'LISTE',
next:'SUIVANT',
close:'FERMER',
notFound:'Verbe introuvable'
},

es:{
root:'RAÍZ',
binyan:'BINYÁN',
sameRoot:'VERBOS DE LA MISMA RAÍZ',
conjugations:'CONJUGACIONES',
imperative:'IMPERATIVO',
prepositionExamples:'EJEMPLOS CON PREPOSICIONES',
preposition:'PREPOSICIÓN',
prefixPreposition:'PREPOSICIÓN-PREFIJO',
practice:'DÓNDE PRACTICAR',
practiceMain:'Ejercicios 1, 2 y 3',
practiceConjugations:'Ejercicios 5, 6, 7 y 8',
practiceImperative:'Ejercicio 4',
practicePrepositions:'Ejercicio «Preposiciones 2»',
showAll:'MOSTRAR TODO',
collapse:'OCULTAR',
back:'ATRÁS',
list:'LISTA',
next:'SIGUIENTE',
close:'CERRAR',
notFound:'Verbo no encontrado'
},

pt:{
root:'RAIZ',
binyan:'BINYAN',
sameRoot:'VERBOS DA MESMA RAIZ',
conjugations:'CONJUGAÇÕES',
imperative:'IMPERATIVO',
prepositionExamples:'EXEMPLOS COM PREPOSIÇÕES',
preposition:'PREPOSIÇÃO',
prefixPreposition:'PREPOSIÇÃO-PREFIXO',
practice:'ONDE PRATICAR',
practiceMain:'Exercícios 1, 2 e 3',
practiceConjugations:'Exercícios 5, 6, 7 e 8',
practiceImperative:'Exercício 4',
practicePrepositions:'Exercício «Preposições 2»',
showAll:'MOSTRAR TUDO',
collapse:'RECOLHER',
back:'VOLTAR',
list:'LISTA',
next:'SEGUINTE',
close:'FECHAR',
notFound:'Verbo não encontrado'
},

ar:{
root:'الجذر',
binyan:'البنيان',
sameRoot:'أفعال من الجذر نفسه',
conjugations:'التصريفات',
imperative:'صيغة الأمر',
prepositionExamples:'أمثلة مع حروف الجر',
preposition:'حرف جر',
prefixPreposition:'حرف جر متصل',
practice:'أين تتدرّب',
practiceMain:'التمارين 1 و2 و3',
practiceConjugations:'التمارين 5 و6 و7 و8',
practiceImperative:'التمرين 4',
practicePrepositions:'تمرين «حروف الجر 2»',
showAll:'عرض الكل',
collapse:'طي',
back:'رجوع',
list:'القائمة',
next:'التالي',
close:'إغلاق',
notFound:'لم يتم العثور على الفعل'
},

am:{
root:'ሥር',
binyan:'ቢንያን',
sameRoot:'ተመሳሳይ ሥር ያላቸው ግሶች',
conjugations:'የግስ ለውጦች',
imperative:'የትእዛዝ አይነት',
prepositionExamples:'ከመስተዋድድ ጋር ምሳሌዎች',
preposition:'መስተዋድድ',
prefixPreposition:'ቅድመ-ቅጥያ መስተዋድድ',
practice:'የሚለማመዱበት',
practiceMain:'ልምምዶች 1፣ 2 እና 3',
practiceConjugations:'ልምምዶች 5፣ 6፣ 7 እና 8',
practiceImperative:'ልምምድ 4',
practicePrepositions:'ልምምድ «መስተዋድድ 2»',
showAll:'ሁሉንም አሳይ',
collapse:'ሰብስብ',
back:'ተመለስ',
list:'ዝርዝር',
next:'ቀጣይ',
close:'ዝጋ',
notFound:'ግሱ አልተገኘም'
}

};

const VERB_MEANINGS={

'להזמין':[
{translation:'Заказывать',match:/заказ|закаж|заказыва/i},
{translation:'Приглашать',match:/приглаш|приглас/i}
],

'לקרוא':[
{translation:'Читать',match:/чит|прочит/i},
{translation:'Звать',match:/зов|звал|звала|звали|зовё|зове|позов|позвал|позвала|позвали|зови|зовите/i}
],

'להתקשר':[
{translation:'Звонить',match:/звон|позвон/i},
{translation:'Связываться',match:/связыв|связат|свяж/i}
],

'להתרחץ':[
{translation:'Купаться',match:/купа|искупа/i},
{translation:'Мыться',match:/моюсь|моешь|моет|моемся|моетесь|моются|мыл|мыла|мыли|мыться|помы|вымо/i}
],

'להפוך':[
{translation:'Становиться',match:/станов|стану|станет|станут|стал|стала|стали/i},
{translation:'Превращаться',match:/превращ|преврат/i}
],

'לשלוח':[
{translation:'Посылать',match:/посыл|пошл/i},
{translation:'Отправлять',match:/отправ|отошл/i}
]

};

const getCorrectTranslation=(verb,lang='ru')=>{

if(!verb)return'';

let options=[];

switch(lang){

case'ru':
options=
verb.translationOptions||[];
break;

case'en':
options=
verb.translationOptionsEn||[];
break;

case'fr':
options=
verb.translationOptionsFr||[];
break;

case'es':
options=
verb.translationOptionsEs||[];
break;

case'pt':
options=
verb.translationOptionsPt||[];
break;

case'ar':
options=
verb.translationOptionsAr||[];
break;

case'am':
options=
verb.translationOptionsAm||[];
break;

default:
options=
verb.translationOptions||[];

}

const index=
Number.isInteger(
verb.correctTranslationIndex
)
?verb.correctTranslationIndex
:0;

return(
options[index]||
options[0]||
''
);

};

const filterByMeaning=(
items,
currentVerb,
getText
)=>{

if(
!Array.isArray(items)||
!currentVerb
)return[];

const rules=
VERB_MEANINGS[
currentVerb.hebrewVerb
];

if(!rules)
return items;

const currentMeaning=
getCorrectTranslation(
currentVerb,
'ru'
)
.trim()
.toLowerCase();

const rule=
rules.find(
item=>
String(
item.translation||''
)
.trim()
.toLowerCase()===
currentMeaning
);

if(!rule)
return items;

return items.filter(
item=>
rule.match.test(
String(
getText(item)||''
)
)
);

};

const getConjugationTranslation=(
item,
lang='ru'
)=>{

switch(lang){

case'ru':
return item.russiantext||'';

case'en':
return item.engtext||
item.entext||
'';

case'fr':
return item.frtext||'';

case'es':
return item.estext||'';

case'pt':
return item.pttext||'';

case'ar':
return item.artext||'';

case'am':
return item.amtext||'';

default:
return item.russiantext||'';

}

};

const getExampleTranslation=(
item,
lang='ru'
)=>{

switch(lang){

case'ru':
return item.russian||'';

case'en':
return item.english||'';

case'fr':
return item.french||'';

case'es':
return item.spanish||'';

case'pt':
return item.portuguese||'';

case'ar':
return item.arabic||'';

case'am':
return item.amharic||'';

default:
return item.russian||'';

}

};

const getImperativeTranslation=(
item,
lang='ru'
)=>{

switch(lang){

case'ru':
return item.Imper||'';

case'en':
return item.ImperEn||'';

case'fr':
return item.ImperFr||'';

case'es':
return item.ImperEs||'';

case'pt':
return item.ImperPt||'';

case'ar':
return item.ImperAr||'';

case'am':
return item.ImperAm||'';

default:
return item.Imper||'';

}

};

const getImperativeHebrew=item=>{

const index=
Number(
item?.correctTranslationIndex
)||0;

return(
item?.translationOptions?.[
index
]||''
);

};

const getImperativeTranslit=item=>{

const index=
Number(
item?.correctTranslationIndex
)||0;

return(
item?.mp4?.[
index
]||''
);

};

const getGenderIcon=gender=>{

switch(
String(
gender||''
).toLowerCase()
){

case'man':
return require('./man1.png');

case'woman':
return require('./woman1.png');

case'men':
return require('./men1.png');

case'women':
return require('./women1.png');

default:
return null;

}

};

const getTranslationFontSize=text=>{

const length=
String(
text||''
)
.trim()
.length;

if(length>22)return 13;
if(length>16)return 14;

return 16;

};

const renderHighlightedHebrew=item=>{

const full=
String(
item?.hebrewFull||''
).trim();

const before=
String(
item?.before||''
).trim();

const after=
String(
item?.after||''
).trim();

const preposition=
String(
item?.correct||
item?.preposition||
''
).trim();

const answer=
String(
item?.answer||''
).trim();

if(!full){

return(

<Text style={styles.exampleHebrew}>
{before}{' '}
<Text style={styles.highlightedPreposition}>
{preposition}
</Text>
{item?.prepositionType==='separate'?' ':''}
{after}
</Text>

);

}

if(
item?.prepositionType===
'prefix'
){

if(
answer&&
preposition
){

const answerIndex=
full.indexOf(
answer
);

if(answerIndex!==-1){

const beforeAnswer=
full.slice(
0,
answerIndex
);

const afterAnswer=
full.slice(
answerIndex+
answer.length
);

let answerRest=
answer;

if(
answer.startsWith(
preposition
)
){

answerRest=
answer.slice(
preposition.length
);

}

return(

<Text style={styles.exampleHebrew}>
{beforeAnswer}
<Text style={styles.highlightedPreposition}>
{preposition}
</Text>
{answerRest}
{afterAnswer}
</Text>

);

}

}

if(
before&&
after&&
preposition
){

const target=
`${preposition}${after}`;

const targetIndex=
full.indexOf(
target
);

if(targetIndex!==-1){

return(

<Text style={styles.exampleHebrew}>
{full.slice(
0,
targetIndex
)}
<Text style={styles.highlightedPreposition}>
{preposition}
</Text>
{full.slice(
targetIndex+
preposition.length
)}
</Text>

);

}

}

return(

<Text style={styles.exampleHebrew}>
{full}
</Text>

);

}

if(
item?.prepositionType===
'separate'&&
preposition
){

const searchFrom=
before
?full.indexOf(before)+
before.length
:0;

const rest=
full.slice(
Math.max(
0,
searchFrom
)
);

const regex=
new RegExp(
`(^|\\s)${
preposition.replace(
/[.*+?^${}()|[\]\\]/g,
'\\$&'
)
}(?=\\s|$)`
);

const match=
rest.match(
regex
);

if(match){

const relativeIndex=
match.index+
(
match[1]?.length||
0
);

const index=
Math.max(
0,
searchFrom
)+
relativeIndex;

return(

<Text style={styles.exampleHebrew}>
{full.slice(
0,
index
)}
<Text style={styles.highlightedPreposition}>
{preposition}
</Text>
{full.slice(
index+
preposition.length
)}
</Text>

);

}

}

return(

<Text style={styles.exampleHebrew}>
{full}
</Text>

);

};

const PracticeInfo=({
label,
children
})=>(

<View style={styles.practiceInfo}>

<Text style={styles.practiceInfoLabel}>
{label}
</Text>

<Text style={styles.practiceInfoText}>
{children}
</Text>

</View>

);

const SpeakerButton=({
onPress,
size='normal'
})=>(

<Pressable
accessibilityRole="button"
hitSlop={8}
onPress={onPress}
style={({pressed})=>[
styles.speakerButton,

size==='small'&&
styles.speakerButtonSmall,

pressed&&
styles.speakerPressed
]}
>

<Image
source={require('./speaker4.png')}
resizeMode="contain"
style={[
styles.speakerImage,

size==='small'&&
styles.speakerImageSmall
]}
/>

</Pressable>

);

const VerbDetailsScreen=({
navigation,
route
})=>{

const soundRef=
useRef(null);

const[
conjugationsExpanded,
setConjugationsExpanded
]=useState(false);

const currentIndexRaw=
route?.params?.index??0;

const currentIndex=
Math.max(
0,
Math.min(
Number(
currentIndexRaw
)||0,
verbs1.length-1
)
);

const language=
route?.params?.language||
'ru';

const verbDetailsLoggedRef=useRef(false);

useEffect(()=>{
if(verbDetailsLoggedRef.current)return;

verbDetailsLoggedRef.current=true;

const eventName=`verbdetails${language}`;

FirebaseAnalytics.logFirebaseEvent(eventName,{
screen:eventName
});

return()=>{
verbDetailsLoggedRef.current=false;
};
},[]);

const ui=
UI_TEXT[language]||
UI_TEXT.ru;

/* НОВОЕ */
const openedFromExercise=
route?.params?.
openedFromExercise===
true;

const currentVerb=
verbs1[
currentIndex
];

const translation=
getCorrectTranslation(
currentVerb,
language
);

const relatedVerbs=
useMemo(()=>{

if(
!currentVerb?.root
)
return[];

return verbs1
.map(
(verb,index)=>({
verb,
index
})
)
.filter(
item=>
item.verb?.root===
currentVerb.root
);

},[
currentVerb
]);

const conjugations=
useMemo(()=>{

if(
!currentVerb?.hebrewVerb
)
return[];

const matched=
verbs11RU.filter(
item=>
item?.infinitive===
currentVerb.hebrewVerb
);

return filterByMeaning(
matched,
currentVerb,
item=>item.russiantext
);

},[
currentVerb
]);

const prepositionExamples=
useMemo(()=>{

if(
!currentVerb?.hebrewVerb
)
return[];

const matched=
prepo2.filter(
item=>
item?.verb===
currentVerb.hebrewVerb
);

return filterByMeaning(
matched,
currentVerb,
item=>item.russian
);

},[
currentVerb
]);

const imperativeSource=
language==='ar'||
language==='am'
?vebimperArAm
:vebimperRus;

const imperatives=
useMemo(()=>{

if(
!currentVerb?.hebrewVerb
)
return[];

const matched=
imperativeSource.filter(
item=>
item?.hebrewVerb===
currentVerb.hebrewVerb
);

return filterByMeaning(
matched,
currentVerb,
item=>item.Imper
);

},[
currentVerb,
imperativeSource
]);

const displayImperatives=
useMemo(()=>{

if(
!imperatives.length
)
return[];

const hasExplicitWomen=
imperatives.some(
item=>
String(
item.gender||''
).toLowerCase()===
'women'
);

const result=[];

imperatives.forEach(
item=>{

if(
String(
item.gender||''
).toLowerCase()===
'people'
){

result.push({
...item,
displayGender:'men',
displayKey:'people-men'
});

if(
!hasExplicitWomen
){

result.push({
...item,
displayGender:'women',
displayKey:'people-women'
});

}

}else{

result.push({
...item,

displayGender:
String(
item.gender||''
).toLowerCase(),

displayKey:
String(
item.gender||''
).toLowerCase()
});

}

}
);

return result;

},[
imperatives
]);

const hasFullConjugation=
conjugations.length===24||
conjugations.length===36;

const hasOtherContent=
relatedVerbs.length>1||
displayImperatives.length>0||
prepositionExamples.length>0;

const shouldCollapseConjugations=
hasFullConjugation&&
hasOtherContent;

const visibleConjugations=
shouldCollapseConjugations&&
!conjugationsExpanded
?conjugations.slice(0,2)
:conjugations;

const previousIndex=
currentIndex>0
?currentIndex-1
:verbs1.length-1;

const nextIndex=
currentIndex<
verbs1.length-1
?currentIndex+1
:0;

useEffect(()=>{

setConjugationsExpanded(
false
);

},[
currentIndex
]);

useEffect(()=>{

const backAction=()=>{

navigation.goBack();

return true;

};

const subscription=
BackHandler.addEventListener(
'hardwareBackPress',
backAction
);

return()=>{
subscription.remove();
};

},[
navigation
]);

useEffect(()=>{

return()=>{

if(
soundRef.current
){

soundRef.current
.unloadAsync()
.catch(()=>{});

soundRef.current=
null;

}

};

},[]);

const playSound=
async source=>{

if(!source)
return;

try{

if(
soundRef.current
){

try{

await soundRef.current
.unloadAsync();

}catch{}

soundRef.current=
null;

}

const{sound}=
await Audio.Sound
.createAsync(
source,
{
shouldPlay:true
}
);

soundRef.current=
sound;

sound.setOnPlaybackStatusUpdate(
status=>{

if(
status?.didJustFinish
){

sound
.unloadAsync()
.catch(()=>{});

if(
soundRef.current===
sound
){

soundRef.current=
null;

}

}

}
);

}catch(error){

console.log(
'Audio error:',
error
);

}

};

const playInfinitive=()=>{

if(
!currentVerb?.audioFile
)
return;

const key=
currentVerb.audioFile
.replace(
'.mp3',
''
);

playSound(
sounds?.[
key
]
);

};

const playConjugation=item=>{

if(
!item?.mp3
)
return;

playSound(
soundsConj?.[
item.mp3
]
);

};

const playImperative=item=>{

if(
!item?.mp3
)
return;

playSound(
soundsimper?.[
item.mp3
]
);

};

const playExample=item=>{

if(
!item?.mp3
)
return;

playSound(
prepositionSounds?.[
item.mp3
]
);

};

const goToIndex=index=>{

navigation.setParams({
index,
language
});

};

if(!currentVerb){

return(

<SafeAreaView style={styles.screen}>

<View style={styles.emptyState}>

<Text style={styles.emptyText}>
{ui.notFound}
</Text>

</View>

</SafeAreaView>

);

}

return(

<SafeAreaView style={styles.screen}>

<ScrollView
style={styles.scroll}
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
>

{/* ОСНОВНАЯ КАРТОЧКА */}

<View style={styles.mainCard}>

<View style={styles.mainVerbRow}>

<View style={styles.speakerSpacer}/>

<View style={styles.mainVerbText}>

<Text style={styles.hebrewVerb}>
{currentVerb.hebrewVerb}
</Text>

{!!currentVerb.transliteration&&(

<Text style={styles.transliteration}>
{currentVerb.transliteration}
</Text>

)}

</View>

<SpeakerButton
onPress={
playInfinitive
}
/>

</View>

{!!translation&&(

<View style={styles.translationBadge}>

<Text
numberOfLines={2}
maxFontSizeMultiplier={1}
style={styles.translation}
>
{translation}
</Text>

</View>

)}

<View style={styles.metaRow}>

<View style={styles.metaBox}>

<Text style={styles.metaLabel}>
{ui.root}
</Text>

<Text style={styles.rootText}>
{currentVerb.root||'—'}
</Text>

</View>

<View style={styles.metaBox}>

<Text style={styles.metaLabel}>
{ui.binyan}
</Text>

<Text style={styles.binyanText}>
{currentVerb.binyan||'—'}
</Text>

</View>

</View>

<PracticeInfo
label={ui.practice}
>
{ui.practiceMain}
</PracticeInfo>

</View>

{/* ОДНОКОРЕННЫЕ */}

{relatedVerbs.length>1&&(

<View
style={[
styles.sectionCard,
styles.relatedSection
]}
>

<Text style={styles.sectionTitle}>
{ui.sameRoot}
</Text>

<View style={styles.relatedList}>

{relatedVerbs.map(
item=>{

const isCurrent=
item.index===
currentIndex;

const relatedTranslation=
getCorrectTranslation(
item.verb,
language
);

return(

<Pressable
key={
`${item.verb.hebrewVerb}-${item.index}`
}
onPress={()=>
goToIndex(
item.index
)
}
style={({pressed})=>[
styles.relatedButton,

isCurrent&&
styles.relatedButtonCurrent,

pressed&&
styles.buttonPressed
]}
>

<View style={styles.relatedLeft}>

<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.65}
style={[
styles.relatedTranslation,

isCurrent&&
styles.relatedTranslationCurrent
]}
>
{relatedTranslation}
</Text>

</View>

<View style={styles.relatedRight}>

<Text
style={[
styles.relatedHebrew,

isCurrent&&
styles.relatedHebrewCurrent
]}
>
{item.verb.hebrewVerb}
</Text>

<Text
style={[
styles.relatedBinyan,

isCurrent&&
styles.relatedBinyanCurrent
]}
>
{item.verb.binyan||''}
</Text>

</View>

</Pressable>

);

}
)}

</View>

</View>

)}

{/* СПРЯЖЕНИЯ */}

{conjugations.length>0&&(

<View
style={[
styles.sectionCard,
styles.conjugationSection
]}
>

<View style={styles.sectionHeaderRow}>

<Text style={styles.sectionTitleNoMargin}>
{ui.conjugations}
</Text>

<View style={styles.countBadge}>

<Text style={styles.countBadgeText}>
{conjugations.length}
</Text>

</View>

</View>

<View style={styles.conjugationList}>

{visibleConjugations.map(
(item,index)=>{

const formTranslation=
getConjugationTranslation(
item,
language
);

const genderIcon=
getGenderIcon(
item.gender
);

const translationFontSize=
getTranslationFontSize(
formTranslation
);

return(

<View
key={
`${item.mp3||item.hebrewtext||'form'}-${index}`
}
style={styles.conjugationRow}
>

<View style={styles.conjugationLeft}>

{!!genderIcon&&(

<Image
source={genderIcon}
resizeMode="contain"
style={styles.genderIcon}
/>

)}

{!!formTranslation&&(

<Text
numberOfLines={2}
// adjustsFontSizeToFit
// minimumFontScale={0.82}
maxFontSizeMultiplier={1}
style={[
styles.conjugationTranslation,
{
fontSize:
translationFontSize
}
]}
>
{formTranslation}
</Text>

)}

</View>

<View style={styles.conjugationRight}>

<View style={styles.formTextBlock}>

<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.65}
style={styles.conjugationHebrew}
>
{item.hebrewtext||''}
</Text>

{!!item.translit&&(

<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.65}
style={styles.conjugationTranslit}
>
{item.translit}
</Text>

)}

</View>

<SpeakerButton
size="small"
onPress={()=>
playConjugation(
item
)
}
/>

</View>

</View>

);

}
)}

{shouldCollapseConjugations&&(

<Pressable
onPress={()=>
setConjugationsExpanded(
prev=>!prev
)
}
style={({pressed})=>[
styles.conjugationToggle,

pressed&&
styles.buttonPressed
]}
>

<Text style={styles.conjugationToggleText}>
{conjugationsExpanded
?ui.collapse
:`${ui.showAll} (${conjugations.length})`}
</Text>

</Pressable>

)}

</View>

<PracticeInfo
label={ui.practice}
>
{ui.practiceConjugations}
</PracticeInfo>

</View>

)}

{/* ПОВЕЛИТЕЛЬНОЕ */}

{displayImperatives.length>0&&(

<View
style={[
styles.sectionCard,
styles.imperativeSection
]}
>

<View style={styles.sectionHeaderRow}>

<Text style={styles.sectionTitleNoMargin}>
{ui.imperative}
</Text>

<View style={styles.countBadge}>

<Text style={styles.countBadgeText}>
{displayImperatives.length}
</Text>

</View>

</View>

<View style={styles.imperativeList}>

{displayImperatives.map(
(item,index)=>{

const imperativeTranslation=
getImperativeTranslation(
item,
language
);

const imperativeHebrew=
getImperativeHebrew(
item
);

const imperativeTranslit=
getImperativeTranslit(
item
);

const genderIcon=
getGenderIcon(
item.displayGender
);

const translationFontSize=
getTranslationFontSize(
imperativeTranslation
);

return(

<View
key={
`${item.mp3||imperativeHebrew||'imperative'}-${item.displayKey}-${index}`
}
style={styles.imperativeRow}
>

<View style={styles.imperativeLeft}>

{!!genderIcon&&(

<Image
source={genderIcon}
resizeMode="contain"
style={styles.imperativeGenderIcon}
/>

)}

{!!imperativeTranslation&&(

<Text
numberOfLines={2}
adjustsFontSizeToFit
minimumFontScale={0.55}
maxFontSizeMultiplier={1}
style={[
styles.imperativeTranslation,
{
fontSize:
translationFontSize
}
]}
>
{imperativeTranslation}
</Text>

)}

</View>

<View style={styles.imperativeRight}>

<View style={styles.imperativeTextBlock}>

<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.7}
style={styles.imperativeHebrew}
>
{imperativeHebrew}
</Text>

{!!imperativeTranslit&&(

<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.7}
style={styles.imperativeTranslit}
>
{imperativeTranslit}
</Text>

)}

</View>

<SpeakerButton
size="small"
onPress={()=>
playImperative(
item
)
}
/>

</View>

</View>

);

}
)}

</View>

<PracticeInfo
label={ui.practice}
>
{ui.practiceImperative}
</PracticeInfo>

</View>

)}

{/* ПРЕДЛОГИ */}

{prepositionExamples.length>0&&(

<View
style={[
styles.sectionCard,
styles.prepositionSection
]}
>

<View style={styles.sectionHeaderRow}>

<Text style={styles.sectionTitleNoMargin}>
{ui.prepositionExamples}
</Text>

<View style={styles.countBadge}>

<Text style={styles.countBadgeText}>
{prepositionExamples.length}
</Text>

</View>

</View>

<View style={styles.examplesList}>

{prepositionExamples.map(
(item,index)=>{

const exampleTranslation=
getExampleTranslation(
item,
language
);

return(

<View
key={
`${item.mp3||item.hebrewFull||'example'}-${index}`
}
style={styles.exampleCard}
>

<View style={styles.exampleTopRow}>

<View style={styles.prepositionBadge}>

<Text style={styles.prepositionText}>
{item.preposition||
item.correct||
''}
</Text>

</View>

{!!item.prepositionType&&(

<Text
numberOfLines={1}
style={styles.prepositionType}
>
{item.prepositionType==='prefix'
?ui.prefixPreposition
:ui.preposition}
</Text>

)}

<SpeakerButton
size="small"
onPress={()=>
playExample(
item
)
}
/>

</View>

<View style={styles.exampleTextBlock}>

{renderHighlightedHebrew(
item
)}

{!!item.translit&&(

<Text style={styles.exampleTranslit}>
{item.translit}
</Text>

)}

</View>

{!!exampleTranslation&&(

<View style={styles.exampleTranslationBox}>

<Text style={styles.exampleTranslation}>
{exampleTranslation}
</Text>

</View>

)}

</View>

);

}
)}

</View>

<PracticeInfo
label={ui.practice}
>
{ui.practicePrepositions}
</PracticeInfo>

</View>

)}

</ScrollView>

{/* НИЖНЯЯ ПАНЕЛЬ */}

<View style={styles.bottomBar}>

{openedFromExercise?(

<Pressable
onPress={()=>
navigation.goBack()
}
style={({pressed})=>[
styles.closeButton,

pressed&&
styles.buttonPressed
]}
>

<Text style={styles.closeButtonText}>
{ui.close}
</Text>

</Pressable>

):(

<>

<Pressable
onPress={()=>
goToIndex(
previousIndex
)
}
style={({pressed})=>[
styles.navButton,

pressed&&
styles.buttonPressed
]}
>

<Text style={styles.navText}>
{ui.back}
</Text>

</Pressable>

<Pressable
onPress={()=>
navigation.goBack()
}
style={({pressed})=>[
styles.listButton,

pressed&&
styles.buttonPressed
]}
>

<Text style={styles.listButtonText}>
{ui.list}
</Text>

</Pressable>

<Pressable
onPress={()=>
goToIndex(
nextIndex
)
}
style={({pressed})=>[
styles.navButton,

pressed&&
styles.buttonPressed
]}
>

<Text style={styles.navText}>
{ui.next}
</Text>

</Pressable>

</>

)}

</View>

</SafeAreaView>

);

};

const styles=StyleSheet.create({

screen:{
flex:1,
backgroundColor:'#83A3CD'
},

scroll:{
flex:1
},

scrollContent:{
paddingHorizontal:16,
paddingTop:12,
paddingBottom:18
},

mainCard:{
backgroundColor:'#FFFDEF',
borderRadius:22,
paddingHorizontal:16,
paddingVertical:18,
alignItems:'center',
shadowColor:'#000',
shadowOpacity:.15,
shadowRadius:10,
shadowOffset:{
width:0,
height:4
},
elevation:5
},

mainVerbRow:{
width:'100%',
flexDirection:'row',
alignItems:'center',
justifyContent:'center'
},

mainVerbText:{
flex:1,
alignItems:'center'
},

speakerSpacer:{
width:38
},

hebrewVerb:{
color:'#2D4769',
fontSize:42,
lineHeight:46,
fontWeight:'800',
textAlign:'center',
writingDirection:'rtl'
},

transliteration:{
marginTop:2,
color:'#CE6857',
fontSize:19,
lineHeight:25,
fontWeight:'800',
textAlign:'center'
},

translationBadge:{
marginTop:14,
width:'78%',
maxWidth:'94%',
minHeight:48,
backgroundColor:'#F8E7ED',
borderWidth:1,
borderColor:'#E9C7D4',
borderRadius:15,
paddingHorizontal:14,
paddingVertical:9,
alignItems:'center',
justifyContent:'center'
},

translation:{
width:'100%',
color:'#9F3F64',
fontSize:20,
lineHeight:25,
fontWeight:'900',
textAlign:'center',
includeFontPadding:false
},

metaRow:{
width:'100%',
flexDirection:'row',
gap:10,
marginTop:18
},

metaBox:{
flex:1,
minHeight:70,
borderRadius:15,
backgroundColor:'#E8EEF7',
borderWidth:1,
borderColor:'#C4D0E2',
alignItems:'center',
justifyContent:'center',
paddingHorizontal:8,
paddingVertical:8
},

metaLabel:{
color:'#73788F',
fontSize:10,
lineHeight:14,
fontWeight:'900',
letterSpacing:.6
},

rootText:{
marginTop:-2,
width:'100%',
color:'#5c0101',
fontSize:28,
lineHeight:30,
fontWeight:'800',
textAlign:'center',
writingDirection:'ltr',
includeFontPadding:false
},

binyanText:{
marginTop:4,
color:'#CE6857',
fontSize:22,
lineHeight:24,
fontWeight:'900',
textAlign:'center'
},

sectionCard:{
marginTop:12,
borderRadius:22,
paddingHorizontal:14,
paddingTop:14,
paddingBottom:14,
shadowColor:'#000',
shadowOpacity:.12,
shadowRadius:7,
shadowOffset:{
width:0,
height:3
},
elevation:4
},

relatedSection:{
backgroundColor:'#FFF1E3'
},

conjugationSection:{
backgroundColor:'#EAF2FB'
},

imperativeSection:{
backgroundColor:'#F6EAF2'
},

prepositionSection:{
backgroundColor:'#EAF5E8'
},

sectionTitle:{
color:'#333652',
fontSize:15,
lineHeight:20,
fontWeight:'900',
textAlign:'center',
marginBottom:10
},

sectionHeaderRow:{
minHeight:30,
flexDirection:'row',
alignItems:'center',
justifyContent:'center',
marginBottom:10
},

sectionTitleNoMargin:{
color:'#333652',
fontSize:13,
lineHeight:21,
fontWeight:'900',
textAlign:'center',
includeFontPadding:false
},

countBadge:{
minWidth:33,
height:29,
marginLeft:9,
borderRadius:10,
backgroundColor:'#FFFDEF',
borderWidth:1,
borderColor:'rgba(51,54,82,0.12)',
alignItems:'center',
justifyContent:'center',
paddingHorizontal:7
},

countBadgeText:{
color:'#333652',
fontSize:15,
lineHeight:18,
fontWeight:'900',
textAlign:'center',
includeFontPadding:false
},

speakerButton:{
width:38,
height:38,
alignItems:'center',
justifyContent:'center'
},

speakerButtonSmall:{
width:28,
height:28
},

speakerImage:{
width:28,
height:28
},

speakerImageSmall:{
width:19,
height:19
},

speakerPressed:{
opacity:.55,
transform:[
{scale:.92}
]
},

relatedList:{
gap:7
},

relatedButton:{
minHeight:64,
flexDirection:'row',
alignItems:'center',
backgroundColor:'#FFFFFF',
borderRadius:15,
borderWidth:2,
borderColor:'#D7DCE6',
paddingHorizontal:12,
paddingVertical:8
},

relatedButtonCurrent:{
backgroundColor:'#F8E7ED',
borderColor:'#CE6857'
},

relatedLeft:{
flex:1,
paddingRight:10
},

relatedRight:{
flex:1,
alignItems:'flex-end'
},

relatedTranslation:{
color:'#333652',
fontSize:14,
lineHeight:18,
fontWeight:'800',
textAlign:'left'
},

relatedTranslationCurrent:{
color:'#9F3F64'
},

relatedHebrew:{
color:'#2D4769',
fontSize:21,
lineHeight:27,
fontWeight:'900',
textAlign:'right',
writingDirection:'rtl'
},

relatedHebrewCurrent:{
color:'#9F3F64'
},

relatedBinyan:{
marginTop:1,
color:'#73788F',
fontSize:11,
lineHeight:15,
fontWeight:'800'
},

relatedBinyanCurrent:{
color:'#CE6857'
},

conjugationList:{
gap:5
},

conjugationRow:{
minHeight:58,
flexDirection:'row',
alignItems:'center',
backgroundColor:'#FFFFFF',
borderRadius:12,
borderWidth:1,
borderColor:'#D7DCE6',
paddingHorizontal:9,
paddingVertical:6
},

conjugationLeft:{
flex:1.2,
flexDirection:'row',
alignItems:'center',
paddingRight:6,
minWidth:0
},

genderIcon:{
width:30,
height:30,
marginRight:8,
flexShrink:0
},

conjugationTranslation:{
flex:1,
flexShrink:1,
color:'#9F3F64',
fontSize:15,
lineHeight:19,
fontWeight:'800',
textAlign:'left'
},

conjugationRight:{
flex:1.25,
flexDirection:'row',
alignItems:'center',
justifyContent:'flex-end',
minWidth:0
},

formTextBlock:{
flex:1,
alignItems:'flex-end',
paddingRight:6,
minWidth:0
},

conjugationHebrew:{
color:'#2D4769',
fontSize:17,
lineHeight:23,
fontWeight:'900',
textAlign:'right',
writingDirection:'rtl'
},

conjugationTranslit:{
marginTop:1,
color:'#CE6857',
fontSize:13,
lineHeight:16,
fontWeight:'800',
textAlign:'right'
},

conjugationToggle:{
height:42,
marginTop:3,
borderRadius:12,
backgroundColor:'#FFFFFF',
borderWidth:1,
borderColor:'#D7DCE6',
alignItems:'center',
justifyContent:'center'
},

conjugationToggleText:{
color:'#333652',
fontSize:12,
fontWeight:'900',
textAlign:'center'
},

imperativeList:{
gap:5
},

imperativeRow:{
minHeight:58,
flexDirection:'row',
alignItems:'center',
backgroundColor:'#FFFFFF',
borderRadius:12,
borderWidth:1,
borderColor:'#D7DCE6',
paddingHorizontal:9,
paddingVertical:6
},

imperativeLeft:{
flex:1.08,
flexDirection:'row',
alignItems:'center',
paddingRight:8,
minWidth:0
},

imperativeGenderIcon:{
width:30,
height:30,
marginRight:8,
flexShrink:0
},

imperativeTranslation:{
flex:1,
flexShrink:1,
color:'#9F3F64',
fontSize:13,
lineHeight:18,
fontWeight:'800',
textAlign:'left'
},

imperativeRight:{
flex:1.35,
flexDirection:'row',
alignItems:'center',
justifyContent:'flex-end',
minWidth:0
},

imperativeTextBlock:{
flex:1,
alignItems:'flex-end',
paddingRight:6,
minWidth:0
},

imperativeHebrew:{
color:'#2D4769',
fontSize:17,
lineHeight:23,
fontWeight:'900',
textAlign:'right',
writingDirection:'rtl'
},

imperativeTranslit:{
marginTop:1,
color:'#CE6857',
fontSize:13,
lineHeight:16,
fontWeight:'800',
textAlign:'right'
},

examplesList:{
gap:9
},

exampleCard:{
backgroundColor:'#FFFFFF',
borderRadius:15,
borderWidth:1,
borderColor:'#D7DCE6',
paddingHorizontal:12,
paddingVertical:11
},

exampleTopRow:{
flexDirection:'row',
alignItems:'center',
marginBottom:8
},

prepositionBadge:{
minWidth:42,
height:30,
borderRadius:10,
backgroundColor:'#F8E7ED',
borderWidth:1,
borderColor:'#E9C7D4',
alignItems:'center',
justifyContent:'center',
paddingHorizontal:9
},

prepositionText:{
color:'#9F3F64',
fontSize:18,
lineHeight:22,
fontWeight:'900',
writingDirection:'rtl'
},

prepositionType:{
flex:1,
marginLeft:10,
marginRight:6,
color:'#73788F',
fontSize:10,
lineHeight:13,
fontWeight:'900',
textAlign:'left'
},

exampleTextBlock:{
width:'100%'
},

exampleHebrew:{
color:'#2D4769',
fontSize:19,
lineHeight:26,
fontWeight:'900',
textAlign:'right',
writingDirection:'rtl'
},

highlightedPreposition:{
color:'#CE6857',
fontSize:19,
fontWeight:'900'
},

exampleTranslit:{
marginTop:4,
color:'#CE6857',
fontSize:14,
lineHeight:19,
fontWeight:'800',
textAlign:'left'
},

exampleTranslationBox:{
marginTop:7,
borderRadius:11,
backgroundColor:'#F8E7ED',
paddingHorizontal:10,
paddingVertical:7
},

exampleTranslation:{
color:'#9F3F64',
fontSize:14,
lineHeight:19,
fontWeight:'800',
textAlign:'left'
},

practiceInfo:{
marginTop:12,
paddingTop:9,
borderTopWidth:1,
borderTopColor:'rgba(51,54,82,0.12)',
flexDirection:'row',
alignItems:'center',
justifyContent:'center',
flexWrap:'wrap'
},

practiceInfoLabel:{
color:'#73788F',
fontSize:9,
lineHeight:13,
fontWeight:'900',
letterSpacing:.4,
marginRight:7
},

practiceInfoText:{
color:'#9F3F64',
fontSize:11,
lineHeight:15,
fontWeight:'900',
textAlign:'center'
},

bottomBar:{
flexDirection:'row',
alignItems:'center',
gap:8,
paddingHorizontal:12,
paddingTop:8,
paddingBottom:10,
backgroundColor:'#83A3CD'
},

navButton:{
flex:1,
height:52,
flexDirection:'row',
alignItems:'center',
justifyContent:'center',
backgroundColor:'#FFFDEF',
borderRadius:16,
borderWidth:2,
borderColor:'#D7DCE6',
paddingHorizontal:5
},

navText:{
color:'#333652',
fontSize:12,
fontWeight:'900'
},

listButton:{
flex:1.05,
height:52,
alignItems:'center',
justifyContent:'center',
backgroundColor:'#CE6857',
borderRadius:16,
shadowColor:'#000',
shadowOpacity:.15,
shadowRadius:5,
shadowOffset:{
width:0,
height:2
},
elevation:4
},

listButtonText:{
color:'#FFFDEF',
fontSize:13,
fontWeight:'900'
},

/* НОВАЯ КНОПКА ЗАКРЫТЬ */

closeButton:{
flex:1,
height:52,
alignItems:'center',
justifyContent:'center',
backgroundColor:'#CE6857',
borderRadius:16,
shadowColor:'#000',
shadowOpacity:.15,
shadowRadius:5,
shadowOffset:{
width:0,
height:2
},
elevation:4
},

closeButtonText:{
color:'#FFFDEF',
fontSize:15,
fontWeight:'900',
textAlign:'center'
},

emptyState:{
flex:1,
alignItems:'center',
justifyContent:'center',
padding:20
},

emptyText:{
color:'#FFFDEF',
fontSize:18,
fontWeight:'900'
},

buttonPressed:{
opacity:.78,
transform:[
{scale:.985}
]
}

});

export default VerbDetailsScreen;