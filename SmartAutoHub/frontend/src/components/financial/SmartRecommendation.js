/**
 * Smart Finance Recommendation
 *
 * Analyzes all active finance companies (from the same MongoDB-backed
 * `/api/financial/companies` data already loaded by FinancialAidsPage) and
 * recommends the single most suitable eligible company for the buyer's
 * current vehicle price / down payment / loan period.
 *
 * This is a simple, transparent, rule-based ranking - NOT machine learning.
 * Ranking order: lowest overall cost -> lowest monthly payment -> lowest interest rate.
 *
 * Reuses the exact same eligibility + EMI logic as ComparisonTable via
 * utils/loanCalculations (evaluateCompanyFinancing), so results are always
 * consistent between the two features.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Button
} from '@mui/material';
import { formatCurrency, evaluateCompanyFinancing } from '../../utils/loanCalculations';

const FALLBACK_LOGO = '/images/download.png';

function buildReason(best, secondBest) {
  if (!secondBest) {
    return 'Recommended because it is the only eligible financing option for your current inputs.';
  }
  if (best.overallCost < secondBest.overallCost) {
    return 'Recommended because it has the lowest overall cost among the eligible financing options.';
  }
  if (best.emi < secondBest.emi) {
    return 'Recommended because it has the lowest monthly payment among options with a similar overall cost.';
  }
  return 'Recommended because it offers the lowest interest rate among comparably priced eligible options.';
}

function SmartRecommendation({
  companies,
  vehiclePrice,
  downPayment = 0,
  loanPeriod = 60,
  loading = false,
  error = '',
  onSave,
  saving = false,
  saveMessage = '',
  saveError = ''
}) {
  const price = parseFloat(vehiclePrice) || 0;
  const down = parseFloat(downPayment) || 0;
  const months = parseInt(loanPeriod, 10) || 60;
  const loanAmount = Math.max(price - down, 0);
  const downPaymentPercent = price > 0 ? (down / price) * 100 : 0;

  const ranked = useMemo(() => {
    if (loading || error || !companies || companies.length === 0 || price <= 0 || loanAmount <= 0) {
      return [];
    }

    const evaluated = companies
      .map((company) => evaluateCompanyFinancing(company, loanAmount, downPaymentPercent, months))
      .filter((r) => r.eligible);

    // Deterministic ranking: overall cost asc -> monthly payment asc -> interest rate asc
    evaluated.sort((a, b) => {
      if (a.overallCost !== b.overallCost) return a.overallCost - b.overallCost;
      if (a.emi !== b.emi) return a.emi - b.emi;
      return a.company.interestRate - b.company.interestRate;
    });

    return evaluated;
  }, [companies, loading, error, price, loanAmount, downPaymentPercent, months]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading finance companies...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Unable to generate a recommendation: {error}</Alert>;
  }

  if (price <= 0 || loanAmount <= 0) {
    return (
      <Alert severity="info">
        Enter a valid vehicle price and down payment in the Calculator tab to see a recommendation.
      </Alert>
    );
  }

  if (!companies || companies.length === 0) {
    return <Alert severity="info">No finance companies are currently available.</Alert>;
  }

  if (ranked.length === 0) {
    return (
      <Alert severity="warning">
        No suitable finance company is available for the current loan requirements. Try adjusting the down
        payment, loan period, or loan amount.
      </Alert>
    );
  }

  const best = ranked[0];
  const secondBest = ranked[1];
  const reason = buildReason(best, secondBest);
  const { company } = best;

  return (
    <Card variant="outlined" sx={{ borderColor: '#1976d2', borderWidth: 2 }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: '#1976d2', fontWeight: 700 }}>
          Recommended Finance Company
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}>
          <Avatar
            src={company.logo}
            alt={company.name}
            variant="rounded"
            sx={{ width: 56, height: 56, bgcolor: '#f0f0f0' }}
            imgProps={{
              onError: (e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_LOGO;
              }
            }}
          >
            {company.name ? company.name.charAt(0) : '?'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {company.name}
            </Typography>
            <Chip label="Eligible" color="success" size="small" />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Interest Rate</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{company.interestRate}%</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Loan Period</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{months} months</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Monthly Payment</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Rs {formatCurrency(best.emi)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Interest</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Rs {formatCurrency(best.totalInterest)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Processing Fee</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Rs {formatCurrency(best.processingFee)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Overall Cost</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1976d2' }}>
              Rs {formatCurrency(best.overallCost)}
            </Typography>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mb: onSave ? 2 : 0 }}>
          {reason}
        </Alert>

        {onSave && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => onSave(best)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Financing Plan'}
            </Button>
            {saveMessage && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {saveMessage}
              </Alert>
            )}
            {saveError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {saveError}
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default SmartRecommendation;
