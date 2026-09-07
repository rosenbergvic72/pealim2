// VerbCard2.js
import React,{useEffect,useRef}from'react';
import{View,Text,StyleSheet,TouchableOpacity,Image,Animated}from'react-native';
import{widthPercentageToDP as wp,heightPercentageToDP as hp}from'react-native-responsive-screen';
import TypewriterTextLTR from'./TypewriterTextLTR';

const VerbCard2=({
verbData,

isExcluded=false,
isPinned=false,
onExcludePress,
onPinTogglePress,
onOpenManageModal,

fullCardEnabled=false,
onOpenFullCard,
})=>{

const fullCardAnim=useRef(
new Animated.Value(fullCardEnabled?1:0)
).current;

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
inputRange:[0,0.65,1],
outputRange:[1,1.035,1]
});

if(!verbData)return null;

return(

<View style={styles.cardContainer}>

<TypewriterTextLTR
text={verbData.verbRussian}
typingSpeed={40}
style={styles.verbRussian}
maxFontSizeMultiplier={1.2}
/>

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
top:12,
bottom:12,
left:12,
right:12
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
top:12,
bottom:12,
left:12,
right:12
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
top:12,
bottom:12,
left:12,
right:12
}}
>

<Image
source={require('./spisok.png')}
style={styles.smallIcon}
/>

</TouchableOpacity>

</View>

{/* КАРТОЧКА ГЛАГОЛА */}

<Animated.View
style={[
styles.fullCardButton,
{
backgroundColor:fullCardBackgroundColor,
transform:[
{scale:fullCardScale}
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
{color:fullCardTextColor}
]}
maxFontSizeMultiplier={1.1}
>
КАРТОЧКА ГЛАГОЛА
</Animated.Text>

</TouchableOpacity>

</Animated.View>

</View>

);
};

const styles=StyleSheet.create({

cardContainer:{
width:'100%',
alignItems:'center',
justifyContent:'center',
padding:5,
height:146,
borderRadius:10,
marginBottom:20,
backgroundColor:'#D1E3F1',
marginTop:-20,
shadowColor:'#000',
shadowOffset:{
width:0,
height:2
},
shadowOpacity:0.25,
shadowRadius:3.84,
elevation:5,
position:'relative',
zIndex:1
},

verbRussian:{
  fontSize:26,
  fontWeight:'bold',
  color:'#152039',
  textAlign:'center',
  width:'72%',
  alignSelf:'center'
},

sideButtonsColumn:{
position:'absolute',
right:wp('1.5%'),
top:0,
bottom:0,
justifyContent:'center',
alignItems:'center',
gap:7,
zIndex:60,
elevation:60
},

smallIconBtn:{
width:wp('8.5%'),
height:wp('8.5%'),
backgroundColor:'transparent',
justifyContent:'center',
alignItems:'center'
},

smallIcon:{
width:'100%',
height:'100%',
resizeMode:'contain'
},

fullCardButton:{
position:'absolute',
left:wp('1.5%'),
bottom:hp('1%'),
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

export default VerbCard2;