import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Alert, Paper, Grid } from '@mui/material';
import FinanceCompanySelector from '../components/financial/FinanceCompanySelector';
import FinancialCalculator from '../components/financial/FinancialCalculator';
import ComparisonTable from '../components/financial/ComparisonTable';
import FinanceBranchMap from '../components/financial/FinanceBranchMap';
import SmartRecommendation from '../components/financial/SmartRecommendation';
import ContactAgentForm from '../components/financial/ContactAgentForm';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SavedPlans from '../components/financial/SavedPlans';

// Key used to remember the last known vehicle price across page refreshes/direct visits,
// since router state (passed from VehicleDetailPage) is lost on a full page reload.
const VEHICLE_PRICE_STORAGE_KEY = 'financialAids.vehiclePrice';

function FinancialAidsPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [vehiclePrice, setVehiclePrice] = useState(() => {
    try {
      return sessionStorage.getItem(VEHICLE_PRICE_STORAGE_KEY) || '';
    } catch (e) {
      // sessionStorage may be unavailable (e.g. privacy mode) - fall back to empty
      return '';
    }
  });
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Step 4: single source of truth for finance-company data, fetched from the
  // MongoDB-backed GET /api/financial/companies endpoint.
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState('');

  // Step 4: down payment and loan period are lifted up here so the Comparison
  // tab can reuse the exact same values the buyer entered in the Calculator tab,
  // instead of assuming a fixed 60-month term.
  const [downPayment, setDownPayment] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('60');

  // Step 6: Save Financing Plan state
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [savedPlansLoading, setSavedPlansLoading] = useState(false);
  const [savedPlansError, setSavedPlansError] = useState('');
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  // VehicleDetailPage currently only passes vehiclePrice via router state, not a
  // vehicleId - preserved as-is (Step 6 does not redesign this navigation).
  // If a vehicleId is ever added to that router state in the future, it will be
  // picked up here automatically.
  const vehicleId = location.state?.vehicleId;

  const loadSavedPlans = React.useCallback(() => {
    if (!user) return;
    setSavedPlansLoading(true);
    setSavedPlansError('');
    api
      .get('/financial/plans')
      .then((res) => {
        setSavedPlans(res.data?.data || []);
      })
      .catch((err) => {
        console.error('Error fetching saved financing plans:', err);
        setSavedPlansError('Unable to load your saved financing plans.');
      })
      .finally(() => setSavedPlansLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSavedPlans();
    } else {
      setSavedPlans([]);
    }
  }, [user, loadSavedPlans]);

  useEffect(() => {
    let isMounted = true;
    setCompaniesLoading(true);
    setCompaniesError('');

    api
      .get('/financial/companies')
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || [];
        setCompanies(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching finance companies:', err);
        setCompaniesError('Unable to load finance companies. Please try again later.');
      })
      .finally(() => {
        if (isMounted) setCompaniesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Preserve the existing navigation behavior: VehicleDetailPage still passes
    // vehiclePrice via router state, and that always takes priority when present.
    if (location.state?.vehiclePrice) {
      const price = location.state.vehiclePrice.toString();
      setVehiclePrice(price);
      try {
        sessionStorage.setItem(VEHICLE_PRICE_STORAGE_KEY, price);
      } catch (e) {
        // ignore storage errors, calculator still works with in-memory state
      }
    }
  }, [location.state]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCompanySelect = (company) => {
    setSelectedCompanies((prev) => {
      const isSelected = prev.find((c) => c.id === company.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== company.id);
      }
      return [...prev, company];
    });
  };

  // Step 6: Save the recommended financing option (from SmartRecommendation) for
  // the logged-in buyer. Uses that company's own interestRate/emi/etc. (already
  // computed by evaluateCompanyFinancing), not the standalone calculator's
  // manually-entered rate.
  const handleSaveRecommendedPlan = (recommendation) => {
    if (!user) {
      setSaveError('');
      setSaveMessage('');
      setSaveError('Please log in to save a financing plan.');
      return;
    }

    if (savingPlan) return; // guard against duplicate accidental submissions

    setSavingPlan(true);
    setSaveMessage('');
    setSaveError('');

    const payload = {
      financeCompanyId: recommendation.company._id || recommendation.company.id,
      vehiclePrice: parseFloat(vehiclePrice) || 0,
      downPayment: parseFloat(downPayment) || 0,
      loanAmount: Math.max((parseFloat(vehiclePrice) || 0) - (parseFloat(downPayment) || 0), 0),
      interestRate: recommendation.company.interestRate,
      loanPeriod: parseInt(loanPeriod, 10) || 60,
      monthlyPayment: recommendation.emi,
      totalInterest: recommendation.totalInterest,
      totalPayment: recommendation.totalLoanRepayment,
      processingFee: recommendation.processingFee
    };

    if (vehicleId) {
      payload.vehicleId = vehicleId;
    }

    api
      .post('/financial/plans', payload)
      .then(() => {
        setSaveMessage('Financing plan saved successfully.');
        loadSavedPlans();
      })
      .catch((err) => {
        console.error('Error saving financing plan:', err);
        const message = err.response?.data?.message || 'Unable to save financing plan. Please try again.';
        setSaveError(message);
      })
      .finally(() => setSavingPlan(false));
  };

  const handleDeletePlan = (planId) => {
    if (deletingPlanId) return;
    setDeletingPlanId(planId);
    api
      .delete(`/financial/plans/${planId}`)
      .then(() => {
        loadSavedPlans();
      })
      .catch((err) => {
        console.error('Error deleting financing plan:', err);
        setSavedPlansError('Unable to delete financing plan. Please try again.');
      })
      .finally(() => setDeletingPlanId(null));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
        Financial Aids
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Explore financing options for your next vehicle purchase
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Interest rates and loan terms are subject to credit approval. Contact the finance company for current rates.
      </Alert>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Select Finance Companies
        </Typography>
        <FinanceCompanySelector
          selectedCompanies={selectedCompanies}
          onSelectCompany={handleCompanySelect}
          companies={companies}
          loading={companiesLoading}
          error={companiesError}
        />
      </Paper>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Calculator" />
          <Tab label="Comparison" />
          <Tab label="Contact Agent" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Loan Calculator
              </Typography>
              <FinancialCalculator
                vehiclePrice={vehiclePrice}
                setVehiclePrice={setVehiclePrice}
                selectedCompanies={selectedCompanies}
                downPayment={downPayment}
                onDownPaymentChange={setDownPayment}
                loanPeriod={loanPeriod}
                onLoanPeriodChange={setLoanPeriod}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Smart Finance Recommendation
              </Typography>
              <SmartRecommendation
                companies={companies}
                vehiclePrice={vehiclePrice}
                downPayment={downPayment}
                loanPeriod={loanPeriod}
                loading={companiesLoading}
                error={companiesError}
                onSave={handleSaveRecommendedPlan}
                saving={savingPlan}
                saveMessage={saveMessage}
                saveError={saveError}
              />

              <Typography variant="h6" sx={{ mt: 4, mb: 3, fontWeight: 600 }}>
                Company Comparison
              </Typography>
              {selectedCompanies.length > 0 ? (
                <ComparisonTable
                  companies={selectedCompanies}
                  vehiclePrice={vehiclePrice}
                  downPayment={downPayment}
                  loanPeriod={loanPeriod}
                  loading={companiesLoading}
                  error={companiesError}
                />
              ) : (
                <Alert severity="warning">Please select at least one finance company to compare</Alert>
              )}

              <Typography variant="h6" sx={{ mt: 4, mb: 3, fontWeight: 600 }}>
                Saved Financing Plans
              </Typography>
              {user ? (
                <SavedPlans
                  plans={savedPlans}
                  loading={savedPlansLoading}
                  error={savedPlansError}
                  onDelete={handleDeletePlan}
                  deletingId={deletingPlanId}
                />
              ) : (
                <Alert severity="info">Please log in to view and save financing plans.</Alert>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Contact Finance Agent
              </Typography>
              <Grid container spacing={3}>
  <Grid item xs={12}>
    <ContactAgentForm companies={companies} />

    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Finance Company Branch Locations
      </Typography>
      <FinanceBranchMap companies={companies} />
    </Box>
  </Grid>
</Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default FinancialAidsPage;
