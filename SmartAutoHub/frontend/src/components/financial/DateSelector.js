/**
 * Date Selector
 * Calendar for scheduling agent meetings
 */

import React, { useState } from 'react';
import { Box, Button, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Alert } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

function DateSelector() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [scheduled, setScheduled] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return max.toISOString().split('T')[0];
  };

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      console.log('Scheduled:', { date: selectedDate, time: selectedTime });
      setScheduled(true);
      setTimeout(() => {
        setScheduled(false);
        setSelectedDate('');
        setSelectedTime('');
      }, 3000);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        Schedule a meeting with a finance agent
      </Typography>

      {scheduled && (
        <Alert severity="success">
          Meeting scheduled successfully! You will receive a confirmation.
        </Alert>
      )}

      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
          <CalendarToday sx={{ mr: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
          Select Date
        </FormLabel>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={getTodayDate()}
          max={getMaxDate()}
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontFamily: 'inherit',
            fontSize: '1rem'
          }}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Select Time</FormLabel>
        <RadioGroup
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          row
        >
          <FormControlLabel
            value="09:00"
            control={<Radio />}
            label="9:00 AM"
          />
          <FormControlLabel
            value="11:00"
            control={<Radio />}
            label="11:00 AM"
          />
          <FormControlLabel
            value="14:00"
            control={<Radio />}
            label="2:00 PM"
          />
          <FormControlLabel
            value="16:00"
            control={<Radio />}
            label="4:00 PM"
          />
        </RadioGroup>
      </FormControl>

      <Button
        variant="contained"
        onClick={handleSchedule}
        disabled={!selectedDate || !selectedTime}
        sx={{
          backgroundColor: '#1976d2',
          color: '#ffffff',
          fontWeight: 600,
          py: 1.5,
          '&:hover': { backgroundColor: '#1565c0' }
        }}
      >
        Schedule Meeting
      </Button>
    </Box>
  );
}

export default DateSelector;
