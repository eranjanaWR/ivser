/**
 * Azure OpenAI Service
 * Centralized chat-completions caller for Takgaala-AI bots.
 */

const axios = require('axios');

const REQUIRED_ENV_VARS = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_API_VERSION',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_DEPLOYMENT_NAME'
];

const getAzureConfig = () => {
  const missing = REQUIRED_ENV_VARS.filter((envKey) => !process.env[envKey]);

  if (missing.length > 0) {
    const error = new Error(
      `Missing Azure OpenAI configuration: ${missing.join(', ')}`
    );
    error.statusCode = 500;
    throw error;
  }

  return {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ''),
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  };
};

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (message) =>
        message &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0
    )
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
};

const callAI = async (prompt, systemPrompt, history = []) => {
  const { apiKey, apiVersion, endpoint, deploymentName } = getAzureConfig();

  const completionUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeHistory(history),
    { role: 'user', content: prompt },
  ];

  try {
    const response = await axios.post(
      completionUrl,
      {
        messages,
        temperature: 0.2,
        max_tokens: 1000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        timeout: 30000,
      }
    );

    const aiContent = response.data?.choices?.[0]?.message?.content;

    if (!aiContent) {
      const error = new Error('Azure OpenAI returned an empty response.');
      error.statusCode = 502;
      throw error;
    }

    return aiContent.trim();
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const providerMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Unknown Azure OpenAI error';

    const wrappedError = new Error(`Azure OpenAI request failed: ${providerMessage}`);
    wrappedError.statusCode = error.response?.status || 502;
    throw wrappedError;
  }
};

module.exports = {
  callAI,
};
