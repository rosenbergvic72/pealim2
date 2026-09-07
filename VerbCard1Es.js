import React,{useState,useEffect,useRef}from'react';
import{View,Text,Image,TouchableOpacity,StyleSheet,Animated}from'react-native';
import{Audio}from'expo-av';
import LottieView from'lottie-react-native';
import sounds from'./Soundss';
import TypewriterTextRTL from'./TypewriterTextRTL';
import{widthPercentageToDP as wp,heightPercentageToDP as hp}from'react-native-responsive-screen';

const VerbCard1Es=({
verbData,
soundEnabled,

isExcluded=false,
isPinned=false,
onExcludePress,
onPinTogglePress,
onOpenManageModal,

fullCardEnabled=false,
onOpenFullCard,
})=>{

const soundRef=useRef(null);
const[isPlaying,setIsPlaying]=useState(false);
const animationRef=useRef(null);

const opacity1=useRef(new Animated.Value(0)).current;
const opacity2=useRef(new Animated.Value(0)).current;
const opacity3=useRef(new Animated.Value(0)).current;
const opacity4=useRef(new Animated.Value(0)).current;

const fullCardAnim=useRef(
new Animated.Value(fullCardEnabled?1:0)
).current;

const[shadowEnabled,setShadowEnabled]=useState(false);

useEffect(()=>{
return()=>{
if(soundRef.current){
soundRef.current.unloadAsync().catch(()=>{});
soundRef.current=null;
}
};
},[]);

const playAudio=async audioFileName=>{
try{

const key=
String(audioFileName||'')
.replace('.mp3','');

const audioFile=
sounds[key];

if(!audioFile){
console.error(
`Audio file ${audioFileName} not found.`
);
return;
}

if(soundRef.current){
try{
await soundRef.current.unloadAsync();
}catch{}
soundRef.current=null;
}

const{sound}=
await Audio.Sound.createAsync(
audioFile
);

soundRef.current=sound;

setIsPlaying(true);

await sound.playAsync();

sound.setOnPlaybackStatusUpdate(status=>{
if(status?.didJustFinish){

setIsPlaying(false);

sound.unloadAsync().catch(()=>{});

if(soundRef.current===sound){
soundRef.current=null;
}

}
});

}catch(e){

console.error(
'Audio error',
e
);

setIsPlaying(false);

}
};

useEffect(()=>{

if(
verbData?.audioFile&&
soundEnabled
){
playAudio(
verbData.audioFile
);
}

// eslint-disable-next-line react-hooks/exhaustive-deps
},[
verbData,
soundEnabled
]);

useEffect(()=>{

opacity1.setValue(0);
opacity2.setValue(0);
opacity3.setValue(0);
opacity4.setValue(0);

setShadowEnabled(false);

Animated.timing(
opacity1,
{
toValue:1,
duration:500,
useNativeDriver:true
}
).start();

const timer2=setTimeout(()=>{

Animated.timing(
opacity2,
{
toValue:1,
duration:500,
useNativeDriver:true
}
).start();

},100);

const timer3=setTimeout(()=>{

Animated.timing(
opacity3,
{
toValue:1,
duration:500,
useNativeDriver:true
}
).start();

},200);

const timer4=setTimeout(()=>{

Animated.timing(
opacity4,
{
toValue:1,
duration:500,
useNativeDriver:true
}
).start();

},300);

const shadowTimer=setTimeout(()=>{

setShadowEnabled(true);

},800);

return()=>{

clearTimeout(timer2);
clearTimeout(timer3);
clearTimeout(timer4);
clearTimeout(shadowTimer);

};

},[
verbData,
opacity1,
opacity2,
opacity3,
opacity4
]);

useEffect(()=>{

if(isPlaying){
animationRef.current?.play?.();
}else{
animationRef.current?.reset?.();
}

},[
isPlaying
]);

/* ПЛАВНАЯ АКТИВАЦИЯ КНОПКИ */

useEffect(()=>{

Animated.timing(
fullCardAnim,
{
toValue:fullCardEnabled?1:0,
duration:350,
useNativeDriver:false
}
).start();

},[
fullCardEnabled,
fullCardAnim
]);

const fullCardBackgroundColor=
fullCardAnim.interpolate({
inputRange:[0,1],
outputRange:[
'#D9D9D9',
'#83A3CD'
]
});

const fullCardTextColor=
fullCardAnim.interpolate({
inputRange:[0,1],
outputRange:[
'#8D8D8D',
'#FFFDEF'
]
});

const fullCardScale=
fullCardAnim.interpolate({
inputRange:[
0,
0.65,
1
],
outputRange:[
1,
1.035,
1
]
});

if(!verbData)return null;

return(

<Animated.View
style={[
styles.cardContainer,
shadowEnabled&&styles.cardShadow
]}
>

<View
style={styles.hebrewVerbContainer}
pointerEvents="box-none"
>

{isPlaying&&(

<LottieView
ref={animationRef}
source={require('./assets/Animation - 1718430107767.json')}
autoPlay
loop={false}
style={styles.lottieAnimation}
pointerEvents="none"
/>

)}

<TypewriterTextRTL
text={verbData.hebrewVerb}
typingSpeed={100}
maxFontSizeMultiplier={1.2}
style={styles.hebrewVerb}
/>

<Animated.Text
style={[
styles.translit,
{opacity:opacity2}
]}
maxFontSizeMultiplier={1.2}
>
{verbData.transliteration}
</Animated.Text>

<Animated.Text
style={[
styles.root,
{opacity:opacity3}
]}
maxFontSizeMultiplier={1.2}
>
{`Raíz: ${verbData.root}`}
</Animated.Text>

<Animated.Text
style={[
styles.bin,
{opacity:opacity4}
]}
maxFontSizeMultiplier={1.2}
>
{`Binyan: ${verbData.binyan}`}
</Animated.Text>

{/* БОКОВЫЕ КНОПКИ */}

<View
style={styles.sideButtonsColumn}
pointerEvents="box-none"
>

<TouchableOpacity
onPress={onExcludePress}
style={styles.smallIconBtn}
activeOpacity={0.75}
hitSlop={{
top:10,
bottom:10,
left:10,
right:10
}}
>

<Image
source={
isExcluded
?require('./glaz2.png')
:require('./glaz1.png')
}
style={styles.smallIcon}
/>

</TouchableOpacity>

<TouchableOpacity
onPress={onPinTogglePress}
style={styles.smallIconBtn}
activeOpacity={0.75}
hitSlop={{
top:10,
bottom:10,
left:10,
right:10
}}
>

<Image
source={
isPinned
?require('./gant2.png')
:require('./gant1.png')
}
style={styles.smallIcon}
/>

</TouchableOpacity>

<TouchableOpacity
onPress={onOpenManageModal}
style={styles.smallIconBtn}
activeOpacity={0.75}
hitSlop={{
top:10,
bottom:10,
left:10,
right:10
}}
>

<Image
source={require('./spisok.png')}
style={styles.smallIcon}
/>

</TouchableOpacity>

</View>

{/* FICHA DEL VERBO */}

<Animated.View
style={[
styles.fullCardButton,
{
backgroundColor:
fullCardBackgroundColor,

transform:[
{
scale:
fullCardScale
}
]
}
]}
>

<TouchableOpacity
onPress={onOpenFullCard}
disabled={!fullCardEnabled}
activeOpacity={0.75}
style={styles.fullCardTouchable}
hitSlop={{
top:6,
bottom:6,
left:6,
right:6
}}
>

<Animated.Text
style={[
styles.fullCardButtonText,
{
color:
fullCardTextColor
}
]}
maxFontSizeMultiplier={1.1}
>
FICHA DEL VERBO
</Animated.Text>

</TouchableOpacity>

</Animated.View>

{/* СПИКЕР */}

<TouchableOpacity
onPress={()=>
playAudio(
verbData.audioFile
)
}
style={styles.audioButton}
activeOpacity={0.75}
hitSlop={{
top:12,
bottom:12,
left:12,
right:12
}}
>

<Image
source={require('./speaker3.png')}
style={styles.audioIcon}
/>

</TouchableOpacity>

</View>

</Animated.View>

);
};

