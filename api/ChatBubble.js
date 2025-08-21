import React from 'react';
import { View } from 'react-native';

// Массив светлых оттенков
const bubbleColors = [
  '#f8fbff', // голубой
  '#f9fbe7', // зелёный
  '#fffde7', // жёлтый
  '#fff3e0', // оранжевый
  '#fce4ec', // розовый
  '#e0f7fa', // синий
  '#f3e5f5', // сиреневый
];

function getBubbleColor(index) {
  return bubbleColors[index % bubbleColors.length];
}

// index — для чередования цветов, isUser — если сообщение пользователя
const ChatBubble = ({ children, index, isUser }) => (
  <View
    style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      minWidth: '78%',
      maxWidth: '96%',
      width: 'auto',
      backgroundColor: isUser ? '#e0f2f1' : getBubbleColor(index),
      borderRadius: 18,
      paddingVertical: 13,
      paddingHorizontal: 15,
      marginVertical: 6,
      marginHorizontal: 2,
      shadowColor: '#222',
      shadowOpacity: 0.08,
      shadowRadius: 7,
    }}
  >
    {children}
  </View>
);

export default ChatBubble;
