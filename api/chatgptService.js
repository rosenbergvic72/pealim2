const SERVER_URL = 'https://hebrew-bot-server.onrender.com';

// 🧼 Очистка и защита от необработанных объектов
const serializeValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(serializeValue).join('\n');
    }
    return Object.entries(value)
      .map(([key, val]) => `- ${key}: ${serializeValue(val)}`)
      .join('\n');
  }
  return String(value);
};

const sanitizeReply = (input) => {
  if (typeof input === 'object') {
    return serializeValue(input);
  }

  let text = String(input);

  // Удаляем [object Object]
  text = text.replace(/\[object Object\]/g, '[неопределённый объект]');

  // Пробуем сериализовать объекты внутри текста
  text = text.replace(/\{[^{}]+\}/g, (match) => {
    try {
      const parsed = JSON.parse(match);
      return serializeValue(parsed);
    } catch {
      return match;
    }
  });

  return text.trim();
};

export const askChatGPT = async (question, history = [], context = '') => {
  try {
    const response = await fetch(`${SERVER_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history, context }),
    });

    const text = await response.text();

    if (!text || text.trim() === '') {
      console.warn('Empty response from server');
      return 'The bot could not provide an answer. Please try rephrasing your question.';
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('JSON parse error:', e);
      return 'The server response was corrupted or incomplete.';
    }

    let replyText;
    if (typeof data.reply === 'string') {
      replyText = data.reply;
    } else if (typeof data.reply === 'object') {
      try {
        replyText = serializeValue(data.reply); // вместо JSON.stringify
      } catch {
        replyText = '[не удалось сериализовать ответ]';
      }
    } else {
      replyText = String(data.reply);
    }

    const cleaned = sanitizeReply(replyText);
    return cleaned;

  } catch (e) {
    console.error('Server request error:', e);
    return 'Connection error. Please try again later.';
  }
};
