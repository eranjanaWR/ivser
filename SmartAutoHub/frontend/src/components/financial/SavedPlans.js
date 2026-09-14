/**
 * Saved Financing Plans
 *
 * Displays the authenticated buyer's saved financing plans (Step 6) and lets
 * them delete a plan. Data comes from GET /api/financial/plans; deletion
 * uses DELETE /api/financial/plans/:id (both protected by the existing auth
 * middleware on the backend).
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency } from '../../utils/loanCalculations';

const FALLBACK_LOGO = '/images/download.png';

function SavedPlans({ plans, loading, error, onDelete, deletingId }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading saved plans...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!plans || plans.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        You have no saved financing plans yet.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {plans.map((plan) => {
        const company = plan.financeCompanyId;
        return (
          <Grid item xs={12} md={6} key={plan._id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={company?.logo}
                      alt={company?.name}
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: '#f0f0f0' }}
                      imgProps={{
                        onError: (e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_LOGO;
                        }
                      }}
                    >
                      {company?.name ? company.name.charAt(0) : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {company?.name || 'Finance Company'}
                      </Typography>
                      {plan.createdAt && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Saved on {new Date(plan.createdAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    aria-label="Delete saved plan"
                    size="small"
                    onClick={() => onDelete(plan._id)}
                    disabled={deletingId === plan._id}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Vehicle Price</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs {formatCurrency(plan.vehiclePrice)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Down Payment</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs {formatCurrency(plan.downPayment)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Loan Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs {formatCurrency(plan.loanAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Interest Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{plan.interestRate}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Loan Period</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{plan.loanPeriod} months</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Monthly Payment</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      Rs {formatCurrency(plan.monthlyPayment)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Interest</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs {formatCurrency(plan.totalInterest)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Processing Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs {formatCurrency(plan.processingFee)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Payment</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      Rs {formatCurrency(plan.totalPayment)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default SavedPlans;
