import React,{memo,useEffect,useMemo,useState}from'react';
import{BackHandler,FlatList,Pressable,SafeAreaView,StyleSheet,Text,TextInput,View}from'react-native';
import verbs1 from'./verbs1.json';

const UI_TEXT={
ru:{searchPlaceholder:'Поиск: иврит, перевод, транслитерация',allVerbs:'Все глаголы',found:'Найдено',noResults:'Глаголы не найдены'},
en:{searchPlaceholder:'Search: Hebrew, translation, transliteration',allVerbs:'All verbs',found:'Found',noResults:'No verbs found'},
fr:{searchPlaceholder:'Recherche : hébreu, traduction, translittération',allVerbs:'Tous les verbes',found:'Trouvés',noResults:'Aucun verbe trouvé'},
es:{searchPlaceholder:'Buscar: hebreo, traducción, transliteración',allVerbs:'Todos los verbos',found:'Encontrados',noResults:'No se encontraron verbos'},
pt:{searchPlaceholder:'Pesquisar: hebraico, tradução, transliteração',allVerbs:'Todos os verbos',found:'Encontrados',noResults:'Nenhum verbo encontrado'},
ar:{searchPlaceholder:'بحث: العبرية، الترجمة، النطق',allVerbs:'كل الأفعال',found:'تم العثور على',noResults:'لم يتم العثور على أفعال'},
am:{searchPlaceholder:'ዕብራይስጥ፣ ትርጉም ወይም አጠራር ይፈልጉ',allVerbs:'ሁሉም ግሶች',found:'የተገኙ',noResults:'ምንም ግስ አልተገኘም'},
he:{searchPlaceholder:'חיפוש: עברית, תרגום או תעתיק',allVerbs:'כל הפעלים',found:'נמצאו',noResults:'לא נמצאו פעלים'}
};

const LANGUAGE_ALIASES={
ru:'ru',russian:'ru',русский:'ru',
en:'en',english:'en',
fr:'fr',french:'fr',français:'fr',francais:'fr',
es:'es',spanish:'es',español:'es',espanol:'es',
pt:'pt',portuguese:'pt',português:'pt',portugues:'pt','pt-pt':'pt',
ar:'ar',arabic:'ar',arab:'ar',العربية:'ar',
am:'am',amharic:'am',አማርኛ:'am',
he:'he',hebrew:'he',iw:'he',עברית:'he'
};

const normalizeLanguage=language=>{
const key=String(language||'').trim().toLowerCase();
return LANGUAGE_ALIASES[key]||'en';
};

const normalizeSearch=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');

const getTranslationOptions=(verb,lang)=>{
switch(lang){
case'ru':return verb.translationOptions||[];
case'en':return verb.translationOptionsEn||[];
case'fr':return verb.translationOptionsFr||[];
case'es':return verb.translationOptionsEs||[];
case'pt':return verb.translationOptionsPt||[];
case'ar':return verb.translationOptionsAr||[];
case'am':return verb.translationOptionsAm||[];
case'he':return verb.translationOptionsEn||[];
default:return verb.translationOptionsEn||[];
}
};

const getCorrectTranslation=(verb,lang)=>{
const options=getTranslationOptions(verb,lang);
if(!Array.isArray(options)||!options.length)return'';
const index=Number.isInteger(verb.correctTranslationIndex)?verb.correctTranslationIndex:0;
return options[index]||options[0]||'';
};

const VerbListItem=memo(({verb,translation,onPress,isRtl})=>(
<Pressable accessibilityRole="button" onPress={()=>onPress?.(verb)} style={({pressed})=>[styles.verbCard,pressed&&styles.buttonPressed]}>
<View style={styles.verbCardContent}>

<View style={styles.translationSide}>
{!!translation&&(
<View style={styles.translationBadge}>
<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.6}
maxFontSizeMultiplier={1}
style={[styles.translation,isRtl&&styles.rtlText]}
>
{translation}
</Text>
</View>
)}
</View>

<View style={styles.hebrewSide}>
<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.72}
maxFontSizeMultiplier={1}
style={styles.hebrewVerb}
>
{verb.hebrewVerb}
</Text>

