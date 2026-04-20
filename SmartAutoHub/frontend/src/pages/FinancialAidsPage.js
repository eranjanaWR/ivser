import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Alert, Paper, Grid } from '@mui/material';
import FinanceCompanySelector from '../components/financial/FinanceCompanySelector';
import FinancialCalculator from '../components/financial/FinancialCalculator';
import ComparisonTable from '../components/financial/ComparisonTable';
import ContactAgentForm from '../components/financial/ContactAgentForm';
import DateSelector from '../components/financial/DateSelector';

function FinancialAidsPage() {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  useEffect(() => {
    if (location.state?.vehiclePrice) {
      setVehiclePrice(location.state.vehiclePrice.toString());
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
              <FinancialCalculator vehiclePrice={vehiclePrice} setVehiclePrice={setVehiclePrice} />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Company Comparison
              </Typography>
              {selectedCompanies.length > 0 ? (
                <ComparisonTable companies={selectedCompanies} vehiclePrice={vehiclePrice} />
              ) : (
                <Alert severity="warning">Please select at least one finance company to compare</Alert>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Contact Finance Agent
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ContactAgentForm />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateSelector />
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
