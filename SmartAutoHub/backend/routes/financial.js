/**
 * Financial Aids Routes
 * API endpoints for financial operations
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/financial/companies
 * Get all available finance companies with rates
 */
router.get('/companies', (req, res) => {
  try {
    const companies = [
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

    res.json({
      success: true,
      data: companies,
      message: 'Finance companies retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finance companies',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/calculate
 * Calculate loan EMI based on vehicle price and terms
 */
router.post('/calculate', (req, res) => {
  try {
    const { vehiclePrice, downPayment, loanPeriod, interestRate } = req.body;

    if (!vehiclePrice || vehiclePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid vehicle price is required'
      });
    }

    const principal = vehiclePrice - (downPayment || 0);
    const rate = (interestRate || 7.5) / 100 / 12;
    const months = loanPeriod || 60;

    let emi = 0;
    if (rate === 0) {
      emi = principal / months;
    } else {
      emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    }

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    res.json({
      success: true,
      data: {
        principal,
        emi,
        totalPayment,
        totalInterest,
        monthlyPayment: emi
      }
    });
  } catch (error) {
    console.error('Error calculating EMI:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating EMI',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/contact-agent
 * Submit contact form to request agent callback
 */
router.post('/contact-agent', (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required'
      });
    }

    // Here you would save to database
    console.log('New agent contact request:', { name, email, phone, company, message });

    res.json({
      success: true,
      message: 'Contact request submitted. An agent will reach out shortly.',
      data: { name, email, phone, company, message }
    });
  } catch (error) {
    console.error('Error submitting contact request:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact request',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/schedule-meeting
 * Schedule a meeting with finance agent
 */
router.post('/schedule-meeting', (req, res) => {
  try {
    const { date, time, email, phone } = req.body;

    if (!date || !time || !email) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and email are required'
      });
    }

    // Here you would save to database
    console.log('Meeting scheduled:', { date, time, email, phone });

    res.json({
      success: true,
      message: 'Meeting scheduled successfully. Check your email for confirmation.',
      data: { date, time, email, phone }
    });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling meeting',
      error: error.message
    });
  }
});

module.exports = router;
