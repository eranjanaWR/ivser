/**
 * Financial Controller
 * Handles financial calculations, inquiries, and agent requests
 */

const FinancialInquiry = require('../models/FinancialInquiry');

// Finance company data with interest rates
const FINANCE_COMPANIES = {
  'lb-finance': { name: 'LB Finance', interestRate: 7.5 },
  'lolc-finance': { name: 'LOLC Finance', interestRate: 8.0 },
  'central-finance': { name: 'Central Finance', interestRate: 7.8 },
  'hnb-finance': { name: 'HNB Finance', interestRate: 8.5 },
  'singer-finance': { name: 'Singer Finance', interestRate: 8.2 }
};

/**
 * @desc    Calculate EMI
 * @route   POST /api/financial/calculate
 * @access  Public
 */
const calculateEMI = async (req, res) => {
  try {
    const { vehiclePrice, downPayment, loanPeriod, companyIds } = req.body;

    // Validate input
    if (!vehiclePrice || vehiclePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle price is required and must be greater than 0'
      });
    }

    if (!loanPeriod || loanPeriod < 12 || loanPeriod > 84) {
      return res.status(400).json({
        success: false,
        message: 'Loan period must be between 12 and 84 months'
      });
    }

    const down = parseFloat(downPayment) || 0;
    const principal = vehiclePrice - down;

    if (principal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Down payment cannot exceed vehicle price'
      });
    }

    const calculations = {};
    const companies = Array.isArray(companyIds) ? companyIds : [companyIds];

    companies.forEach(companyId => {
      const company = FINANCE_COMPANIES[companyId];
      if (!company) return;

      const monthlyRate = company.interestRate / 100 / 12;
      const months = parseInt(loanPeriod);

      // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
      const denominator = Math.pow(1 + monthlyRate, months) - 1;
      const emi = principal * (numerator / denominator);

      const totalPayment = emi * months;
      const totalInterest = totalPayment - principal;

      calculations[companyId] = {
        company: company.name,
        interestRate: company.interestRate,
        principal,
        monthlyEmi: isFinite(emi) ? Math.round(emi) : 0,
        totalPayment: isFinite(totalPayment) ? Math.round(totalPayment) : 0,
        totalInterest: isFinite(totalInterest) ? Math.round(totalInterest) : 0
      };
    });

    res.json({
      success: true,
      data: {
        calculations,
        summary: {
          vehiclePrice: parseFloat(vehiclePrice),
          downPayment: down,
          loanAmount: principal,
          loanPeriod: parseInt(loanPeriod)
        }
      }
    });
  } catch (error) {
    console.error('EMI calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating EMI',
      error: error.message
    });
  }
};

/**
 * @desc    Submit agent contact inquiry
 * @route   POST /api/financial/inquiry
 * @access  Public
 */
const submitInquiry = async (req, res) => {
  try {
    const { name, phone, email, vehicleCategory, selectedCompany, preferredDates, preferredTime } = req.body;

    // Validate required fields
    if (!name || !phone || !vehicleCategory || !selectedCompany) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, vehicleCategory, selectedCompany'
      });
    }

    // Validate phone format (basic)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must have at least 10 digits'
      });
    }

    // Validate company exists
    if (!FINANCE_COMPANIES[selectedCompany]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid finance company selected'
      });
    }

    // Create inquiry
    const inquiry = await FinancialInquiry.create({
      userId: req.user?._id || null,
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone.trim(),
      vehicleCategory,
      selectedCompany,
      preferredDates: Array.isArray(preferredDates) ? preferredDates : [],
      preferredTime: preferredTime || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. An agent will contact you shortly.',
      data: {
        inquiryId: inquiry._id,
        phone: inquiry.phone,
        company: FINANCE_COMPANIES[selectedCompany].name
      }
    });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting inquiry',
      error: error.message
    });
  }
};

/**
 * @desc    Get inquiry details (admin only)
 * @route   GET /api/financial/inquiry/:id
 * @access  Private (Admin)
 */
const getInquiry = async (req, res) => {
  try {
    const inquiry = await FinancialInquiry.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedAgent', 'firstName lastName email phone');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiry',
      error: error.message
    });
  }
};

/**
 * @desc    Get all inquiries (admin only)
 * @route   GET /api/financial/inquiries
 * @access  Private (Admin)
 */
const getInquiries = async (req, res) => {
  try {
    const { status, company, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (company) filter.selectedCompany = company;

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      FinancialInquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'firstName lastName email phone'),
      FinancialInquiry.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries',
      error: error.message
    });
  }
};

/**
 * @desc    Update inquiry status (admin only)
 * @route   PUT /api/financial/inquiry/:id
 * @access  Private (Admin)
 */
const updateInquiry = async (req, res) => {
  try {
    const { status, notes, assignedAgent } = req.body;

    const inquiry = await FinancialInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    if (status) {
      inquiry.status = status;
      if (status === 'contacted' && !inquiry.contactedAt) {
        inquiry.contactedAt = Date.now();
      }
    }

    if (notes) inquiry.notes = notes;
    if (assignedAgent) inquiry.assignedAgent = assignedAgent;

    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inquiry',
      error: error.message
    });
  }
};

/**
 * @desc    Get finance company list with rates
 * @route   GET /api/financial/companies
 * @access  Public
 */
const getCompanies = async (req, res) => {
  try {
    const companies = Object.entries(FINANCE_COMPANIES).map(([id, company]) => ({
      id,
      ...company
    }));

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

module.exports = {
  calculateEMI,
  submitInquiry,
  getInquiry,
  getInquiries,
  updateInquiry,
  getCompanies
};
