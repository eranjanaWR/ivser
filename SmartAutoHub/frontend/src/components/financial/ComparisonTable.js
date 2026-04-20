/**
 * Comparison Table
 * Display side-by-side comparison of selected finance companies
 */

import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

function ComparisonTable({ companies, vehiclePrice }) {
  const price = parseFloat(vehiclePrice) || 0;

  const calculateMonthlyPayment = (company, months = 60) => {
    const principal = price;
    const rate = company.interestRate / 100 / 12;
    
    if (principal <= 0) return 0;
    if (rate === 0) return principal / months;
    
    const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return isFinite(emi) ? emi : 0;
  };

  if (companies.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No companies selected for comparison
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Interest Rate
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Max Loan
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Monthly EMI (60 months)
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Total Payment
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => {
            const emi = calculateMonthlyPayment(company, 60);
            const totalPayment = emi * 60;
            
            return (
              <TableRow key={company.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                <TableCell sx={{ fontWeight: 500 }}>{company.name}</TableCell>
                <TableCell align="right" sx={{ color: '#1976d2', fontWeight: 600 }}>
                  {company.interestRate}%
                </TableCell>
                <TableCell align="right">
                  Rs {(company.maxLoanAmount / 100000).toFixed(1)}L
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Rs {emi.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Rs {totalPayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ComparisonTable;
