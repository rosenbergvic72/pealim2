import { Share, InteractionManager } from 'react-native';

export const shareAnswerOutsideModal = async (text, _, blockModalCloseRef) => {
  const cleaned = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*>+/gm, '')
    .replace(/^-{3,}/g, '')
    .replace(/^\s*#+\s*(.*)/gm, '$1')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

  try {
    console.log('🔒 Блокируем закрытие ChatBotModal');
    blockModalCloseRef.current = true;

    await new Promise((resolve) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          await Share.share({ message: cleaned });
        } finally {
          resolve();
        }
      });
    });

  } catch (err) {
    console.error('❌ Ошибка при шаринге:', err);
  } finally {
    setTimeout(() => {
      console.log('✅ Разблокируем закрытие ChatBotModal');
      blockModalCloseRef.current = false;
    }, 800); // Можно уменьшить задержку до 500
  }
};
