/**
 * Shared loan calculation helpers.
 *
 * Extracted so the Loan Calculator (FinancialCalculator.js) and the
 * Finance Company Comparison (ComparisonTable.js) use the exact same
 * EMI/amortization formula instead of maintaining two implementations.
 */

// Standard amortization/EMI formula, unchanged from the original implementation:
// EMI = [P x R x (1 + R)^N] / [(1 + R)^N - 1]
export function calculateEmi(principal, annualRatePercent, months) {
  const monthlyRate = annualRatePercent / 100 / 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// Adds thousand separators to a whole-number currency string, e.g. 1234567 -> "1,234,567"
export function formatCurrency(value) {
  if (!isFinite(value)) return '0';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Evaluate a single finance company's eligibility and payment figures for a given
 * loan amount / down-payment percentage / loan period. Shared by ComparisonTable
 * (Step 4) and SmartRecommendation (Step 5) so eligibility rules and the EMI
 * formula are defined in exactly one place.
 *
 * A company is eligible only when:
 *  - the loan amount is > 0
 *  - loan amount <= company.maxLoanAmount (when set)
 *  - buyer's down payment % >= company.minDownPayment (when set)
 *  - the selected loan period is within company.loanPeriod.minMonths/maxMonths (when set)
 */
export function evaluateCompanyFinancing(company, loanAmount, downPaymentPercent, months) {
  const reasons = [];

  if (typeof company.maxLoanAmount === 'number' && loanAmount > company.maxLoanAmount) {
    reasons.push('Exceeds maximum loan amount');
  }

  if (
    typeof company.minDownPayment === 'number' &&
    company.minDownPayment > 0 &&
    downPaymentPercent < company.minDownPayment
  ) {
    reasons.push(`Below minimum down payment (${company.minDownPayment}%)`);
  }

  const minMonths = company.loanPeriod?.minMonths;
  const maxMonths = company.loanPeriod?.maxMonths;
  if (typeof minMonths === 'number' && months < minMonths) {
    reasons.push(`Loan period below minimum (${minMonths} months)`);
  }
  if (typeof maxMonths === 'number' && months > maxMonths) {
    reasons.push(`Loan period exceeds maximum (${maxMonths} months)`);
  }

  let eligible = reasons.length === 0 && loanAmount > 0;

  let emi = null;
  let totalInterest = null;
  let totalLoanRepayment = null;
  const processingFee = company.processingFee || 0;
  let overallCost = null;

  if (eligible) {
    const rawEmi = calculateEmi(loanAmount, company.interestRate, months);
    if (isFinite(rawEmi)) {
      emi = rawEmi;
      totalLoanRepayment = emi * months;
      totalInterest = totalLoanRepayment - loanAmount;
      overallCost = totalLoanRepayment + processingFee;
    } else {
      reasons.push('Unable to calculate payment for these terms');
      eligible = false;
    }
  }

  return {
    company,
    eligible,
    reasons,
    emi,
    totalInterest,
    totalLoanRepayment,
    processingFee,
    overallCost
  };
}
