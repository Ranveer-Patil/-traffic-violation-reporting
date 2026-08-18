// backend/services/ruleEngine.js
// Decision engine for traffic violation reports

const THRESHOLDS = {
  FAKE_REJECT: 0.8,          // fakeScore above this = reject
  FAKE_WARNING: 0.5,         // fakeScore above this = flag for manual review
  MIN_VIOLATION_SCORE: 0.3,  // below this = low confidence
};

/**
 * Evaluate a report through the rule engine.
 * @param {Object} aiResult - Output from aiService.verifyImage()
 * @returns {Object} Decision payload
 */
function evaluate(aiResult) {
  const { authenticity, detection, plateNumber, plateValid } = aiResult;

  const fakeScore = authenticity.fakeScore;
  const vehicleDetected = detection.vehicleDetected;

  // ── Rejection Rules ─────────────────────────────────────────────────────────
  const rejections = [];

  if (fakeScore > THRESHOLDS.FAKE_REJECT) {
    rejections.push(`Image appears AI-generated or manipulated (fake score: ${fakeScore})`);
  }

  if (!vehicleDetected) {
    rejections.push('No vehicle detected in the image');
  }

  if (!plateNumber) {
    rejections.push('No number plate text detected');
  } else if (!plateValid) {
    rejections.push(`Invalid Indian plate format: ${plateNumber}`);
  }

  // ── Violation Score Calculation ──────────────────────────────────────────────
  let violationScore = 0;

  // Base: image is real
  if (fakeScore < THRESHOLDS.FAKE_WARNING) violationScore += 0.3;
  else if (fakeScore < THRESHOLDS.FAKE_REJECT) violationScore += 0.1;

  // Vehicle present
  if (vehicleDetected) violationScore += 0.3;

  // Valid plate
  if (plateNumber && plateValid) violationScore += 0.3;
  else if (plateNumber) violationScore += 0.1;

  // Bonus: multiple vehicle-related labels
  const vLabels = (detection.labels || []).filter(l =>
    ['car', 'vehicle', 'motorcycle', 'truck', 'road', 'traffic', 'intersection', 'highway'].includes(l.toLowerCase())
  );
  if (vLabels.length >= 3) violationScore += 0.1;

  violationScore = Math.min(1, Math.round(violationScore * 100) / 100);

  // ── Final Decision ──────────────────────────────────────────────────────────
  let finalDecision, status;
  if (rejections.length > 0) {
    finalDecision = 'REJECTED';
    status = 'Rejected';
  } else if (fakeScore > THRESHOLDS.FAKE_WARNING || violationScore < THRESHOLDS.MIN_VIOLATION_SCORE) {
    finalDecision = 'NEEDS_REVIEW';
    status = 'Pending';
  } else {
    finalDecision = 'ACCEPTED';
    status = 'Pending'; // Still needs admin approval
  }

  return {
    fakeScore,
    vehicleDetected,
    plateNumber: plateNumber || null,
    plateValid,
    violationScore,
    finalDecision,
    status,
    rejections,
    labels: detection.labels || [],
    objects: detection.objects || [],
    providers: {
      authenticity: authenticity.provider,
      detection: detection.provider,
    },
  };
}

module.exports = { evaluate, THRESHOLDS };
