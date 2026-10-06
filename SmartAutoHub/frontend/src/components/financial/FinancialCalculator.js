/**
 * Financial Calculator
 * Calculate loan EMI and monthly payments
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Box, TextField, Typography, Grid, Card, CardContent, Alert } from '@mui/material';
import { calculateEmi, formatCurrency } from '../../utils/loanCalculations';

function FinancialCalculator({
  vehiclePrice,
  setVehiclePrice,
  selectedCompanies = [],
  downPayment: downPaymentProp,
  onDownPaymentChange,
  loanPeriod: loanPeriodProp,
  onLoanPeriodChange
}) {
  const [internalDownPayment, setInternalDownPayment] = useState('');
  const [internalLoanPeriod, setInternalLoanPeriod] = useState('60');
  const [interestRate, setInterestRate] = useState('7.5');
  const [activeCompanyName, setActiveCompanyName] = useState('');

  // Task/Step 4: optionally controlled by the parent (FinancialAidsPage) so the
  // Comparison tab can reuse the same down payment/loan period the buyer entered
  // here. Falls back to internal state so this component still works standalone.
  const downPayment = downPaymentProp !== undefined ? downPaymentProp : internalDownPayment;
  const setDownPayment = onDownPaymentChange || setInternalDownPayment;
  const loanPeriod = loanPeriodProp !== undefined ? loanPeriodProp : internalLoanPeriod;
  const setLoanPeriod = onLoanPeriodChange || setInternalLoanPeriod;

  // If the buyer selects a finance company (from FinanceCompanySelector, via FinancialAidsPage),
  // pre-fill the interest rate with that company's rate. The user can still edit it afterwards.
  useEffect(() => {
    if (selectedCompanies && selectedCompanies.length > 0) {
      const company = selectedCompanies[selectedCompanies.length - 1];
      if (company && typeof company.interestRate === 'number') {
        setInterestRate(String(company.interestRate));
        setActiveCompanyName(company.name || '');
      }
    } else {
      setActiveCompanyName('');
    }
  }, [selectedCompanies]);

  // Validation (Task 3): checked on every input change, before any calculation happens
  const validationErrors = useMemo(() => {
    const errors = {};
    const price = parseFloat(vehiclePrice);
    const down = parseFloat(downPayment);
    const rate = parseFloat(interestRate);
    const months = parseFloat(loanPeriod);

    if (vehiclePrice === '' || vehiclePrice === undefined || vehiclePrice === null || Number.isNaN(price) || price <= 0) {
      errors.vehiclePrice = 'Vehicle price must be greater than 0';
    }

    if (downPayment !== '' && !Number.isNaN(down) && down < 0) {
      errors.downPayment = 'Down payment cannot be negative';
    } else if (!errors.vehiclePrice && !Number.isNaN(down) && down > price) {
      // A down payment greater than the vehicle price would also make the loan amount negative
      errors.downPayment = 'Down payment cannot be greater than vehicle price';
    }

    if (interestRate !== '' && !Number.isNaN(rate) && rate < 0) {
      errors.interestRate = 'Interest rate cannot be negative';
    }

    if (loanPeriod === '' || Number.isNaN(months) || months <= 0 || !Number.isInteger(months)) {
      errors.loanPeriod = 'Loan period must be a valid whole number of months';
    }

    return errors;
  }, [vehiclePrice, downPayment, interestRate, loanPeriod]);

  const isValid = Object.keys(validationErrors).length === 0;

  const calculations = useMemo(() => {
    if (!isValid) {
      return null;
    }

    const price = parseFloat(vehiclePrice);
    const down = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    const months = parseInt(loanPeriod, 10);
    const loanAmount = price - down;

    const emi = calculateEmi(loanAmount, rate, months);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;

    // Guard against any edge case producing NaN/Infinity (Task 9) instead of showing them
    if (!isFinite(emi) || !isFinite(totalPayment) || !isFinite(totalInterest)) {
      return null;
    }

    return {
      vehiclePrice: price,
      downPayment: down,
      loanAmount,
      interestRate: rate,
      loanPeriod: months,
      emi,
      totalPayment,
      totalInterest
    };
  }, [vehiclePrice, downPayment, interestRate, loanPeriod, isValid]);

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
            error={Boolean(validationErrors.vehiclePrice)}
            helperText={validationErrors.vehiclePrice || ' '}
          />

          <TextField
            label="Down Payment (Rs)"
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '100000', min: '0' }}
            error={Boolean(validationErrors.downPayment)}
            helperText={validationErrors.downPayment || ' '}
          />

          <TextField
            label="Loan Period (Months)"
            type="number"
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '12', min: '12', max: '240' }}
            error={Boolean(validationErrors.loanPeriod)}
            helperText={validationErrors.loanPeriod || ' '}
          />

          <TextField
            label="Interest Rate (%)"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ step: '0.1', min: '0' }}
            error={Boolean(validationErrors.interestRate)}
            helperText={
              validationErrors.interestRate ||
              (activeCompanyName ? `Using ${activeCompanyName}'s rate - you can still edit it` : ' ')
            }
          />
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Loan Summary
            </Typography>

            {!calculations ? (
              <Alert severity="warning">
                {Object.values(validationErrors)[0] || 'Enter valid values to see the loan summary'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Vehicle Price
                  </Typography>
                  <Typography variant="body2">
                    Rs {formatCurrency(calculations.vehiclePrice)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Down Payment
                  </Typography>
                  <Typography variant="body2">
                    Rs {formatCurrency(calculations.downPayment)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loan Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Rs {formatCurrency(calculations.loanAmount)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Interest Rate
                  </Typography>
                  <Typography variant="body2">
                    {calculations.interestRate}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loan Period
                  </Typography>
                  <Typography variant="body2">
                    {calculations.loanPeriod} months
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Monthly Payment
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
                    Rs {formatCurrency(calculations.emi)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Interest
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Rs {formatCurrency(calculations.totalInterest)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '2px solid #1976d2' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total Payment
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1.1rem' }}>
                    Rs {formatCurrency(calculations.totalPayment)}
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default FinancialCalculator;
