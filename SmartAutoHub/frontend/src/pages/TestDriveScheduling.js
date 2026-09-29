import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from '@mui/material';

const TestDriveScheduling = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const handleProceed = () => {
    if (!date || !time) {
      setError('Please select both date and time');
      return;
    }

    sessionStorage.setItem('testDriveSchedule', JSON.stringify({ date, time }));
    navigate(`/book-test-drive/${vehicleId}/confirm`);
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Test Drive Scheduling
          </Typography>

          <TextField
            fullWidth
            type="date"
            label="Preferred Date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="time"
            label="Preferred Time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button variant="contained" onClick={handleProceed} fullWidth>
            Proceed to Confirmation
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default TestDriveScheduling;
