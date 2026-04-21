/**
 * Vehicle Comparison Bot Card
 * Handles two-vehicle comparison conversations.
 */

import React, { useMemo, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TakgaalaChatCard from './TakgaalaChatCard';
import { callTakgaalaAI, TAKGAALA_BOT_TYPES } from '../../services/takgaalaAIService';

let messageIdCounter = 1;
const nextMessageId = () => `comparison-${messageIdCounter++}`;

const VehicleComparisonBotCard = () => {
  const [vehicleOne, setVehicleOne] = useState('');
  const [vehicleTwo, setVehicleTwo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: nextMessageId(),
      role: 'assistant',
      text: 'I am your Vehicle Comparison AI assistant. Enter two vehicles and I will provide a structured comparison with a final recommendation.',
    },
  ]);

  const canSend = useMemo(() => {
    return vehicleOne.trim().length > 0 && vehicleTwo.trim().length > 0;
  }, [vehicleOne, vehicleTwo]);

  const handleSend = async () => {
    const vehicleOneTrimmed = vehicleOne.trim();
    const vehicleTwoTrimmed = vehicleTwo.trim();

    if (!vehicleOneTrimmed || !vehicleTwoTrimmed || isLoading) {
      return;
    }

    const userMessage = {
      id: nextMessageId(),
      role: 'user',
      text: `${vehicleOneTrimmed} vs ${vehicleTwoTrimmed}`,
    };

    const previousMessages = [...messages];
    const prompt = `Vehicle 1: ${vehicleOneTrimmed}\nVehicle 2: ${vehicleTwoTrimmed}`;

    setMessages((prev) => [...prev, userMessage]);
    setVehicleOne('');
    setVehicleTwo('');
    setError('');
    setIsLoading(true);

    try {
      const aiReply = await callTakgaalaAI({
        botType: TAKGAALA_BOT_TYPES.COMPARISON,
        prompt,
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
      const message = err.response?.data?.message || err.message || 'Unable to fetch AI comparison right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleOneKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleVehicleTwoKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <TakgaalaChatCard
      title="Vehicle Comparison"
      description="Enter two vehicle names to compare and get a final recommendation."
      icon={<CompareArrowsIcon sx={{ color: '#12355B' }} />}
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSend={handleSend}
      canSend={canSend}
    >
      <Stack spacing={1}>
        <TextField
          fullWidth
          label="Vehicle 1"
          placeholder="Example: Honda Vezel 2020 RS"
          value={vehicleOne}
          onChange={(event) => setVehicleOne(event.target.value)}
          onKeyDown={handleVehicleOneKeyDown}
        />
        <TextField
          fullWidth
          label="Vehicle 2"
          placeholder="Example: Toyota CH-R 2020 G"
          value={vehicleTwo}
          onChange={(event) => setVehicleTwo(event.target.value)}
          onKeyDown={handleVehicleTwoKeyDown}
        />
      </Stack>
    </TakgaalaChatCard>
  );
};

export default VehicleComparisonBotCard;
