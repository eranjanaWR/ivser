/**
 * Lease Calculator Page
 * Calculate lease payments and terms
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

const LeaseCalculatorPage = () => {
  const [vehiclePrice, setVehiclePrice] = useState(25000);
  const [downPayment, setDownPayment] = useState(5000);
  const [leaseTerm, setLeaseTerm] = useState(36);
  const [interestRate, setInterestRate] = useState(4.5);
  const [residualValue, setResidualValue] = useState(60);

  const monthlyPayment = React.useMemo(() => {
    const principal = vehiclePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = leaseTerm;

    if (monthlyRate === 0) {
      return principal / numPayments;
    }

    const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
    const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
    const monthlyPaymentAmount = (principal * numerator) / denominator;

    return monthlyPaymentAmount;
  }, [vehiclePrice, downPayment, leaseTerm, interestRate]);

  const handleCalculate = () => {
    console.log({
      vehiclePrice,
      downPayment,
      leaseTerm,
      interestRate,
      residualValue,
      monthlyPayment: monthlyPayment.toFixed(2),
    });
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
            LEASE CALCULATOR
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Calculate your monthly lease payments and terms
          </Typography>
        </Box>

        {/* Calculator Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Vehicle Price */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Vehicle Price (LKR)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={vehiclePrice}
                  onChange={(e) => setVehiclePrice(Number(e.target.value))}
                  inputProps={{ step: 1000 }}
                />
                <Slider
                  value={vehiclePrice}
                  onChange={(e, newValue) => setVehiclePrice(newValue)}
                  min={10000}
                  max={100000}
                  step={1000}
                  marks={[
                    { value: 10000, label: '10K' },
                    { value: 50000, label: '50K' },
                    { value: 100000, label: '100K' },
                  ]}
                  sx={{ mt: 2 }}
                />
              </Grid>

              {/* Down Payment */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Down Payment (LKR)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  inputProps={{ step: 1000 }}
                />
                <Slider
                  value={downPayment}
                  onChange={(e, newValue) => setDownPayment(newValue)}
                  min={0}
                  max={vehiclePrice}
                  step={1000}
                  sx={{ mt: 2 }}
                />
              </Grid>

              {/* Lease Term */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Lease Term (Months)
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={leaseTerm}
                    onChange={(e) => setLeaseTerm(e.target.value)}
                  >
                    <MenuItem value={24}>24 Months</MenuItem>
                    <MenuItem value={36}>36 Months</MenuItem>
                    <MenuItem value={48}>48 Months</MenuItem>
                    <MenuItem value={60}>60 Months</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Interest Rate */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Interest Rate (% per annum)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  inputProps={{ step: 0.1 }}
                />
                <Slider
                  value={interestRate}
                  onChange={(e, newValue) => setInterestRate(newValue)}
                  min={0}
                  max={10}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                  ]}
                  sx={{ mt: 2 }}
                />
              </Grid>

              {/* Residual Value */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Residual Value (% of vehicle price)
                </Typography>
                <Slider
                  value={residualValue}
                  onChange={(e, newValue) => setResidualValue(newValue)}
                  min={20}
                  max={80}
                  step={5}
                  marks={[
                    { value: 20, label: '20%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' },
                  ]}
                  valueLabelDisplay="on"
                />
              </Grid>
            </Grid>

            {/* Calculate Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleCalculate}
              sx={{
                mt: 4,
                bgcolor: '#000',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#333',
                },
              }}
            >
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card sx={{ bgcolor: '#f0f0f0' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Lease Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle Price
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    LKR {vehiclePrice.toLocaleString('en-LK')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Down Payment
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    LKR {downPayment.toLocaleString('en-LK')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Lease Term
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {leaseTerm} months
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Interest Rate
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {interestRate}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Monthly Lease Payment
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                LKR {monthlyPayment.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LeaseCalculatorPage;
