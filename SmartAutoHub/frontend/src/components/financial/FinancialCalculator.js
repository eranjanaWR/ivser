/**
 * Financial Calculator
 * Calculate loan EMI and monthly payments
 */

import React, { useState, useMemo } from 'react';
import { Box, TextField, Typography, Grid, Card, CardContent } from '@mui/material';

function FinancialCalculator({ vehiclePrice, setVehiclePrice }) {
  const [downPayment, setDownPayment] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('60');
  const [interestRate, setInterestRate] = useState('7.5');

  const calculations = useMemo(() => {
    const price = parseFloat(vehiclePrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const principal = price - down;
    const rate = parseFloat(interestRate) || 0;
    const months = parseFloat(loanPeriod) || 1;

    if (price <= 0 || principal <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, principal: 0 };
    }

    // EMI formula: [P × R × (1 + R)^N] / [(1 + R)^N - 1]
    const monthlyRate = rate / 100 / 12;
    const emi = monthlyRate === 0 
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    return {
      emi: isFinite(emi) ? emi : 0,
      totalPayment: isFinite(totalPayment) ? totalPayment : 0,
      totalInterest: isFinite(totalInterest) ? totalInterest : 0,
      principal
    };
  }, [vehiclePrice, downPayment, loanPeriod, interestRate]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Vehicle Price (Rs)"
            type="number"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '100000' }}
          />

          <TextField
            label="Down Payment (Rs)"
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '100000' }}
          />

          <TextField
            label="Loan Period (Months)"
            type="number"
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '12', min: '12', max: '240' }}
          />

          <TextField
            label="Interest Rate (%)"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '0.1', min: '0' }}
          />
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Loan Summary
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Loan Principal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Rs {calculations.principal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Monthly EMI
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
                  Rs {calculations.emi.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Interest
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Rs {calculations.totalInterest.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '2px solid #1976d2' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Payment
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1.1rem' }}>
                  Rs {calculations.totalPayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default FinancialCalculator;
