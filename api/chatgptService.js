const SERVER_URL = 'https://hebrew-bot-server.onrender.com';

export const askChatGPT = async (question, history = []) => {
  try {
    const response = await fetch(`${SERVER_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    });

    const data = await response.json();
    return data.reply;
  } catch (e) {
    console.error('Ошибка:', e);
    return 'Ошибка связи с сервером.';
  }
};
