/**
 * Takgaala AI Page
 * Shows two chatbot selector cards and opens only the selected chat.
 */

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VehicleDetailsBotCard from '../components/takgaala/VehicleDetailsBotCard';
import VehicleComparisonBotCard from '../components/takgaala/VehicleComparisonBotCard';

const TakgaalaAIPage = () => {
  const [selectedBot, setSelectedBot] = useState(null);

  const botCards = useMemo(
    () => [
      {
        id: 'details',
        title: 'Vehicle Details',
        description:
          'Enter a vehicle name and get full vehicle details, features, pros, cons, and summary',
        icon: <DirectionsCarIcon sx={{ color: '#12355B' }} />,
      },
      {
        id: 'comparison',
        title: 'Vehicle Comparison',
        description:
          'Enter two vehicle names and compare them with pros, cons, and final recommendation',
        icon: <CompareArrowsIcon sx={{ color: '#12355B' }} />,
      },
    ],
    []
  );

  const renderSelectedChat = () => {
    if (selectedBot === 'details') {
      return <VehicleDetailsBotCard />;
    }

    if (selectedBot === 'comparison') {
      return <VehicleComparisonBotCard />;
    }

    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'rgba(18, 53, 91, 0.25)',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, color: '#12355B' }}>
          Select a chatbot to continue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click Vehicle Details or Vehicle Comparison to open that dedicated chat interface.
        </Typography>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        py: 4,
        minHeight: 'calc(100vh - 80px)',
        background:
          'radial-gradient(circle at 0% 0%, rgba(214, 230, 250, 0.55), transparent 45%), linear-gradient(180deg, #F5F8FC 0%, #EFF4FA 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(18, 53, 91, 0.12)',
            background: 'linear-gradient(125deg, #12355B 0%, #20507D 55%, #2B679B 100%)',
            color: '#ffffff',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
            <SmartToyIcon />
            <Typography variant="h4" fontWeight={800}>
              Takgaala-AI
            </Typography>
          </Stack>

          <Typography variant="body1" sx={{ maxWidth: 900, opacity: 0.95 }}>
            Choose one specialized assistant at a time. Both chatbots use one shared Azure OpenAI endpoint while enforcing different behavior through dedicated system prompts.
          </Typography>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {botCards.map((bot) => {
            const isSelected = selectedBot === bot.id;

            return (
              <Grid item xs={12} md={6} key={bot.id}>
                <Paper
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBot(bot.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedBot(bot.id);
                    }
                  }}
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isSelected ? '#12355B' : 'rgba(18, 53, 91, 0.16)',
                    backgroundColor: isSelected ? 'rgba(18, 53, 91, 0.06)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(18, 53, 91, 0.12)',
                      borderColor: '#12355B',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 0.8 }}>
                    {bot.icon}
                    <Typography variant="h6" fontWeight={700} color="#0B1F35">
                      {bot.title}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 44, mb: 1.5 }}>
                    {bot.description}
                  </Typography>

                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={() => setSelectedBot(bot.id)}
                    sx={{
                      borderColor: '#12355B',
                      color: isSelected ? '#ffffff' : '#12355B',
                      backgroundColor: isSelected ? '#12355B' : 'transparent',
                      '&:hover': {
                        borderColor: '#0F2B4B',
                        backgroundColor: isSelected ? '#0F2B4B' : 'rgba(18, 53, 91, 0.06)',
                      },
                    }}
                  >
                    {isSelected ? 'Chat Open' : 'Open Chat'}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            {renderSelectedChat()}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TakgaalaAIPage;
