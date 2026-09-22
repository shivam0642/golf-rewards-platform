function createDraw({ month, mode = 'RANDOM' }) {
  return { month, mode, createdAt: new Date().toISOString() };
}

function randomNumbers(count = 5, max = 45, random = Math.random) {
  const numbers = new Set();
  while (numbers.size < count) numbers.add(Math.floor(random() * max) + 1);
  return [...numbers];
}

function weightedNumbers(scoreEntries = [], count = 5, max = 45, random = Math.random) {
  const frequencies = Array.from({ length: max + 1 }, () => 0);
  scoreEntries.forEach((entry) => {
    const value = Number(entry.score);
    if (Number.isInteger(value) && value >= 1 && value <= max) frequencies[value] += 1;
  });
  const selected = new Set();
  while (selected.size < count) {
    const candidates = Array.from({ length: max }, (_, index) => index + 1).filter((value) => !selected.has(value));
    const totalWeight = candidates.reduce((sum, value) => sum + frequencies[value] + 1, 0);
    let cursor = random() * totalWeight;
    for (const value of candidates) {
      cursor -= frequencies[value] + 1;
      if (cursor <= 0) { selected.add(value); break; }
    }
  }
  return [...selected];
}

function simulateDraw({ mode = 'RANDOM', numbers, scoreEntries = [], random = Math.random }) {
  const supplied = Array.isArray(numbers) && numbers.length === 5
    && new Set(numbers).size === 5 && numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 45);
  const winningNumbers = supplied
    ? [...numbers]
    : mode === 'ALGORITHMIC' ? weightedNumbers(scoreEntries, 5, 45, random) : randomNumbers(5, 45, random);

  return {
    mode,
    winningNumbers,
    comparison: winningNumbers.map((value) => ({ value })),
    simulatedAt: new Date().toISOString(),
  };
}

function countMatches(numbers = [], winningNumbers = []) {
  const winning = new Set(winningNumbers);
  return new Set(numbers).size ? [...new Set(numbers)].filter((number) => winning.has(number)).length : 0;
}

module.exports = {
  createDraw,
  simulateDraw,
  randomNumbers,
  weightedNumbers,
  countMatches,
};
