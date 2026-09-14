/**
 * Finance Company Controller
 * Reads finance company data from MongoDB (FinanceCompany model).
 *
 * Wired in Step 4 to GET /api/financial/companies, replacing the old
 * hardcoded array while preserving the existing response shape
 * (id, name, interestRate, maxLoanAmount, logo) for backward compatibility.
 */

const FinanceCompany = require('../models/FinanceCompany');

/**
 * @desc    Get all active finance companies from the database
 * @route   GET /api/financial/companies
 * @access  Public
 */
const getActiveFinanceCompanies = async (req, res) => {
  try {
    const companies = await FinanceCompany.find({ isActive: true }).sort({ name: 1 });

    // Map to a response shape that keeps the old fields (id, name, interestRate,
    // maxLoanAmount, logo) working for existing frontend code, while exposing the
    // full set of new fields the comparison feature needs.
    const data = companies.map((company) => ({
      id: company._id.toString(), // backward-compatible field (previously a string slug)
      _id: company._id,
      name: company.name,
      logo: company.logo,
      interestRate: company.interestRate,
      maxLoanAmount: company.maxLoanAmount,
      minDownPayment: company.minDownPayment,
      processingFee: company.processingFee,
      loanPeriod: company.loanPeriod,
      phone: company.phone,
      email: company.email,
      website: company.website,
      branches: company.branches,
      isActive: company.isActive
    }));

    res.json({
      success: true,
      data,
      message: 'Finance companies retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching finance companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finance companies',
      error: error.message
    });
  }
};

module.exports = {
  getActiveFinanceCompanies
};
