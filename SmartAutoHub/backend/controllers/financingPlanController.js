/**
 * Financing Plan Controller
 * Allows a logged-in buyer to save, list, and delete their financing plans.
 *
 * Step 6 of the Financial Aid improvement plan. Uses the existing
 * FinancingPlan model (Step 1) and FinanceCompany model (Step 1/2) -
 * no new models/collections are created here.
 */

const FinancingPlan = require('../models/FinancingPlan');
const FinanceCompany = require('../models/FinanceCompany');

/**
 * @desc    Save a new financing plan for the authenticated user
 * @route   POST /api/financial/plans
 * @access  Private
 */
const createFinancingPlan = async (req, res) => {
  try {
    const {
      vehicleId,
      financeCompanyId,
      vehiclePrice,
      downPayment,
      loanAmount,
      interestRate,
      loanPeriod,
      monthlyPayment,
      totalInterest,
      totalPayment,
      processingFee
    } = req.body;

    // Never trust a userId from the client - always use the authenticated user
    const userId = req.user._id;

    if (!financeCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'financeCompanyId is required'
      });
    }

    const financeCompany = await FinanceCompany.findOne({ _id: financeCompanyId, isActive: true });
    if (!financeCompany) {
      return res.status(400).json({
        success: false,
        message: 'Selected finance company was not found or is not active'
      });
    }

    const price = Number(vehiclePrice);
    const down = Number(downPayment) || 0;
    const loan = Number(loanAmount);
    const rate = Number(interestRate);
    const period = Number(loanPeriod);
    const monthly = Number(monthlyPayment);
    const interestTotal = Number(totalInterest);
    const paymentTotal = Number(totalPayment);
    const fee = Number(processingFee) || 0;

    const errors = [];
    if (!Number.isFinite(price) || price <= 0) errors.push('vehiclePrice must be greater than 0');
    if (!Number.isFinite(down) || down < 0) errors.push('downPayment cannot be negative');
    if (Number.isFinite(price) && Number.isFinite(down) && down > price) {
      errors.push('downPayment cannot be greater than vehiclePrice');
    }
    if (!Number.isFinite(loan) || loan < 0) errors.push('loanAmount cannot be negative');
    if (!Number.isFinite(rate) || rate < 0) errors.push('interestRate cannot be negative');
    if (!Number.isFinite(period) || period <= 0 || !Number.isInteger(period)) {
      errors.push('loanPeriod must be a positive whole number of months');
    }
    if (!Number.isFinite(monthly) || monthly < 0) errors.push('monthlyPayment cannot be negative');
    if (!Number.isFinite(interestTotal) || interestTotal < 0) errors.push('totalInterest cannot be negative');
    if (!Number.isFinite(paymentTotal) || paymentTotal < 0) errors.push('totalPayment cannot be negative');
    if (!Number.isFinite(fee) || fee < 0) errors.push('processingFee cannot be negative');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid financing plan values',
        errors
      });
    }

    const planData = {
      userId,
      financeCompanyId,
      vehiclePrice: price,
      downPayment: down,
      loanAmount: loan,
      interestRate: rate,
      loanPeriod: period,
      monthlyPayment: monthly,
      totalInterest: interestTotal,
      totalPayment: paymentTotal,
      processingFee: fee
    };

    // vehicleId is optional - only attach it when provided (see Step 6 scope notes)
    if (vehicleId) {
      planData.vehicleId = vehicleId;
    }

    const plan = await FinancingPlan.create(planData);
    const populatedPlan = await plan.populate('financeCompanyId', 'name logo interestRate');

    res.status(201).json({
      success: true,
      message: 'Financing plan saved successfully',
      data: populatedPlan
    });
  } catch (error) {
    console.error('Error creating financing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving financing plan',
      error: error.message
    });
  }
};

/**
 * @desc    Get all financing plans belonging to the authenticated user
 * @route   GET /api/financial/plans
 * @access  Private
 */
const getFinancingPlans = async (req, res) => {
  try {
    const plans = await FinancingPlan.find({ userId: req.user._id })
      .populate('financeCompanyId', 'name logo interestRate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: plans,
      message: 'Financing plans retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching financing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financing plans',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a financing plan owned by the authenticated user
 * @route   DELETE /api/financial/plans/:id
 * @access  Private
 */
const deleteFinancingPlan = async (req, res) => {
  try {
    const plan = await FinancingPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Financing plan not found'
      });
    }

    // A user may only delete their own saved plan
    if (plan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this financing plan'
      });
    }

    await plan.deleteOne();

    res.json({
      success: true,
      message: 'Financing plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting financing plan',
      error: error.message
    });
  }
};

module.exports = {
  createFinancingPlan,
  getFinancingPlans,
  deleteFinancingPlan
};
