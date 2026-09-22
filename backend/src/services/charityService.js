function validateContribution({ percent }) {
  if (typeof percent !== 'number' || Number.isNaN(percent)) {
    return { valid: false, error: 'Contribution percentage must be numeric.' };
  }

  if (percent < 10) {
    return { valid: false, error: 'Contribution percentage must be at least 10%.' };
  }

  return { valid: true };
}

function calculateContribution({ subscriptionFee, percent }) {
  return Number(((subscriptionFee * percent) / 100).toFixed(2));
}

module.exports = {
  validateContribution,
  calculateContribution,
};
