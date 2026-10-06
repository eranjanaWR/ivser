/**
 * Comparison Table
 * Display side-by-side comparison of selected finance companies.
 *
 * Step 4: now uses the buyer's actual loan amount/loan period (from the
 * Loan Calculator tab) and the FinanceCompany data fetched from the API
 * (minDownPayment %, processingFee, loanPeriod range, maxLoanAmount) to
 * compute eligibility and per-company payments, using the SAME EMI formula
 * as FinancialCalculator.js (imported from utils/loanCalculations, not
 * re-implemented).
 */

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { formatCurrency, evaluateCompanyFinancing } from '../../utils/loanCalculations';

const FALLBACK_LOGO = '/images/download.png';

function ComparisonTable({
  companies,
  vehiclePrice,
  downPayment = 0,
  loanPeriod = 60,
  loading = false,
  error = ''
}) {
  const price = parseFloat(vehiclePrice) || 0;
  const down = parseFloat(downPayment) || 0;
  const months = parseInt(loanPeriod, 10) || 60;
  const loanAmount = Math.max(price - down, 0);
  const downPaymentPercent = price > 0 ? (down / price) * 100 : 0;

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
    return <Alert severity="error">{error}</Alert>;
  }

  if (!companies || companies.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No companies selected for comparison
      </Typography>
    );
  }

  if (price <= 0) {
    return <Alert severity="warning">Enter a valid vehicle price to compare finance companies.</Alert>;
  }

  // Work out eligibility + payment figures for each company, using the same
  // shared helper as the Smart Recommendation so results are always consistent.
  const rows = companies.map((company) => evaluateCompanyFinancing(company, loanAmount, downPaymentPercent, months));

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Comparing loan amount of Rs {formatCurrency(loanAmount)} over {months} months
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Interest Rate</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Loan Period</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Min Down Payment</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Max Loan</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Processing Fee</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Monthly Payment</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Total Interest</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Overall Cost</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ company, eligible, reasons, emi, totalInterest, processingFee, overallCost }) => (
              <TableRow
                key={company.id || company._id}
                sx={{ '&:hover': { backgroundColor: '#f9f9f9' }, opacity: eligible ? 1 : 0.7 }}
              >
                <TableCell sx={{ fontWeight: 500 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={company.logo}
                      alt={company.name}
                      variant="rounded"
                      sx={{ width: 32, height: 32, bgcolor: '#f0f0f0' }}
                      imgProps={{
                        onError: (e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_LOGO;
                        }
                      }}
                    >
                      {company.name ? company.name.charAt(0) : '?'}
                    </Avatar>
                    {company.name}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: '#1976d2', fontWeight: 600 }}>
                  {company.interestRate}%
                </TableCell>
                <TableCell align="right">
                  {company.loanPeriod
                    ? `${company.loanPeriod.minMonths}-${company.loanPeriod.maxMonths} mo`
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  {typeof company.minDownPayment === 'number' ? `${company.minDownPayment}%` : '—'}
                </TableCell>
                <TableCell align="right">
                  {typeof company.maxLoanAmount === 'number'
                    ? `Rs ${(company.maxLoanAmount / 100000).toFixed(1)}L`
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  Rs {formatCurrency(processingFee)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {eligible ? `Rs ${formatCurrency(emi)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {eligible ? `Rs ${formatCurrency(totalInterest)}` : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  {eligible ? `Rs ${formatCurrency(overallCost)}` : '—'}
                </TableCell>
                <TableCell align="center">
                  {eligible ? (
                    <Chip label="Eligible" color="success" size="small" />
                  ) : (
                    <Chip label="Not eligible" color="error" size="small" title={reasons.join('; ')} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.some((r) => !r.eligible) && (
        <Box sx={{ mt: 2 }}>
          {rows
            .filter((r) => !r.eligible)
            .map((r) => (
              <Alert severity="warning" key={r.company.id || r.company._id} sx={{ mb: 1 }}>
                {r.company.name}: {r.reasons.join('; ')}
              </Alert>
            ))}
        </Box>
      )}

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
        "Overall Cost" = Total Loan Repayment (monthly payment × loan period) + Processing Fee. Processing fee is
        shown separately and is not treated as interest.
      </Typography>
    </Box>
  );
}

export default ComparisonTable;
