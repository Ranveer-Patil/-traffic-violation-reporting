// backend/services/aiService.js
// AI verification pipeline: Hive Moderation + Google Vision
const fs = require('fs');
const path = require('path');

const HIVE_API_KEY = process.env.HIVE_API_KEY;
const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_API_KEY;

// ── Indian Number Plate Regex ─────────────────────────────────────────────────
// Formats: MH12AB1234, DL 01 AB 1234, KA-05-EF-5678, etc.
const INDIAN_PLATE_REGEX = /\b([A-Z]{2})\s?[-]?\s?(\d{1,2})\s?[-]?\s?([A-Z]{1,3})\s?[-]?\s?(\d{1,4})\b/;

function validateIndianPlate(plate) {
  if (!plate) return false;
  const clean = plate.replace(/[\s-]/g, '').toUpperCase();
  // State codes: 2 letters, District: 1-2 digits, Series: 1-3 letters, Number: 1-4 digits
  return /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(clean) && clean.length >= 6 && clean.length <= 13;
}

function extractPlateFromTexts(texts) {
  if (!texts || !texts.length) return null;
  // Concatenate all detected text, then find plate pattern
  const blob = texts.map(t => t.toUpperCase()).join(' ');
  const match = blob.match(INDIAN_PLATE_REGEX);
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}${match[4]}`;
}

// ── Hive API — Image Authenticity ─────────────────────────────────────────────
async function checkImageAuthenticity(imagePath) {
  if (!HIVE_API_KEY) {
    console.log('⚠ HIVE_API_KEY not set — using mock authenticity check');
    return { fakeScore: 0.05, isLikelyFake: false, provider: 'mock' };
  }

  try {
    const FormData = require('form-data');
    const axios = require('axios');
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));

    const res = await axios.post('https://api.thehive.ai/api/v2/task/sync', form, {
      headers: { ...form.getHeaders(), Authorization: `Token ${HIVE_API_KEY}` },
      timeout: 30000,
    });

    const classes = res.data?.status?.[0]?.response?.output?.[0]?.classes || [];
    const aiGenerated = classes.find(c => c.class === 'ai_generated');
    const fakeScore = aiGenerated ? aiGenerated.score : 0;

    return { fakeScore: Math.round(fakeScore * 100) / 100, isLikelyFake: fakeScore > 0.8, provider: 'hive' };
  } catch (err) {
    console.error('Hive API error:', err.message);
    return { fakeScore: 0, isLikelyFake: false, provider: 'hive_error', error: err.message };
  }
}

// ── Google Vision — Object + Text Detection ───────────────────────────────────
async function detectObjectsAndText(imagePath) {
  if (!GOOGLE_VISION_KEY) {
    console.log('⚠ GOOGLE_VISION_API_KEY not set — using mock detection');
    return {
      labels: ['Car', 'Vehicle', 'Road', 'Motor vehicle'],
      texts: ['MH12AB1234'],
      vehicleDetected: true,
      objects: [{ name: 'Car', score: 0.95 }],
      provider: 'mock',
    };
  }

  try {
    const axios = require('axios');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');

    const body = {
      requests: [{
        image: { content: base64 },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 15 },
          { type: 'TEXT_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        ],
      }],
    };

    const res = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
      body,
      { timeout: 30000 }
    );

    const response = res.data.responses[0];
    const labels = (response.labelAnnotations || []).map(l => l.description);
    const texts = (response.textAnnotations || []).map(t => t.description);
    const objects = (response.localizedObjectAnnotations || []).map(o => ({
      name: o.name,
      score: Math.round(o.score * 100) / 100,
    }));

    const vehicleKeywords = ['car', 'vehicle', 'motorcycle', 'truck', 'bus', 'auto', 'scooter', 'bike', 'motor vehicle', 'land vehicle', 'wheel'];
    const vehicleDetected = labels.some(l => vehicleKeywords.includes(l.toLowerCase())) ||
                            objects.some(o => vehicleKeywords.includes(o.name.toLowerCase()));

    return { labels, texts, vehicleDetected, objects, provider: 'google_vision' };
  } catch (err) {
    console.error('Google Vision error:', err.message);
    return { labels: [], texts: [], vehicleDetected: false, objects: [], provider: 'vision_error', error: err.message };
  }
}

// ── Full Verification Pipeline ────────────────────────────────────────────────
async function verifyImage(absolutePath) {
  const [authenticity, detection] = await Promise.all([
    checkImageAuthenticity(absolutePath),
    detectObjectsAndText(absolutePath),
  ]);

  const plateNumber = extractPlateFromTexts(detection.texts);
  const plateValid = validateIndianPlate(plateNumber);

  return {
    authenticity,
    detection,
    plateNumber: plateNumber || null,
    plateValid,
  };
}

module.exports = {
  verifyImage,
  checkImageAuthenticity,
  detectObjectsAndText,
  extractPlateFromTexts,
  validateIndianPlate,
  INDIAN_PLATE_REGEX,
};
