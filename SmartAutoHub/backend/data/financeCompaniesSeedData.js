/**
 * Finance Companies Seed Data
 *
 * Reconciled from the existing (pre-Step-2) hardcoded finance company data found in:
 *   - backend/routes/financial.js            (name, interestRate, maxLoanAmount, logo)
 *   - backend/controllers/financialController.js (name, interestRate only)
 *   - frontend/src/components/financial/FinanceCompanySelector.js (name, interestRate, maxLoanAmount, logo)
 *
 * CONFLICTS FOUND between the three existing sources (see report for details):
 *   - HNB Finance interestRate:    routes/financial.js = 7.2, financialController.js = 8.5, frontend = 7.2
 *                                  -> 7.2 used (majority: 2 of 3 sources agree)
 *   - Singer Finance interestRate: routes/financial.js = 8.5, financialController.js = 8.2, frontend = 8.5
 *                                  -> 8.5 used (majority: 2 of 3 sources agree)
 *
 * LOGO PATHS: routes/financial.js pointed to '/uploads/download*.{png,jpg}' but those files do
 * NOT exist anywhere under backend/uploads. The frontend's '/images/download*.{png,jpg}' files
 * DO exist (frontend/public/images and frontend/build/images). The existing, real logo files are used here.
 *
 * FIELDS WITH NO EXISTING PROJECT DATA (not present in any of the three sources above):
 *   - minDownPayment, processingFee, phone, email, website, branches
 *   These are explicitly marked as PLACEHOLDER below and MUST be reviewed/confirmed with the
 *   business before this data is used in production. No real rates/fees have been invented.
 *
 * loanPeriod.minMonths / loanPeriod.maxMonths (12-84) are NOT invented - they reuse the existing
 * validation bounds already enforced in backend/controllers/financialController.js (calculateEMI).
 *
 * The original frontend/route "slug" ids (e.g. 'lb-finance') are kept here only as a code comment
 * for traceability - the FinanceCompany model uses MongoDB's own _id, no slug field was added.
 */

