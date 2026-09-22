function validateScoreInput({ score, date, existingScores = [] }) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return { valid: false, error: 'Score must be a number.' };
  }

  if (score < 1 || score > 45) {
    return { valid: false, error: 'Score must be between 1 and 45.' };
  }

  const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { valid: false, error: 'A valid date is required.' };
  }

  const duplicate = existingScores.some((item) => item.date === date);
  if (duplicate) {
    return { valid: false, error: 'A score for that date already exists.' };
  }

  return { valid: true };
}

function pruneScores(scores) {
  const sorted = [...scores].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.slice(0, 5);
}

function addScore(scores, scoreEntry) {
  const validation = validateScoreInput({
    score: scoreEntry.score,
    date: scoreEntry.date,
    existingScores: scores,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const updated = [...scores, scoreEntry];
  return pruneScores(updated);
}

function updateScore(scores, scoreEntry) {
  const filtered = scores.filter((item) => item.date !== scoreEntry.date);
  const updated = [...filtered, scoreEntry];
  return pruneScores(updated);
}

function deleteScore(scores, date) {
  return scores.filter((item) => item.date !== date);
}

function listScores(scores) {
  return [...scores].sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  validateScoreInput,
  pruneScores,
  addScore,
  updateScore,
  deleteScore,
  listScores,
};
