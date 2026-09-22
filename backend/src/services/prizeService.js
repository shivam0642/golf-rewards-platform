function calculatePrizePool({ activeSubscribers = 0, monthlyFee = 0, jackpotRollover = 0 }) {
  const total = activeSubscribers * monthlyFee;
  const tiers = {
    '5': { percent: 40, amount: (total * 0.4) + Number(jackpotRollover || 0) },
    '4': { percent: 35, amount: total * 0.35 },
    '3': { percent: 25, amount: total * 0.25 },
  };

  return {
    total,
    tiers,
  };
}

function calculateTierAmounts({ total, tiers }) {
  return Object.fromEntries(
    Object.entries(tiers).map(([key, value]) => [key, Number((total * (value.percent / 100)).toFixed(2))]),
  );
}

function calculateWinners({ entries = [], prizePot = 0, tier = '4' }) {
  const filtered = entries.filter((entry) => entry.matchedNumbers === Number(tier));
  const share = filtered.length ? Number((prizePot / filtered.length).toFixed(2)) : 0;

  return filtered.map((entry, index) => ({
    userId: entry.userId,
    matchedNumbers: entry.matchedNumbers,
    prize: Number((share + (index === 0 ? 0 : 0)).toFixed(2)),
  }));
}

module.exports = {
  calculatePrizePool,
  calculateTierAmounts,
  calculateWinners,
};