export default VerbCard1Es;

const styles=StyleSheet.create({

cardContainer:{
width:'100%',
borderRadius:wp('2.5%'),
marginBottom:hp('2%'),
padding:wp('2%'),
backgroundColor:'#FFFDEF'
},

cardShadow:{
shadowColor:'#000',
shadowOffset:{
width:0,
height:hp('0.25%')
},
shadowOpacity:0.25,
shadowRadius:wp('2%'),
elevation:5
},

hebrewVerbContainer:{
alignItems:'center',
justifyContent:'center',
position:'relative',
minHeight:175,
paddingTop:0,
paddingBottom:hp('1.2%'),
zIndex:1
},

lottieAnimation:{
position:'absolute',
top:0,
left:0,
width:32,
height:32
},

hebrewVerb:{
fontSize:32,
fontWeight:'bold',
color:'#333652',
borderRadius:wp('5%'),
paddingLeft:wp('2.5%'),
paddingRight:wp('2.5%'),
textAlign:'center',
marginTop:0,
maxWidth:'80%',
alignSelf:'center'
},

translit:{
fontSize:18,
fontWeight:'bold',
color:'#CE6857',
borderRadius:wp('5%'),
paddingLeft:wp('2.5%'),
paddingRight:wp('2.5%'),
marginBottom:hp('1.2%'),
maxWidth:'80%',
textAlign:'center',
alignSelf:'center'
},

root:{
fontSize:14,
fontWeight:'bold',
color:'#4C7031',
borderRadius:wp('5%'),
paddingLeft:wp('2.5%'),
paddingRight:wp('2.5%'),
marginBottom:hp('0.3%'),
maxWidth:'80%',
textAlign:'center',
alignSelf:'center'
},

bin:{
fontSize:14,
fontWeight:'bold',
color:'#003882',
borderRadius:wp('5%'),
paddingLeft:wp('2.5%'),
paddingRight:wp('2.5%'),
marginBottom:0,
maxWidth:'80%',
textAlign:'center',
alignSelf:'center'
},

audioButton:{
position:'absolute',
right:wp('1.8%'),
bottom:hp('1.2%'),
zIndex:50,
elevation:50
},

audioIcon:{
width:wp('6.5%'),
height:wp('6.5%'),
borderRadius:wp('2.5%')
},

sideButtonsColumn:{
position:'absolute',
right:wp('1.5%'),
top:hp('2%'),
bottom:hp('7%'),
justifyContent:'center',
alignItems:'center',
zIndex:60,
elevation:60
},

smallIconBtn:{
width:wp('8.2%'),
height:wp('8.2%'),
backgroundColor:'transparent',
justifyContent:'center',
alignItems:'center',
marginVertical:4
},

smallIcon:{
width:'100%',
height:'100%',
resizeMode:'contain'
},

fullCardButton:{
position:'absolute',
left:wp('0.3%'),
bottom:hp('-0.4%'),
minHeight:25,
borderRadius:wp('2%'),
justifyContent:'center',
alignItems:'center',
zIndex:50,
elevation:50,
overflow:'hidden'
},

fullCardTouchable:{
minHeight:25,
paddingHorizontal:wp('3%'),
paddingVertical:hp('0.3%'),
justifyContent:'center',
alignItems:'center'
},

fullCardButtonText:{
fontSize:11,
fontWeight:'900',
textAlign:'center'
}

});