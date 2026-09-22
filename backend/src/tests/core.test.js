const { addScore, updateScore, deleteScore, listScores, validateScoreInput, pruneScores } = require('../services/scoreService');
const { calculateContribution, validateContribution } = require('../services/charityService');
const { simulateDraw, createDraw, countMatches } = require('../services/drawService');
const { calculatePrizePool, calculateTierAmounts, calculateWinners } = require('../services/prizeService');

describe('score rules', () => {
  test('accepts valid score', () => {
    const result = validateScoreInput({ score: 24, date: '2026-09-15' });
    expect(result.valid).toBe(true);
  });

  test('rejects score below 1', () => {
    const result = validateScoreInput({ score: 0, date: '2026-09-15' });
    expect(result.valid).toBe(false);
  });

  test('rejects score above 45', () => {
    const result = validateScoreInput({ score: 46, date: '2026-09-15' });
    expect(result.valid).toBe(false);
  });

  test('rejects impossible calendar dates', () => {
    const result = validateScoreInput({ score: 24, date: '2026-02-31' });
    expect(result.valid).toBe(false);
  });

  test('rejects duplicate date', () => {
    const scores = [
      { userId: 'u1', date: '2026-09-15', score: 35 }
    ];
    const result = validateScoreInput({ score: 30, date: '2026-09-15', existingScores: scores });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/already exists/i);
  });

  test('edits an existing date', () => {
    const existing = [{ userId: 'u1', date: '2026-09-15', score: 35 }];
    const updated = updateScore(existing, { userId: 'u1', date: '2026-09-15', score: 40 });
    expect(updated[0].score).toBe(40);
  });

  test('deletes a score', () => {
    const existing = [{ userId: 'u1', date: '2026-09-15', score: 35 }];
    const updated = deleteScore(existing, '2026-09-15');
    expect(updated).toHaveLength(0);
  });

  test('enforces five-score retention limit', () => {
    let scores = [];
    for (let i = 1; i <= 6; i += 1) {
      scores = addScore(scores, { userId: 'u1', date: `2026-09-${String(i).padStart(2, '0')}`, score: 30 + i });
    }
    expect(scores).toHaveLength(5);
  });

  test('removes the oldest retained score when a sixth is added', () => {
    let scores = [
      { userId: 'u1', date: '2026-09-01', score: 29 },
      { userId: 'u1', date: '2026-09-10', score: 38 },
      { userId: 'u1', date: '2026-09-15', score: 31 },
      { userId: 'u1', date: '2026-09-18', score: 34 },
      { userId: 'u1', date: '2026-09-20', score: 40 },
    ];
    scores = addScore(scores, { userId: 'u1', date: '2026-10-01', score: 35 });
    expect(scores.map((s) => s.date)).toEqual(['2026-10-01', '2026-09-20', '2026-09-18', '2026-09-15', '2026-09-10']);
    expect(scores.some((s) => s.date === '2026-09-01')).toBe(false);
  });

  test('returns scores in reverse chronological order', () => {
    const scores = [
      { userId: 'u1', date: '2026-09-01', score: 29 },
      { userId: 'u1', date: '2026-09-20', score: 40 },
      { userId: 'u1', date: '2026-09-15', score: 31 },
    ];
    const sorted = listScores(scores);
    expect(sorted.map((s) => s.date)).toEqual(['2026-09-20', '2026-09-15', '2026-09-01']);
  });
});

describe('charity contribution rules', () => {
  test('enforces a 10% minimum contribution', () => {
    const result = validateContribution({ percent: 9 });
    expect(result.valid).toBe(false);
  });

  test('allows increased contribution percentage', () => {
    const result = validateContribution({ percent: 18 });
    expect(result.valid).toBe(true);
  });

  test('calculates contribution value from a subscription fee', () => {
    expect(calculateContribution({ subscriptionFee: 40, percent: 25 })).toBe(10);
  });
});

describe('draw and prize logic', () => {
  test('creates a draw that can be simulated', () => {
    const draw = createDraw({ month: '2026-09', mode: 'RANDOM' });
    expect(draw.month).toBe('2026-09');
    expect(draw.mode).toBe('RANDOM');
  });

  test('simulates a random draw result', () => {
    const draw = simulateDraw({ mode: 'RANDOM', numbers: [12, 3, 19, 27, 8] });
    expect(draw.winningNumbers).toHaveLength(5);
    expect(draw.comparison).toBeDefined();
  });

  test('generates five unique numbers in algorithmic mode', () => {
    const draw = simulateDraw({ mode: 'ALGORITHMIC', scoreEntries: [{ score: 40 }, { score: 40 }, { score: 12 }] });
    expect(draw.winningNumbers).toHaveLength(5);
    expect(new Set(draw.winningNumbers).size).toBe(5);
    expect(draw.winningNumbers.every((number) => number >= 1 && number <= 45)).toBe(true);
  });

  test('counts unique five-number matches accurately', () => {
    expect(countMatches([40, 40, 12, 3, 8], [40, 12, 3, 8, 27])).toBe(4);
    expect(countMatches([40, 12], [40, 12, 3, 8, 27])).toBe(2);
  });

  test('calculates the prize pool distribution', () => {
    const pool = calculatePrizePool({ activeSubscribers: 100, monthlyFee: 20 });
    expect(pool.total).toBe(2000);
    expect(pool.tiers['5'].percent).toBe(40);
    expect(pool.tiers['4'].percent).toBe(35);
    expect(pool.tiers['3'].percent).toBe(25);
  });

  test('calculates equal split for multiple winners in a tier', () => {
    const winners = calculateWinners({
      entries: [
        { userId: 'a', matchedNumbers: 4 },
        { userId: 'b', matchedNumbers: 4 },
      ],
      prizePot: 700,
      tier: '4'
    });
    expect(winners).toHaveLength(2);
    expect(winners[0].prize).toBe(350);
    expect(winners[1].prize).toBe(350);
  });
});
