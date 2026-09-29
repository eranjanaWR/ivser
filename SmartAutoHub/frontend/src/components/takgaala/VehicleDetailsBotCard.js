/**
 * Vehicle Details Bot Card
 * Handles one-vehicle detail conversations.
 */

import React, { useMemo, useState } from 'react';
import { TextField } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TakgaalaChatCard from './TakgaalaChatCard';
import { callTakgaalaAI, TAKGAALA_BOT_TYPES } from '../../services/takgaalaAIService';

let messageIdCounter = 1;
const nextMessageId = () => `details-${messageIdCounter++}`;

const VehicleDetailsBotCard = () => {
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: nextMessageId(),
      role: 'assistant',
      text: 'Hello, I am your Vehicle Details AI assistant. Share one vehicle name (model/year/variant) and I will provide structured details.',
    },
  ]);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  const handleSend = async () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || isLoading) {
      return;
    }

    const userMessage = {
      id: nextMessageId(),
      role: 'user',
      text: trimmedDraft,
    };

    const previousMessages = [...messages];

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setError('');
    setIsLoading(true);

    try {
      const aiReply = await callTakgaalaAI({
        botType: TAKGAALA_BOT_TYPES.DETAILS,
        prompt: trimmedDraft,
        history: previousMessages,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: 'assistant',
          text: aiReply,
        },
      ]);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to fetch AI details right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <TakgaalaChatCard
      title="Vehicle Details"
      description="Enter a vehicle name to get full specifications, features, pros, cons, and summary."
      icon={<DirectionsCarIcon sx={{ color: '#12355B' }} />}
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSend={handleSend}
      canSend={canSend}
    >
      <TextField
        fullWidth
        multiline
        maxRows={3}
        label="Vehicle Name"
        placeholder="Example: Toyota Corolla 2021 X Grade"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </TakgaalaChatCard>
  );
};

export default VehicleDetailsBotCard;
