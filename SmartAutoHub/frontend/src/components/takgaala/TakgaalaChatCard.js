/**
 * Takgaala Chat Card
 * Reusable UI shell for Takgaala-AI chatbot cards.
 */

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const bubbleStyles = {
  user: {
    alignSelf: 'flex-end',
    backgroundColor: '#12355B',
    color: '#ffffff',
    borderRadius: '16px 16px 4px 16px',
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F6FC',
    color: '#1F2933',
    borderRadius: '16px 16px 16px 4px',
  },
};

const TakgaalaChatCard = ({
  title,
  description,
  icon,
  messages,
  isLoading,
  error,
  onSend,
  canSend,
  children,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'rgba(18, 53, 91, 0.14)',
        borderRadius: 3,
        overflow: 'hidden',
        minHeight: { xs: 560, md: 620 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'rgba(18, 53, 91, 0.08)',
          background: 'linear-gradient(130deg, #E6EEF8 0%, #F8FBFF 100%)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {icon}
          <Typography variant="h6" fontWeight={700} color="#0B1F35">
            {title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          overflowY: 'auto',
          backgroundColor: '#FCFDFF',
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              ...bubbleStyles[message.role],
              maxWidth: '88%',
              px: 1.5,
              py: 1,
              fontSize: '0.92rem',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.text}
          </Box>
        ))}

        {isLoading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#12355B' }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Takgaala-AI is thinking...</Typography>
          </Stack>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'rgba(18, 53, 91, 0.08)' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={1.25}>
          {children}

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={onSend}
            disabled={!canSend || isLoading}
            sx={{
              alignSelf: 'flex-end',
              px: 2,
              backgroundColor: '#12355B',
              '&:hover': { backgroundColor: '#0F2B4B' },
            }}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default TakgaalaChatCard;