{!!verb.transliteration&&(
<Text
numberOfLines={1}
adjustsFontSizeToFit
minimumFontScale={0.72}
maxFontSizeMultiplier={1}
style={styles.transliteration}
>
{verb.transliteration}
</Text>
)}
</View>

<View style={styles.arrowContainer}>
<Text maxFontSizeMultiplier={1} style={styles.arrow}>›</Text>
</View>

</View>
</Pressable>
));

VerbListItem.displayName='VerbListItem';

const VerbLibraryScreen=({navigation,route})=>{
const[search,setSearch]=useState('');
const language=route?.params?.language||'ru';
const lang=normalizeLanguage(language);
const text=UI_TEXT[lang]||UI_TEXT.en;
const isRtl=lang==='ar'||lang==='he';

useEffect(()=>{
const backAction=()=>{
navigation.goBack();
return true;
};

const subscription=BackHandler.addEventListener(
'hardwareBackPress',
backAction
);

return()=>subscription.remove();
},[navigation]);

const safeVerbs=useMemo(
()=>Array.isArray(verbs1)
?verbs1.filter(verb=>verb&&typeof verb.hebrewVerb==='string'&&verb.hebrewVerb.trim())
:[],
[]
);

const preparedVerbs=useMemo(
()=>safeVerbs.map((verb,index)=>{
const translation=getCorrectTranslation(verb,lang);
return{
verb,
translation,
index,
searchHebrew:normalizeSearch(verb.hebrewVerb),
searchTransliteration:normalizeSearch(verb.transliteration),
searchTranslation:normalizeSearch(translation)
};
}),
[safeVerbs,lang]
);

const filteredVerbs=useMemo(()=>{
const query=normalizeSearch(search);
if(!query)return preparedVerbs;
return preparedVerbs.filter(item=>
item.searchHebrew.includes(query)||
item.searchTransliteration.includes(query)||
item.searchTranslation.includes(query)
);
},[preparedVerbs,search]);

const countLabel=search.trim()
?`${text.found}: ${filteredVerbs.length}`
:`${text.allVerbs}: ${safeVerbs.length}`;

const handleVerbPress=verb=>{
const index=verbs1.findIndex(item=>item===verb);
if(index<0)return;

navigation.navigate('VerbDetails',{
index,
language
});
};

return(
<SafeAreaView style={styles.screen}>

<View style={styles.searchArea}>
<View style={styles.searchCard}>

<View style={[styles.searchInputContainer,isRtl&&styles.searchInputContainerRtl]}>
<Text maxFontSizeMultiplier={1} style={styles.searchIcon}>⌕</Text>

<TextInput
value={search}
onChangeText={setSearch}
placeholder={text.searchPlaceholder}
placeholderTextColor="#8A8EA1"
autoCorrect={false}
autoCapitalize="none"
clearButtonMode="while-editing"
maxFontSizeMultiplier={1}
style={[styles.searchInput,isRtl&&styles.searchInputRtl]}
/>

{!!search&&(
<Pressable
accessibilityRole="button"
onPress={()=>setSearch('')}
hitSlop={10}
style={({pressed})=>[styles.clearButton,pressed&&styles.clearButtonPressed]}
>
<Text maxFontSizeMultiplier={1} style={styles.clearButtonText}>×</Text>
</Pressable>
)}

</View>

<View style={styles.divider}/>

<Text maxFontSizeMultiplier={1} style={[styles.countText,isRtl&&styles.rtlText]}>
{countLabel}
</Text>

</View>
</View>

<FlatList
data={filteredVerbs}
keyExtractor={item=>`${item.verb.hebrewVerb}-${item.index}`}
showsVerticalScrollIndicator={false}
keyboardShouldPersistTaps="handled"
keyboardDismissMode="on-drag"
contentContainerStyle={[styles.listContent,!filteredVerbs.length&&styles.listContentEmpty]}
renderItem={({item})=>(
<VerbListItem
verb={item.verb}
translation={item.translation}
onPress={handleVerbPress}
isRtl={isRtl}
/>
)}
ItemSeparatorComponent={()=><View style={styles.itemSeparator}/>}
ListEmptyComponent={
<View style={styles.emptyCard}>
<Text maxFontSizeMultiplier={1} style={[styles.emptyText,isRtl&&styles.rtlText]}>
{text.noResults}
</Text>
</View>
}
/>

</SafeAreaView>
);
};

