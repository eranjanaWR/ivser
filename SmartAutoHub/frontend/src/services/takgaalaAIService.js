/**
 * Takgaala-AI Service
 * Shared API layer for all Takgaala-AI chatbot requests.
 */

import api from './api';

export const TAKGAALA_BOT_TYPES = {
  DETAILS: 'details',
  COMPARISON: 'comparison',
};

const mapHistoryForApi = (messages = []) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (message) =>
        message &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.text === 'string' &&
        message.text.trim().length > 0
    )
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.text.trim(),
    }));
};

export const callTakgaalaAI = async ({ botType, prompt, history = [] }) => {
  if (!botType || !Object.values(TAKGAALA_BOT_TYPES).includes(botType)) {
    throw new Error('Invalid bot type for Takgaala-AI request.');
  }

  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt is required.');
  }

  const response = await api.post('/ai/chat', {
    botType,
    message: prompt.trim(),
    history: mapHistoryForApi(history),
  });

  const aiReply = response.data?.data?.reply;
  if (!aiReply) {
    throw new Error('Takgaala-AI returned an empty response.');
  }

  return aiReply;
};
