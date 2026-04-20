/**
 * Finance Company Selector
 * Display selectable finance company cards with logos
 */

import React from 'react';
import { Box, Card, CardActionArea, CardContent, Typography, Grid } from '@mui/material';

function FinanceCompanySelector({ selectedCompanies, onSelectCompany }) {
  const FINANCE_COMPANIES = [
    {
      id: 'lb-finance',
      name: 'LB Finance',
      interestRate: 7.5,
      maxLoanAmount: 5000000,
      logo: '/uploads/download.png'
    },
    {
      id: 'lolc-finance',
      name: 'LOLC Finance',
      interestRate: 8.0,
      maxLoanAmount: 4500000,
      logo: '/uploads/download.jpg'
    },
    {
      id: 'central-finance',
      name: 'Central Finance',
      interestRate: 7.8,
      maxLoanAmount: 5500000,
      logo: '/uploads/download1.png'
    },
    {
      id: 'hnb-finance',
      name: 'HNB Finance',
      interestRate: 7.2,
      maxLoanAmount: 6000000,
      logo: '/uploads/download2.png'
    },
    {
      id: 'singer-finance',
      name: 'Singer Finance',
      interestRate: 8.5,
      maxLoanAmount: 4000000,
      logo: '/uploads/download3.png'
    }
  ];

  return (
    <Grid container spacing={2}>
      {FINANCE_COMPANIES.map((company) => {
        const isSelected = selectedCompanies.some((c) => c.id === company.id);
        return (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={company.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: isSelected ? '3px solid #1976d2' : '1px solid #e0e0e0',
                backgroundColor: isSelected ? '#e3f2fd' : '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardActionArea onClick={() => onSelectCompany(company)}>
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      flexShrink: 0,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '2px solid #1976d2',
                      position: 'relative',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <img
                      src={company.logo}
                      alt={company.name}
                      onLoad={(e) => {
                        console.log('Image loaded:', company.logo);
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', company.logo);
                        e.target.style.display = 'none';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '4px'
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {company.name}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Interest Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {company.interestRate}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Max Loan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Rs {(company.maxLoanAmount / 100000).toFixed(1)}L
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default FinanceCompanySelector;