const styles=StyleSheet.create({
screen:{
flex:1,
backgroundColor:'#83A3CD'
},

rtlText:{
writingDirection:'rtl'
},

searchArea:{
paddingHorizontal:16,
paddingTop:12,
paddingBottom:10
},

searchCard:{
backgroundColor:'#FFFDEF',
borderRadius:22,
paddingHorizontal:14,
paddingTop:12,
paddingBottom:11,
shadowColor:'#000',
shadowOpacity:.15,
shadowRadius:10,
shadowOffset:{width:0,height:4},
elevation:5
},

searchInputContainer:{
minHeight:52,
flexDirection:'row',
alignItems:'center',
borderRadius:17,
borderWidth:2,
borderColor:'#D7DCE6',
backgroundColor:'#FFFFFF',
paddingHorizontal:12
},

searchInputContainerRtl:{
flexDirection:'row-reverse'
},

searchIcon:{
width:28,
color:'#73788F',
fontSize:25,
lineHeight:28,
fontWeight:'900',
textAlign:'center'
},

searchInput:{
flex:1,
minHeight:48,
marginLeft:6,
color:'#333652',
fontSize:15,
fontWeight:'700',
textAlign:'left'
},

searchInputRtl:{
marginLeft:0,
marginRight:6,
textAlign:'right',
writingDirection:'rtl'
},

clearButton:{
width:30,
height:30,
borderRadius:15,
backgroundColor:'#E8EEF7',
alignItems:'center',
justifyContent:'center'
},

clearButtonPressed:{
opacity:.7
},

clearButtonText:{
marginTop:-2,
color:'#73788F',
fontSize:23,
lineHeight:25,
fontWeight:'700'
},

divider:{
height:1,
marginVertical:10,
backgroundColor:'rgba(51,54,82,0.12)'
},

countText:{
color:'#73788F',
fontSize:13,
lineHeight:18,
fontWeight:'800',
textAlign:'center'
},

listContent:{
paddingHorizontal:16,
paddingBottom:18
},

listContentEmpty:{
flexGrow:1
},

itemSeparator:{
height:8
},

verbCard:{
minHeight:82,
borderRadius:17,
borderWidth:2,
borderColor:'#D7DCE6',
backgroundColor:'#FFFDEF',
paddingHorizontal:12,
paddingVertical:8,
shadowColor:'#000',
shadowOpacity:.1,
shadowRadius:5,
shadowOffset:{width:0,height:2},
elevation:3
},

verbCardContent:{
flex:1,
flexDirection:'row',
alignItems:'center'
},

translationSide:{
flex:1.15,
justifyContent:'center',
alignItems:'flex-start',
paddingRight:10
},

translationBadge:{
alignSelf:'stretch',
minHeight:42,
borderRadius:13,
backgroundColor:'#F8E7ED',
borderWidth:1,
borderColor:'#E9C7D4',
justifyContent:'center',
paddingHorizontal:8,
paddingVertical:6
},

translation:{
color:'#9F3F64',
fontSize:16,
lineHeight:20,
fontWeight:'900',
textAlign:'center'
},

hebrewSide:{
flex:1,
alignItems:'flex-end',
justifyContent:'center',
paddingLeft:10
},

hebrewVerb:{
color:'#2D4769',
fontSize:26,
lineHeight:31,
fontWeight:'900',
textAlign:'right',
writingDirection:'rtl'
},

transliteration:{
marginTop:3,
color:'#CE6857',
fontSize:16,
lineHeight:21,
fontWeight:'800',
textAlign:'right'
},

arrowContainer:{
width:25,
height:40,
alignItems:'center',
justifyContent:'center',
marginLeft:5
},

arrow:{
color:'#CE6857',
fontSize:34,
lineHeight:38,
fontWeight:'500'
},

emptyCard:{
minHeight:80,
marginTop:4,
borderRadius:17,
backgroundColor:'#F8E7ED',
alignItems:'center',
justifyContent:'center',
paddingHorizontal:16,
paddingVertical:14
},

emptyText:{
color:'#9F3F64',
fontSize:14,
lineHeight:20,
fontWeight:'800',
textAlign:'center'
},

buttonPressed:{
opacity:.78,
transform:[{scale:.985}]
}
});

export default VerbLibraryScreen;