const FINANCE_COMPANIES_SEED_DATA = [
  {
    // legacyId: 'lb-finance'
    name: 'LB Finance',
    logo: '/images/download.png',
    interestRate: 7.5,
    maxLoanAmount: 5000000,
    minDownPayment: 0, // PLACEHOLDER (%) - not present in any existing source, needs business input
    processingFee: 0, // PLACEHOLDER (LKR) - not present in any existing source, needs business input
    loanPeriod: { minMonths: 12, maxMonths: 84 }, // reuses existing calculateEMI validation bounds
phone: '+94 11 2200200',
email: 'info@lbfinance.lk',
website: 'https://www.lbfinance.com',
    branches: [
  {
    branchName: 'Negombo Branch',
    address: 'No 107, St Joseph Street, Negombo',
    phone: '+94 31 2231266'
  },
  {
    branchName: 'Negombo City Branch',
    address: 'No 356, Main Street, Negombo',
    phone: '+94 31 2235155'
  },
  {
    branchName: 'Gampaha Branch',
    address: 'No 01/B, Bauddhaloka Mawatha, Gampaha',
    phone: '+94 33 2225571'
  }
],
    isActive: true
  },
  {
    // legacyId: 'lolc-finance'
    name: 'LOLC Finance',
    logo: '/images/download.jpg',
    interestRate: 8.0,
    maxLoanAmount: 4500000,
    minDownPayment: 0, // PLACEHOLDER (%)
    processingFee: 0, // PLACEHOLDER (LKR)
    loanPeriod: { minMonths: 12, maxMonths: 84 },
    phone: '',
    email: '',
    website: '',
    branches: [
  {
    branchName: 'Negombo Branch',
    address: 'No. 64, St Joseph Street, Negombo',
    phone: '+94 31 7880700',

  },
  {
    branchName: 'Metro Branch - Negombo',
    address: '74, Puttalam - Colombo Road, Negombo',
    phone: '+94 31 7881400',

  },
  {
    branchName: 'Kochchikade Branch',
    address: '160, Chilaw - Colombo Main Road, Negombo',
    phone: '+94 31 7880800',

  }
],
    isActive: true
  },
  {
    // legacyId: 'central-finance'
    name: 'Central Finance',
    logo: '/images/download (1).png',
    interestRate: 7.8,
    maxLoanAmount: 5500000,
    minDownPayment: 0, // PLACEHOLDER (%)
    processingFee: 0, // PLACEHOLDER (LKR)
    loanPeriod: { minMonths: 12, maxMonths: 84 },
    phone: '',
    email: '',
    website: '',
    branches: [
  {
    branchName: 'Negombo Branch',
    address: 'No. 367, Main Street, Negombo',
    phone: '+94 31 2222579',

  },
  {
    branchName: 'Ja-Ela Branch',
    address: 'No. 171, Negombo Road, Ja-Ela',
    phone: '+94 11 2070490'
  },
  {
    branchName: 'Gampaha Branch',
    address: 'No. 259, Colombo Road, Gampaha',
    phone: '+94 33 2234132'
  }
],
    isActive: true
  },
  {
    // legacyId: 'hnb-finance'
    // CONFLICT RESOLVED: interestRate was 7.2 in routes/financial.js and frontend, but 8.5 in
    // financialController.js. Used 7.2 (majority of existing sources). Needs confirmation.
    name: 'HNB Finance',
    logo: '/images/download (2).png',
    interestRate: 7.2,
    maxLoanAmount: 6000000,
    minDownPayment: 0, // PLACEHOLDER (%)
    processingFee: 0, // PLACEHOLDER (LKR)
    loanPeriod: { minMonths: 12, maxMonths: 84 },
    phone: '+94 11 202 4848',
    email: 'info@hnbfinance.lk',
    website: 'https://www.hnbfinance.lk',
    branches: [
  {
    branchName: 'Negombo Branch',
    address: 'No. 58, St. Joseph Street, Negombo',
    phone: '+94 31 222 8506'
  },
  {
    branchName: 'Ja-Ela Branch',
    address: 'No. 59/A, Negombo Road, Ja-Ela',
    phone: '+94 11 212 7680'
  },
  {
    branchName: 'Gampaha Branch',
    address: 'No. 103, Bauddhaloka Mawatha, Gampaha',
    phone: '+94 33 211 7750'
  }
],
    isActive: true
  },
  {
    // legacyId: 'singer-finance'
    // CONFLICT RESOLVED: interestRate was 8.5 in routes/financial.js and frontend, but 8.2 in
    // financialController.js. Used 8.5 (majority of existing sources). Needs confirmation.
  // legacyId: 'singer-finance'
  name: 'Singer Finance',
  logo: '/images/download (3).png',
  interestRate: 8.5,
  maxLoanAmount: 4000000,
  minDownPayment: 0, // PLACEHOLDER (%)
  processingFee: 0, // PLACEHOLDER (LKR)
  loanPeriod: { minMonths: 12, maxMonths: 84 },
  phone: '+94 11 2400400',
  email: 'financecompany@singersl.com',
  website: 'https://www.singerfinance.com',
  branches: [
  {
    branchName: 'Negombo Branch',
    address: '175 Negombo Road, Negombo, Sri Lanka',
    phone: '+94 31 223 4752'
  },
  {
    branchName: 'Ja-Ela Branch',
    address: '120 Negombo Road, Ja-Ela 11350, Sri Lanka',
    phone: '+94 11 792 4191'
  },
  {
    branchName: 'Gampaha Branch',
    address: 'No. 14 Mangala Road, Gampaha 11100, Sri Lanka',
    phone: '+94 33 223 0791'
  }
],
  isActive: true
}
];

module.exports = FINANCE_COMPANIES_SEED_DATA;
